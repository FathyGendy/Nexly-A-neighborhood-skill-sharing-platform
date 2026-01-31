using Nexly.Core.Enums;

namespace Nexly.Core.DTOs;

public class BookingResponseDto
{
    public int Id { get; set; }
    public string ServiceTitle { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string ClientName { get; set; } = string.Empty;
    public DateTime ScheduledDate { get; set; }
    public string StartTime { get; set; } = string.Empty;
    public string EndTime { get; set; } = string.Empty;
    public decimal DurationHours { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }

    public string PaymentMethod { get; set; } = "Cash"; 
    public string? ExchangeServiceTitle { get; set; } 
    public bool HasBeenReviewed { get; set; } 

    public string? MeetingLink { get; set; }
}