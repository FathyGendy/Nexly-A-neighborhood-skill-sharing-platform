using Microsoft.EntityFrameworkCore;
using Nexly.Core.DTOs;
using Nexly.Core.Entities;
using Nexly.Core.Interfaces;
using Nexly.Infrastructure.Data;

namespace Nexly.Infrastructure.Services;

public class ReviewService : IReviewService
{
    private readonly ApplicationDbContext _context;

    public ReviewService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ReviewResponseDto> CreateReviewAsync(CreateReviewDto dto, string reviewerId)
    {
        // 1. Validate Booking
        var booking = await _context.Bookings
            .Include(b => b.Service)
            .FirstOrDefaultAsync(b => b.Id == dto.BookingId);

        if (booking == null) throw new Exception("Booking not found");
        
        if (booking.ClientId != reviewerId) throw new Exception("You can only review bookings you made");

        var existingReview = await _context.Reviews
            .AnyAsync(r => r.BookingId == dto.BookingId);
        
        if (existingReview) throw new Exception("You have already reviewed this booking");

        // 2. Create Review
        var review = new Review
        {
            BookingId = dto.BookingId,
            ReviewerId = reviewerId,
            RevieweeId = booking.ProviderId,
            Rating = dto.Rating,
            Comment = dto.Comment,
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        // 3. Update Service Average Rating
        await UpdateServiceRating(booking.ServiceId);

        // --- Social Vouching & Trust Logic ---
        if (review.Rating == 5)
        {
            await CheckAndVerifyProvider(booking.ProviderId);
        }

        var reviewer = await _context.Users.FindAsync(reviewerId);

        return new ReviewResponseDto
        {
            Id = review.Id,
            BookingId = review.BookingId,
            ReviewerName = $"{reviewer!.FirstName} {reviewer.LastName}",
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }

    public async Task<IEnumerable<ReviewResponseDto>> GetServiceReviewsAsync(int serviceId)
    {
        var reviews = await _context.Reviews
            .Include(r => r.Reviewer)
            .Include(r => r.Booking)
            .Where(r => r.Booking.ServiceId == serviceId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return reviews.Select(r => new ReviewResponseDto
        {
            Id = r.Id,
            BookingId = r.BookingId,
            ReviewerName = $"{r.Reviewer.FirstName} {r.Reviewer.LastName}",
            Rating = r.Rating,
            Comment = r.Comment,
            CreatedAt = r.CreatedAt
        });
    }

    private async Task UpdateServiceRating(int serviceId)
    {
        var service = await _context.Services.FindAsync(serviceId);
        
        var reviews = await _context.Reviews
            .Include(r => r.Booking)
            .Where(r => r.Booking.ServiceId == serviceId)
            .ToListAsync();

        if (reviews.Any())
        {
            service!.AverageRating = reviews.Average(r => r.Rating);
            service.TotalReviews = reviews.Count;
        }

        await _context.SaveChangesAsync();
    }

    // --- ROBUST VERIFICATION LOGIC ---
    private async Task CheckAndVerifyProvider(string providerId)
    {
        var provider = await _context.Users.FindAsync(providerId);
        if (provider == null) return;

        // Count unique users who have given this provider a 5-star review
        var uniqueVouches = await _context.Reviews
            .Where(r => r.RevieweeId == providerId && r.Rating == 5)
            .Select(r => r.ReviewerId)
            .Distinct() 
            .CountAsync();

        // Update the count on the user entity
        provider.VouchesCount = uniqueVouches;

        // If they have 3 or more unique vouches, grant the badge
        if (uniqueVouches >= 3)
        {
            provider.IsVerifiedNeighbor = true;
        }
        else 
        {
            // Optional: Remove badge if vouches drop
            provider.IsVerifiedNeighbor = false;
        }

        await _context.SaveChangesAsync();
    }
}