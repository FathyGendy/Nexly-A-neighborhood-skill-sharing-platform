namespace Nexly.Core.Entities;

public class Message
{
    public int Id { get; set; }
    
    public int BookingId { get; set; }
    
    public string SenderId { get; set; } = string.Empty;
    public string ReceiverId { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // File Sharing & Voice Messages
    public string? AttachmentUrl { get; set; }
    public string? AttachmentType { get; set; }
    public string? FileName { get; set; }

    // Message Status & System Logs ---
    public bool IsDeleted { get; set; } = false;
    public bool IsEdited { get; set; } = false;
    public bool IsSystemMessage { get; set; } = false;

    // Navigation properties
    public Booking Booking { get; set; } = null!;
    public ApplicationUser Sender { get; set; } = null!;
    public ApplicationUser Receiver { get; set; } = null!;
}