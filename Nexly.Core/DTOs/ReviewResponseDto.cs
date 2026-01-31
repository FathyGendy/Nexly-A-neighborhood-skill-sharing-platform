namespace Nexly.Core.DTOs;

public class ReviewResponseDto
{
    public int Id { get; set; }
    public int BookingId { get; set; }
    public string ReviewerName { get; set; } = string.Empty;
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }
}