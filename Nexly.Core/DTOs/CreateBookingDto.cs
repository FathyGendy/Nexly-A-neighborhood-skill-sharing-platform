using System.ComponentModel.DataAnnotations;

namespace Nexly.Core.DTOs;

public class CreateBookingDto
{
    [Required]
    public int ServiceId { get; set; }

    [Required]
    public DateTime ScheduledDate { get; set; }

    [Required]
    public string StartTime { get; set; } = string.Empty; 

    [Required]
    [Range(1, 8)]
    public decimal DurationHours { get; set; }

    // "Cash", "Credits", "Barter"
    [Required]
    public string PaymentMethod { get; set; } = "Cash";

    // Optional: Only used if PaymentMethod == "Barter"
    public int? ExchangeServiceId { get; set; }
}