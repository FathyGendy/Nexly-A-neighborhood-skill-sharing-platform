namespace Nexly.Core.Entities;

public class ServiceImage
{
    public int Id { get; set; }
    public int ServiceId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public Service Service { get; set; } = null!;
}