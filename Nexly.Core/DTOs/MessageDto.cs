namespace Nexly.Core.DTOs
{
    public class MessageDto
    {
        public int Id { get; set; }
        public string SenderId { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
        public bool IsMine { get; set; }

        public string? AttachmentUrl { get; set; }
        public string? AttachmentType { get; set; }
        public string? FileName { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsEdited { get; set; }
        public bool IsSystemMessage { get; set; }
    }
}