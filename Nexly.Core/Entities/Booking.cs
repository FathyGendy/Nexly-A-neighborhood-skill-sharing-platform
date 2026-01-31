using Nexly.Core.Enums;

namespace Nexly.Core.Entities;

public class Booking
{
    public int Id { get; set; }
    public int ServiceId { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ProviderId { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public decimal DurationHours { get; set; }
    public BookingStatus Status { get; set; } = BookingStatus.Pending;
    public decimal TotalAmount { get; set; }
    
    public string PaymentMethod { get; set; } = "Cash"; 
    public int? ExchangeServiceId { get; set; }
    
    public string? StripePaymentIntentId { get; set; }
    public string? CancellationReason { get; set; }
    
    // Video Consultation Link ---
    public string? MeetingLink { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Service Service { get; set; } = null!; 
    public Service? ExchangeService { get; set; } 
    public ApplicationUser Client { get; set; } = null!;
    public ApplicationUser Provider { get; set; } = null!;
    public Review? Review { get; set; }
    public ICollection<Message> Messages { get; set; } = new List<Message>();
}