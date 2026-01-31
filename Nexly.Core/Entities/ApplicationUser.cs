using Microsoft.AspNetCore.Identity;
using Nexly.Core.Entities;

namespace Nexly.Core.Entities;

public class ApplicationUser : IdentityUser
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    
    public string Slug { get; set; } = string.Empty;

    public string? Bio { get; set; }
    public string? ProfileImageUrl { get; set; }
    public string? CoverPhoto { get; set; } 
    
    public string Address { get; set; } = string.Empty;
    public double Latitude { get; set; }
    public double Longitude { get; set; }
    public bool IsServiceProvider { get; set; }
    
    // Stripe
    public string? StripeCustomerId { get; set; }
    public string? StripeAccountId { get; set; }

    // Time Banking
    public int TimeCredits { get; set; } = 5;

    // --- Verified Neighbor Trust System ---
    public bool IsVerifiedNeighbor { get; set; } 
    public bool IsVerificationPending { get; set; }
    public int VouchesCount { get; set; } 

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Service> ServicesOffered { get; set; } = new List<Service>();
    public ICollection<Booking> BookingsAsClient { get; set; } = new List<Booking>();
    public ICollection<Booking> BookingsAsProvider { get; set; } = new List<Booking>();
    public ICollection<Review> ReviewsGiven { get; set; } = new List<Review>();
    public ICollection<Review> ReviewsReceived { get; set; } = new List<Review>();
}