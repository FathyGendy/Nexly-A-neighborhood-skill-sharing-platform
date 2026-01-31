using Microsoft.EntityFrameworkCore;
using Nexly.Core.DTOs;
using Nexly.Core.Entities;
using Nexly.Core.Enums;
using Nexly.Core.Interfaces;
using Nexly.Infrastructure.Data;

namespace Nexly.Infrastructure.Services;

public class BookingService : IBookingService
{
    private readonly ApplicationDbContext _context;
    private readonly INotificationService _notificationService;
    private readonly IPaymentService _paymentService;

    public BookingService(
        ApplicationDbContext context, 
        INotificationService notificationService,
        IPaymentService paymentService)
    {
        _context = context;
        _notificationService = notificationService;
        _paymentService = paymentService;
    }

    public async Task<bool> UpdateStatusAsync(int bookingId, string status, string providerId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Client)
            .Include(b => b.Provider)
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == bookingId);

        if (booking == null) throw new Exception("Booking not found");
        
        if (booking.ProviderId != providerId && status != "Cancelled") 
            throw new Exception("Unauthorized");

        if (Enum.TryParse<BookingStatus>(status, true, out var newStatus))
        {
            if (newStatus == BookingStatus.Completed && booking.Status != BookingStatus.Completed)
            {
                if (booking.PaymentMethod == "Credits")
                {
                    int creditCost = (int)Math.Ceiling(booking.DurationHours);
                    booking.Client.TimeCredits -= creditCost;
                    booking.Provider.TimeCredits += creditCost; 
                }
            }

            booking.Status = newStatus;
            await _context.SaveChangesAsync();

            string message = newStatus switch
            {
                BookingStatus.Confirmed => $"Good news! Your {booking.PaymentMethod} request for {booking.Service.Title} was ACCEPTED!",
                BookingStatus.Rejected => $"The provider declined your request for {booking.Service.Title}.",
                BookingStatus.Completed => $"Booking marked completed. {(booking.PaymentMethod == "Credits" ? "Credits have been transferred." : "")}",
                _ => $"Your booking status is now {newStatus}."
            };

            await _notificationService.SendNotificationAsync(
                booking.ClientId,
                $"Booking {newStatus}",
                message,
                "BookingUpdate",
                booking.Id
            );

            return true;
        }
        return false;
    }

    public async Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, string clientId)
    {
        var service = await _context.Services
            .Include(s => s.Provider)
            .FirstOrDefaultAsync(s => s.Id == dto.ServiceId);

        if (service == null) throw new Exception("Service not found");
        if (service.ProviderId == clientId) throw new Exception("You cannot book your own service");

        if (!TimeSpan.TryParse(dto.StartTime, out TimeSpan startTime))
            throw new Exception("Invalid start time format. Use HH:mm");

        var endTime = startTime.Add(TimeSpan.FromHours((double)dto.DurationHours));
        
        var client = await _context.Users.FindAsync(clientId);
        if (client == null) throw new Exception("Client not found");

        decimal totalAmount = 0;
        string? stripeIntentId = null;
        int? exchangeServiceId = null;

        if (dto.PaymentMethod == "Credits")
        {
            int requiredCredits = (int)Math.Ceiling(dto.DurationHours);
            if (client.TimeCredits < requiredCredits)
            {
                throw new Exception($"Insufficient Time Credits. You have {client.TimeCredits}, but need {requiredCredits}.");
            }
        }
        else if (dto.PaymentMethod == "Barter")
        {
            if (!dto.ExchangeServiceId.HasValue)
                throw new Exception("You must select one of your services to swap.");

            var clientService = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == dto.ExchangeServiceId.Value && s.ProviderId == clientId);

            if (clientService == null)
                throw new Exception("Invalid service offered for swap.");

            exchangeServiceId = dto.ExchangeServiceId.Value;
        }
        else // Cash
        {
            totalAmount = service.HourlyRate * dto.DurationHours;
            stripeIntentId = await _paymentService.CreatePaymentIntentAsync(totalAmount, service.Currency, client.Email!);
        }

        var conflict = await _context.Bookings
            .AnyAsync(b => b.ProviderId == service.ProviderId 
                && b.ScheduledDate.Date == dto.ScheduledDate.Date
                && b.Status != BookingStatus.Cancelled
                && b.Status != BookingStatus.Rejected
                && ((startTime >= b.StartTime && startTime < b.EndTime) 
                    || (endTime > b.StartTime && endTime <= b.EndTime)));

        if (conflict) throw new Exception("Time slot is not available");

        var booking = new Booking
        {
            ServiceId = dto.ServiceId,
            ClientId = clientId,
            ProviderId = service.ProviderId,
            ScheduledDate = dto.ScheduledDate.Date,
            StartTime = startTime,
            EndTime = endTime,
            DurationHours = dto.DurationHours,
            TotalAmount = totalAmount,
            StripePaymentIntentId = stripeIntentId,
            PaymentMethod = dto.PaymentMethod,
            ExchangeServiceId = exchangeServiceId,
            Status = BookingStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        string notifMsg = dto.PaymentMethod == "Credits" 
            ? $"New Request using Time Credits ({dto.DurationHours} hrs)." 
            : dto.PaymentMethod == "Barter" 
                ? "New Skill Swap Request! They offered a service in return." 
                : $"New Booking Request ({service.Currency}{totalAmount}).";

        await _notificationService.SendNotificationAsync(
            service.ProviderId,
            "New Booking Request",
            notifMsg,
            "BookingRequest",
            booking.Id
        );

        return await MapToDtoAsync(booking, service.Title, 
            $"{service.Provider.FirstName} {service.Provider.LastName}", 
            $"{client.FirstName} {client.LastName}");
    }

    public async Task<IEnumerable<BookingResponseDto>> GetMyBookingsAsync(string userId)
    {
        var bookings = await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.ExchangeService) 
            .Include(b => b.Provider)
            .Include(b => b.Client)
            .Where(b => b.ClientId == userId)
            .OrderByDescending(b => b.ScheduledDate)
            .ToListAsync();

        var response = new List<BookingResponseDto>();
        foreach (var b in bookings)
        {
            response.Add(await MapToDtoAsync(b, b.Service.Title, 
                $"{b.Provider.FirstName} {b.Provider.LastName}", 
                $"{b.Client.FirstName} {b.Client.LastName}"));
        }
        return response;
    }

    public async Task<IEnumerable<BookingResponseDto>> GetIncomingBookingsAsync(string providerId)
    {
        var bookings = await _context.Bookings
            .Include(b => b.Service)
            .Include(b => b.ExchangeService)
            .Include(b => b.Provider)
            .Include(b => b.Client)
            .Where(b => b.ProviderId == providerId)
            .OrderByDescending(b => b.ScheduledDate)
            .ToListAsync();

        var response = new List<BookingResponseDto>();
        foreach (var b in bookings)
        {
            response.Add(await MapToDtoAsync(b, b.Service.Title, 
                $"{b.Provider.FirstName} {b.Provider.LastName}", 
                $"{b.Client.FirstName} {b.Client.LastName}"));
        }
        return response;
    }

    private async Task<BookingResponseDto> MapToDtoAsync(Booking b, string serviceTitle, string providerName, string clientName)
    {
        // Check if this specific booking has a review
        var hasReview = await _context.Reviews.AnyAsync(r => r.BookingId == b.Id);

        return new BookingResponseDto
        {
            Id = b.Id,
            ServiceTitle = serviceTitle,
            ProviderName = providerName,
            ClientName = clientName,
            ScheduledDate = b.ScheduledDate,
            StartTime = b.StartTime.ToString(@"hh\:mm"),
            EndTime = b.EndTime.ToString(@"hh\:mm"),
            DurationHours = b.DurationHours,
            TotalAmount = b.TotalAmount,
            Status = b.Status,
            CreatedAt = b.CreatedAt,
            PaymentMethod = b.PaymentMethod,
            ExchangeServiceTitle = b.ExchangeService?.Title,
            HasBeenReviewed = hasReview
        };
    }
}