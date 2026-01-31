using Nexly.Core.Enums;

namespace Nexly.Core.Entities;

public class Service
{
    public int Id { get; set; }
    public string ProviderId { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ServiceCategory Category { get; set; }
    public decimal HourlyRate { get; set; }
    public string Currency { get; set; } = "USD";
    public bool IsActive { get; set; } = true;
    public double AverageRating { get; set; }
    public int TotalReviews { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
     public string? ImageUrl { get; set; } 

    // Navigation properties
    public ApplicationUser Provider { get; set; } = null!;
    public ICollection<ServiceImage> Images { get; set; } = new List<ServiceImage>();
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}