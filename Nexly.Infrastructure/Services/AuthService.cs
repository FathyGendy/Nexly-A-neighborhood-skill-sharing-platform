using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore; 
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Nexly.Core.DTOs;
using Nexly.Core.Entities;
using Nexly.Core.Enums; 
using Nexly.Core.Interfaces;
using Nexly.Infrastructure.Data; 
using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Mail;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;

namespace Nexly.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService; 

    public AuthService(
        UserManager<ApplicationUser> userManager, 
        IConfiguration configuration,
        ApplicationDbContext context,
        IImageService imageService) 
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
        _imageService = imageService;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto)
    {
        var existingUser = await _userManager.FindByEmailAsync(registerDto.Email);
        if (existingUser != null) throw new Exception("User with this email already exists");

        // --- Generate Unique Slug ---
        string baseSlug = GenerateSlug(registerDto.FirstName, registerDto.LastName);
        string finalSlug = baseSlug;
        int count = 1;
        while (await _context.Users.AnyAsync(u => u.Slug == finalSlug))
        {
            finalSlug = $"{baseSlug}-{count}";
            count++;
        }
        // --------------------------------
        var user = new ApplicationUser
        {
            UserName = registerDto.Email,
            Email = registerDto.Email,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            Slug = finalSlug, 
            PhoneNumber = registerDto.PhoneNumber,
            Address = registerDto.Address,
            Latitude = registerDto.Latitude,
            Longitude = registerDto.Longitude,
            Bio = registerDto.Bio,
            IsServiceProvider = registerDto.IsServiceProvider,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsVerifiedNeighbor = false,
            VouchesCount = 0
        };

        var result = await _userManager.CreateAsync(user, registerDto.Password);
        if (!result.Succeeded) throw new Exception($"Failed to create user: {string.Join(", ", result.Errors.Select(e => e.Description))}");

        var token = await GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Token = token,
            Expiration = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpirationInMinutes"])),
            User = MapToUserDto(user)
        };
    }

    private string GenerateSlug(string firstName, string lastName)
    {
        string text = $"{firstName}-{lastName}".ToLowerInvariant();
        // Remove invalid chars
        text = Regex.Replace(text, @"[^a-z0-9\s-]", ""); 
        // Convert multiple spaces/hyphens into one space
        text = Regex.Replace(text, @"[\s-]+", " ").Trim(); 
        // Replace spaces with hyphens
        text = Regex.Replace(text, @"\s", "-"); 
        return text;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto loginDto)
    {
        var user = await _userManager.FindByEmailAsync(loginDto.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, loginDto.Password))
        {
            throw new Exception("Invalid email or password");
        }

        var token = await GenerateJwtToken(user);

        return new AuthResponseDto
        {
            Token = token,
            Expiration = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_configuration["JwtSettings:ExpirationInMinutes"])),
            User = MapToUserDto(user)
        };
    }

    public async Task VerifyIdentityAsync(string userId, IFormFile idImage)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) throw new Exception("User not found");

        var imageUrl = await _imageService.UploadImageAsync(idImage);
        if (string.IsNullOrEmpty(imageUrl)) throw new Exception("Failed to upload ID image.");

        user.IsVerificationPending = true;
        await _userManager.UpdateAsync(user);
        await SendVerificationEmail(user, imageUrl);
    }

    private async Task SendVerificationEmail(ApplicationUser user, string idImageUrl)
    {
        var emailSettings = _configuration.GetSection("EmailSettings");
        var smtpServer = emailSettings["SmtpServer"];
        var port = int.Parse(emailSettings["Port"]!);
        var senderEmail = emailSettings["SenderEmail"];
        var password = emailSettings["Password"];
        var recipientEmail = "nxlspprt@gmail.com"; 

        // --- EMAIL BODY TEMPLATE ---
        string emailBody = $@"
        <div style='font-family: Arial, sans-serif; color: #333; max-width: 600px; border: 1px solid #ddd; padding: 20px; border-radius: 8px;'>
            <h2 style='color: #000;'>New Identity Verification Request</h2>
            
            <p style='font-size: 16px;'><strong>User:</strong> {user.FirstName} {user.LastName} (<a href='mailto:{user.Email}'>{user.Email}</a>)</p>
            
            <p style='font-size: 16px;'><strong>User ID:</strong> {user.Id}</p>
            
            <p style='font-size: 16px;'><strong>Registered Address:</strong> {user.Address ?? "N/A"}</p>
            
            <hr style='border: 1px solid #eee; margin: 20px 0;' />
            
            <h3>Government ID Image:</h3>
            
            <p>
                <a href='{idImageUrl}' style='background-color: #007bff; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;'>
                    Click here to view the uploaded ID
                </a>
            </p>
            
            <br/>
            <p style='color: #666; font-size: 14px;'>Please review and verify this user in the database manually.</p>
        </div>";
        // -----------------------------------

        var message = new MailMessage
        {
            From = new MailAddress(senderEmail!, "Nexly System"),
            Subject = $"[ID VERIFICATION] New Request: {user.FirstName} {user.LastName}",
            Body = emailBody,
            IsBodyHtml = true
        };
        message.To.Add(recipientEmail);

        using var client = new SmtpClient(smtpServer, port)
        {
            Credentials = new NetworkCredential(senderEmail, password),
            EnableSsl = true
        };
        await client.SendMailAsync(message);
    }

    // --- Get User By ID OR Slug ---
    public async Task<UserDto> GetUserProfileAsync(string idOrSlug)
    {
        // Try to find by Slug first, then by ID
        var user = await _context.Users
            .Include(u => u.ServicesOffered)
            .Include(u => u.ReviewsReceived)
                .ThenInclude(r => r.Reviewer)
            .FirstOrDefaultAsync(u => u.Slug == idOrSlug || u.Id == idOrSlug);

        if (user == null) throw new Exception("User not found");

        var dto = MapToUserDto(user);
        
        dto.Services = user.ServicesOffered
            .Where(s => s.IsActive)
            .Select(s => new ServiceResponseDto
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                HourlyRate = s.HourlyRate,
                Category = s.Category.ToString(), 
                ImageUrl = s.ImageUrl,
                AverageRating = s.AverageRating,
                TotalReviews = s.TotalReviews
            }).ToList();

        dto.Reviews = user.ReviewsReceived.OrderByDescending(r => r.CreatedAt).Select(r => new ReviewResponseDto
        {
            Id = r.Id,
            ReviewerName = $"{r.Reviewer.FirstName} {r.Reviewer.LastName}",
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        }).ToList();

        return dto;
    }

    public async Task<UserDto> UpdateProfileAsync(string userId, UserDto updateDto)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new Exception("User not found");

        bool hasChanges = false;

        if (!string.IsNullOrWhiteSpace(updateDto.FirstName) && user.FirstName != updateDto.FirstName) { user.FirstName = updateDto.FirstName; hasChanges = true; }
        if (!string.IsNullOrWhiteSpace(updateDto.LastName) && user.LastName != updateDto.LastName) { user.LastName = updateDto.LastName; hasChanges = true; }
        if (!string.IsNullOrWhiteSpace(updateDto.Address) && user.Address != updateDto.Address) { user.Address = updateDto.Address; hasChanges = true; }
        if (updateDto.PhoneNumber != null && user.PhoneNumber != updateDto.PhoneNumber) { user.PhoneNumber = updateDto.PhoneNumber; hasChanges = true; }
        if (updateDto.Bio != null && user.Bio != updateDto.Bio) { user.Bio = updateDto.Bio; hasChanges = true; }
        if (!string.IsNullOrEmpty(updateDto.ProfileImageUrl) && user.ProfileImageUrl != updateDto.ProfileImageUrl) { user.ProfileImageUrl = updateDto.ProfileImageUrl; hasChanges = true; }
        if (!string.IsNullOrEmpty(updateDto.CoverPhoto) && user.CoverPhoto != updateDto.CoverPhoto) { user.CoverPhoto = updateDto.CoverPhoto; hasChanges = true; }

        if (hasChanges)
        {
            user.UpdatedAt = DateTime.UtcNow;
            _context.Users.Update(user);
            await _context.SaveChangesAsync();
        }

        return MapToUserDto(user);
    }

    public async Task<IEnumerable<UserDto>> GetNeighborhoodHeroesAsync()
    {
        var currentMonth = DateTime.UtcNow.Month;
        var currentYear = DateTime.UtcNow.Year;

        var heroes = await _context.Users
            .Where(u => u.IsServiceProvider)
            .Select(u => new
            {
                User = u,
                MonthlyScore = u.BookingsAsProvider.Count(b => 
                    b.Status == BookingStatus.Completed && 
                    b.ScheduledDate.Month == currentMonth && 
                    b.ScheduledDate.Year == currentYear)
            })
            .OrderByDescending(x => x.MonthlyScore)
            .ThenByDescending(x => x.User.IsVerifiedNeighbor) 
            .Take(5)
            .ToListAsync();

        return heroes.Select(h => {
            var dto = MapToUserDto(h.User);
            dto.MonthlyHelps = h.MonthlyScore;
            return dto;
        }).Where(h => h.MonthlyHelps > 0); 
    }

    private async Task<string> GenerateJwtToken(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"];
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim("Slug", user.Slug ?? "") 
        };

        var roles = await _userManager.GetRolesAsync(user);
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwtSettings["ExpirationInMinutes"])),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private UserDto MapToUserDto(ApplicationUser user)
    {
        return new UserDto
        {
            Id = user.Id,
            Slug = user.Slug,
            Email = user.Email!,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address,
            Latitude = user.Latitude,
            Longitude = user.Longitude,
            Bio = user.Bio,
            ProfileImageUrl = user.ProfileImageUrl,
            CoverPhoto = user.CoverPhoto, 
            IsServiceProvider = user.IsServiceProvider,
            IsVerifiedNeighbor = user.IsVerifiedNeighbor,
            VouchesCount = user.VouchesCount,
            CreatedAt = user.CreatedAt
        };
    }
}