using System.ComponentModel.DataAnnotations;
using Nexly.Core.Enums;

namespace Nexly.Core.DTOs;

public class CreateServiceDto
{
    [Required]
    [MinLength(5)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MinLength(20)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public ServiceCategory Category { get; set; }

    [Required]
    [Range(0, 10000)]
    public decimal HourlyRate { get; set; }

    public string? ImageUrl { get; set; } 

    public string Currency { get; set; } = "USD";

}