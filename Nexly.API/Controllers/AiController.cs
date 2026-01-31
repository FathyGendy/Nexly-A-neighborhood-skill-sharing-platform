using Microsoft.AspNetCore.Mvc;
using Nexly.Core.Interfaces;
using System.Security.Claims;

namespace Nexly.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;

        public AiController(IAiService aiService)
        {
            _aiService = aiService;
        }

        [HttpPost("generate-description")]
        public async Task<IActionResult> GenerateDescription([FromBody] GenerateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Title))
                return BadRequest("Title is required");

            var result = await _aiService.GenerateDescriptionAsync(request.Title, request.Category);
            return Ok(new { description = result });
        }

        [HttpPost("chat")]
        public async Task<IActionResult> ChatWithNexy([FromBody] ChatRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Message))
                return BadRequest("Say something to Nexy!");

            var userRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Guest";
            
            var response = await _aiService.ChatWithNexyAsync(request.Message, userRole);
            return Ok(new { response });
        }

        [HttpPost("translate")]
        public async Task<IActionResult> Translate([FromBody] TranslateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
                return BadRequest("Text is required");

            var result = await _aiService.TranslateTextAsync(request.Text);
            
            return Ok(new { translation = result });
        }
    }

    public class GenerateRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
    }

    public class TranslateRequest
    {
        public string Text { get; set; } = string.Empty;
    }
}