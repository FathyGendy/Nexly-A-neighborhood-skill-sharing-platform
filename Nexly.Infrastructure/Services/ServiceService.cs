using Microsoft.EntityFrameworkCore;
using Nexly.Core.DTOs;
using Nexly.Core.Entities;
using Nexly.Core.Enums;
using Nexly.Core.Interfaces;
using Nexly.Infrastructure.Data;

namespace Nexly.Infrastructure.Services;

public class ServiceService : IServiceService
{
    private readonly ApplicationDbContext _context;
    public ServiceService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponseDto> CreateServiceAsync(CreateServiceDto dto, string providerId)
    {
        var provider = await _context.Users.FindAsync(providerId);
        if (provider == null) throw new Exception("Provider not found");

        string finalImageUrl = dto.ImageUrl;
        if (string.IsNullOrEmpty(finalImageUrl))
        {
            finalImageUrl = GetDefaultImageForCategory(dto.Category);
        }

        var service = new Service
        {
            ProviderId = providerId,
            Title = dto.Title,
            Description = dto.Description,
            Category = dto.Category,
            HourlyRate = dto.HourlyRate,
            Currency = dto.Currency ?? "USD",
            ImageUrl = finalImageUrl,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _context.Services.Add(service);
        await _context.SaveChangesAsync();

        return MapToDto(service, provider, 0);
    }

    public async Task<IEnumerable<ServiceResponseDto>> GetNearbyServicesAsync(double userLat, double userLng, double radiusKm, ServiceCategory? category = null)
    {
        var query = _context.Services
            .Include(s => s.Provider)
            .Where(s => s.IsActive); 

        if (category.HasValue)
        {
            query = query.Where(s => s.Category == category.Value);
        }

        var services = await query.OrderByDescending(s => s.CreatedAt).ToListAsync();

        var resultList = services
            .Select(s => new
            {
                Service = s,
                Distance = CalculateDistance(userLat, userLng, s.Provider.Latitude, s.Provider.Longitude)
            })
            .Select(x => MapToDto(x.Service, x.Service.Provider, x.Distance))
            .ToList();

        return resultList;
    }

    public async Task<ServiceResponseDto?> GetServiceByIdAsync(int id)
    {
        var service = await _context.Services
            .Include(s => s.Provider)
            .FirstOrDefaultAsync(s => s.Id == id && s.IsActive); 

        if (service == null) return null;

        return MapToDto(service, service.Provider, 0);
    }

    public async Task<IEnumerable<ServiceResponseDto>> GetUserServicesAsync(string userId)
    {
        var services = await _context.Services
            .Include(s => s.Provider)
            .Where(s => s.ProviderId == userId && s.IsActive) 
            .ToListAsync();

        return services.Select(s => MapToDto(s, s.Provider, 0));
    }

    public async Task<ServiceResponseDto?> UpdateServiceAsync(int id, CreateServiceDto dto, string userId)
    {
        var service = await _context.Services
            .Include(s => s.Provider)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service == null || service.ProviderId != userId) return null;

        service.Title = dto.Title;
        service.Description = dto.Description;
        service.Category = dto.Category;
        service.HourlyRate = dto.HourlyRate;
        service.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(dto.ImageUrl))
        {
            service.ImageUrl = dto.ImageUrl;
        }

        await _context.SaveChangesAsync();
        return MapToDto(service, service.Provider, 0);
    }

    public async Task<bool> DeleteServiceAsync(int id, string userId)
    {
        var service = await _context.Services
            .Include(s => s.Bookings) 
            .FirstOrDefaultAsync(s => s.Id == id);

        if (service == null || service.ProviderId != userId) return false;

        if (service.Bookings.Any(b => b.Status != BookingStatus.Cancelled && b.Status != BookingStatus.Completed))
        {
            throw new InvalidOperationException("Cannot delete this service because it has pending or confirmed bookings.");
        }

        service.IsActive = false;
        
        await _context.SaveChangesAsync();
        return true;
    }

    private ServiceResponseDto MapToDto(Service service, ApplicationUser provider, double distance)
    {
        return new ServiceResponseDto
        {
            Id = service.Id,
            Title = service.Title,
            Description = service.Description,
            Category = service.Category.ToString(), 
            HourlyRate = service.HourlyRate,
            Currency = service.Currency,
            AverageRating = service.AverageRating,
            TotalReviews = service.TotalReviews,
            CreatedAt = service.CreatedAt,
            ProviderId = provider.Id,
            ProviderName = $"{provider.FirstName} {provider.LastName}",
            ProviderImage = provider.ProfileImageUrl,
            ProviderAddress = provider.Address ?? "Unknown Location",
            Latitude = provider.Latitude,
            Longitude = provider.Longitude,
            DistanceKm = Math.Round(distance, 2),
            ImageUrl = service.ImageUrl 
        };
    }

    private double CalculateDistance(double lat1, double lon1, double lat2, double lon2)
    {
        var R = 6371; 
        var dLat = ToRadians(lat2 - lat1);
        var dLon = ToRadians(lon2 - lon1);
        var a =
            Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
            Math.Cos(ToRadians(lat1)) * Math.Cos(ToRadians(lat2)) *
            Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private double ToRadians(double deg)
    {
        return deg * (Math.PI / 180);
    }

    private string GetDefaultImageForCategory(ServiceCategory category)
    {
        return category switch
        {
            ServiceCategory.Gardening => "https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Tutoring => "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.HomeRepair => "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Cleaning => "https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.PetCare => "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Moving => "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Cooking => "https://images.unsplash.com/photo-1507048331197-7d4ac70811cf?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Technology => "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Fitness => "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Music => "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Art => "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&q=80&w=800",
            ServiceCategory.Other => "https://images.unsplash.com/photo-1483058712412-4245e9b90334?auto=format&fit=crop&q=80&w=800",
            _ => "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=800"
        };
    }
}