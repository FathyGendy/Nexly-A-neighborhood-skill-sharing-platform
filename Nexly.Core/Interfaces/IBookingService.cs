using Nexly.Core.DTOs;

namespace Nexly.Core.Interfaces;

public interface IBookingService
{
    Task<BookingResponseDto> CreateBookingAsync(CreateBookingDto dto, string clientId);
    Task<IEnumerable<BookingResponseDto>> GetMyBookingsAsync(string userId);
    Task<IEnumerable<BookingResponseDto>> GetIncomingBookingsAsync(string providerId);
    Task<bool> UpdateStatusAsync(int bookingId, string status, string providerId);
}