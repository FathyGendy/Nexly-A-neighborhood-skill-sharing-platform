using Nexly.Core.DTOs;

namespace Nexly.Core.Interfaces;

public interface IReviewService
{
    Task<ReviewResponseDto> CreateReviewAsync(CreateReviewDto dto, string reviewerId);
    Task<IEnumerable<ReviewResponseDto>> GetServiceReviewsAsync(int serviceId);
}