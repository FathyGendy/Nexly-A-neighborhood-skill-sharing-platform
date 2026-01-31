using Microsoft.AspNetCore.Authorization; 
using Microsoft.AspNetCore.Identity; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore; 
using Nexly.Core.DTOs;
using Nexly.Core.Entities; 
using Nexly.Core.Interfaces;
using Nexly.Infrastructure.Data; 
using Nexly.Infrastructure.Services; 
using System.Security.Claims; 

namespace Nexly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<ApplicationUser> _userManager; 
    private readonly ILogger<AuthController> _logger;
    private readonly ApplicationDbContext _context;
    private readonly IImageService _imageService;

    public AuthController(
        IAuthService authService, 
        UserManager<ApplicationUser> userManager, 
        ILogger<AuthController> logger,
        ApplicationDbContext context,
        IImageService imageService)
    {
        _authService = authService;
        _userManager = userManager;
        _logger = logger;
        _context = context;
        _imageService = imageService;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return Unauthorized();

        return Ok(new 
        {
            id = user.Id,
            slug = user.Slug,
            firstName = user.FirstName,
            lastName = user.LastName,
            email = user.Email,
            timeCredits = user.TimeCredits, 
            isServiceProvider = user.IsServiceProvider,
            isVerifiedNeighbor = user.IsVerifiedNeighbor,
            isVerificationPending = user.IsVerificationPending,
            vouchesCount = user.VouchesCount,
            profileImageUrl = user.ProfileImageUrl,
            coverPhoto = user.CoverPhoto, 
            bio = user.Bio,
            address = user.Address,
            phoneNumber = user.PhoneNumber
        });
    }

    [HttpGet("profile/{idOrSlug}")]
    public async Task<ActionResult<UserDto>> GetProfile(string idOrSlug)
    {
        try
        {
            var profile = await _authService.GetUserProfileAsync(idOrSlug);
            return Ok(profile);
        }
        catch (Exception ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPut("profile")]
    [Authorize]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromForm] ProfileUpdateForm form)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
            var dto = new UserDto
            {
                FirstName = form.FirstName,
                LastName = form.LastName,
                Bio = form.Bio,
                Address = form.Address,
                PhoneNumber = form.PhoneNumber
            };

            if (form.ProfileImage != null)
            {
                var result = await _imageService.UploadImageAsync(form.ProfileImage);
                dto.ProfileImageUrl = result; 
            }

            if (form.CoverPhoto != null)
            {
                var result = await _imageService.UploadImageAsync(form.CoverPhoto);
                dto.CoverPhoto = result;
            }

            var updatedUser = await _authService.UpdateProfileAsync(userId, dto);
            return Ok(updatedUser);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    public class ProfileUpdateForm
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Bio { get; set; }
        public string Address { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public IFormFile? ProfileImage { get; set; }
        public IFormFile? CoverPhoto { get; set; }
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound("User not found");

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok(new { message = "Password changed successfully" });
    }

    [HttpDelete("deactivate")]
    [Authorize]
    public async Task<IActionResult> DeactivateAccount()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId)) return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null) return NotFound();

        try 
        {
            var bookings = _context.Bookings.Where(b => b.ClientId == userId || b.ProviderId == userId);
            _context.Bookings.RemoveRange(bookings);

            var services = _context.Services.Where(s => s.ProviderId == userId);
            _context.Services.RemoveRange(services);

            var messages = _context.Messages.Where(m => m.SenderId == userId || m.ReceiverId == userId);
            _context.Messages.RemoveRange(messages);

            var reviews = _context.Reviews.Where(r => r.ReviewerId == userId || r.RevieweeId == userId);
            _context.Reviews.RemoveRange(reviews);

            await _context.SaveChangesAsync();

            var result = await _userManager.DeleteAsync(user);
            if (result.Succeeded) return Ok(new { message = "Account deleted" });
            return BadRequest("Could not delete account. System error.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting account for user {UserId}", userId);
            return StatusCode(500, "Internal error while deleting account.");
        }
    }

    [HttpGet("heroes")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetHeroes()
    {
        try
        {
            var heroes = await _authService.GetNeighborhoodHeroesAsync();
            return Ok(heroes.Take(3)); 
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching heroes");
            return BadRequest(new { message = "Could not fetch leaderboard" });
        }
    }

    [HttpPost("verify-id")]
    [Authorize]
    public async Task<IActionResult> VerifyIdentity([FromForm] IFormFile idImage)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        if (idImage == null || idImage.Length == 0)
            return BadRequest("Please upload a valid ID image.");

        try
        {
            await _authService.VerifyIdentityAsync(userId, idImage);
            return Ok(new { message = "Verification request submitted successfully." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying identity");
            return BadRequest(new { message = "Error uploading ID. Please try again." });
        }
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterDto registerDto)
    {
        try
        {
            var response = await _authService.RegisterAsync(registerDto);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        try
        {
            var response = await _authService.LoginAsync(loginDto);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return Unauthorized(new { message = ex.Message });
        }
    }
}

public class ChangePasswordDto
{
    public required string CurrentPassword { get; set; }
    public required string NewPassword { get; set; }
}