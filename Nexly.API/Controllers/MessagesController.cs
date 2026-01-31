using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Nexly.Core.DTOs;
using Nexly.Infrastructure.Data;
using Nexly.Core.Interfaces;
using System.Security.Claims;

namespace Nexly.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IImageService _imageService;
        private readonly IAiService _aiService;

        public MessagesController(ApplicationDbContext context, IImageService imageService, IAiService aiService)
        {
            _context = context;
            _imageService = imageService;
            _aiService = aiService;
        }

        [HttpGet("{bookingId}")]
        public async Task<ActionResult<IEnumerable<MessageDto>>> GetMessages(int bookingId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var messages = await _context.Messages
                .Where(m => m.BookingId == bookingId)
                .OrderBy(m => m.CreatedAt)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    Content = m.IsDeleted ? "This message was deleted" : m.Content,
                    Timestamp = m.CreatedAt,
                    IsMine = m.SenderId == currentUserId,
                    AttachmentUrl = m.IsDeleted ? null : m.AttachmentUrl,
                    AttachmentType = m.AttachmentType,
                    FileName = m.FileName,
                    IsDeleted = m.IsDeleted,
                    IsEdited = m.IsEdited,
                    IsSystemMessage = m.IsSystemMessage
                })
                .ToListAsync();

            return Ok(messages);
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadAttachment([FromForm] IFormFile file)
        {
            if (file == null) return BadRequest("No file uploaded.");
            var url = await _imageService.UploadFileAsync(file);
            if (url == null) return StatusCode(500, "Upload failed.");
            return Ok(new { url });
        }

        [HttpPost("translate")]
        public async Task<IActionResult> TranslateMessage([FromBody] TranslationRequest request)
        {
            if (string.IsNullOrEmpty(request.Content))
                return BadRequest("Content is required");

            var translation = await _aiService.TranslateTextAsync(request.Content, "en");
            return Ok(new { translation });
        }

        public class TranslationRequest 
        { 
            public string Content { get; set; } = ""; 
        }
    }
}