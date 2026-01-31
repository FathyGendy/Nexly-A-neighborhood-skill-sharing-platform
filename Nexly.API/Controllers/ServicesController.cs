using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nexly.Core.DTOs;
using Nexly.Core.Enums;
using Nexly.Core.Interfaces;
using System.Security.Claims;

namespace Nexly.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ServicesController : ControllerBase
{
    private readonly IServiceService _serviceService;
    private readonly IImageService _imageService;

    public ServicesController(IServiceService serviceService, IImageService imageService)
    {
        _serviceService = serviceService;
        _imageService = imageService;
    }

    [HttpPost]
    [Authorize]
    public async Task<ActionResult<ServiceResponseDto>> CreateService([FromForm] CreateServiceRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
            string? imageUrl = null; 
            
            if (request.Image != null)
            {
                imageUrl = await _imageService.UploadImageAsync(request.Image);
            }

            var serviceDto = new CreateServiceDto 
            {
                Title = request.Title,
                Description = request.Description,
                Category = request.Category,
                HourlyRate = request.HourlyRate,
                ImageUrl = imageUrl 
            };

            var result = await _serviceService.CreateServiceAsync(serviceDto, userId);
            return CreatedAtAction(nameof(GetService), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ServiceResponseDto>> UpdateService(int id, [FromForm] CreateServiceRequest request)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try
        {
            string? imageUrl = null;
            if (request.Image != null)
            {
                imageUrl = await _imageService.UploadImageAsync(request.Image);
            }

            var serviceDto = new CreateServiceDto 
            {
                Title = request.Title,
                Description = request.Description,
                Category = request.Category,
                HourlyRate = request.HourlyRate,
                ImageUrl = imageUrl 
            };

            var result = await _serviceService.UpdateServiceAsync(id, serviceDto, userId);
            
            if (result == null) 
                return NotFound("Service not found or you are not authorized to edit it.");

            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id}")]
    [Authorize]
    public async Task<IActionResult> DeleteService(int id)
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        try 
        {
            var result = await _serviceService.DeleteServiceAsync(id, userId);
            
            if (!result)
                return NotFound("Service not found or you are not authorized to delete it.");

            return Ok(new { message = "Service deleted successfully" });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception)
        {
            return StatusCode(500, "An error occurred while deleting the service.");
        }
    }

    [HttpGet("nearby")]
    public async Task<ActionResult<IEnumerable<ServiceResponseDto>>> GetNearby(
        [FromQuery] double latitude,
        [FromQuery] double longitude,
        [FromQuery] double radiusKm = 50,
        [FromQuery] ServiceCategory? category = null,
        [FromQuery] string? searchTerm = null)
    {
        var services = await _serviceService.GetNearbyServicesAsync(latitude, longitude, radiusKm, category);

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            string lowerTerm = searchTerm.ToLower();
            
            services = services.Where(s => 
                s.Title.ToLower().Contains(lowerTerm) || 
                s.Description.ToLower().Contains(lowerTerm) ||
                (s.ProviderAddress != null && s.ProviderAddress.ToLower().Contains(lowerTerm)) ||
                s.Category.ToLower().Contains(lowerTerm)
            );
        }

        return Ok(services);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ServiceResponseDto>> GetService(int id)
    {
        var service = await _serviceService.GetServiceByIdAsync(id);
        if (service == null) return NotFound();
        return Ok(service);
    }

    [HttpGet("my-services")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<ServiceResponseDto>>> GetMyServices()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (userId == null) return Unauthorized();

        var services = await _serviceService.GetUserServicesAsync(userId);
        return Ok(services);
    }

    [HttpGet("provider/{userId}")]
    public async Task<ActionResult<IEnumerable<ServiceResponseDto>>> GetProviderServices(string userId)
    {
        var services = await _serviceService.GetUserServicesAsync(userId);
        return Ok(services);
    }
}

public class CreateServiceRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ServiceCategory Category { get; set; }
    public decimal HourlyRate { get; set; }
    public IFormFile? Image { get; set; } 
}