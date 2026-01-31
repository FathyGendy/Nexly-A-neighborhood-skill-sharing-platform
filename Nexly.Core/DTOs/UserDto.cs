namespace Nexly.Core.DTOs;

public class UserDto
{
    public string Id { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? CoverPhoto { get; set; }

    public bool IsServiceProvider { get; set; }
    
    // --- Trust System ---
    public bool IsVerifiedNeighbor { get; set; }
    public int VouchesCount { get; set; }
    public int MonthlyHelps { get; set; } 
    
    public DateTime CreatedAt { get; set; }

    // --- Profile Extra Data ---
    public List<ServiceResponseDto>? Services { get; set; }
    public List<ReviewResponseDto>? Reviews { get; set; }
}