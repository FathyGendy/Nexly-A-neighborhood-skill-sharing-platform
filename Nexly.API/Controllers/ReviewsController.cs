using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexly.Core.DTOs;
using Nexly.Core.Interfaces;
using System.Security.Claims;

namespace Nexly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReviewsController : ControllerBase
{
    private readonly IReviewService _reviewService;

    public ReviewsController(IReviewService reviewService)
    {
        _reviewService = reviewService;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ReviewResponseDto>> CreateReview([FromBody] CreateReviewDto dto)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
            var result = await _reviewService.CreateReviewAsync(dto, userId);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("service/{serviceId}")]
    public async Task<ActionResult<IEnumerable<ReviewResponseDto>>> GetServiceReviews(int serviceId)
    {
        var reviews = await _reviewService.GetServiceReviewsAsync(serviceId);
        return Ok(reviews);
    }
}