using Nexly.Core.DTOs;
using Nexly.Core.Enums;

namespace Nexly.Core.Interfaces;

public interface IServiceService
{
    Task<ServiceResponseDto> CreateServiceAsync(CreateServiceDto dto, string providerId);
    Task<IEnumerable<ServiceResponseDto>> GetNearbyServicesAsync(double lat, double lng, double radiusKm, ServiceCategory? category = null);
    Task<ServiceResponseDto?> GetServiceByIdAsync(int id);
    Task<IEnumerable<ServiceResponseDto>> GetUserServicesAsync(string userId);
    Task<ServiceResponseDto?> UpdateServiceAsync(int id, CreateServiceDto dto, string userId);
    Task<bool> DeleteServiceAsync(int id, string userId);
}