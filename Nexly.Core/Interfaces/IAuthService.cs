using Microsoft.AspNetCore.Http; 
using Nexly.Core.DTOs;

namespace Nexly.Core.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterAsync(RegisterDto registerDto);
    Task<AuthResponseDto> LoginAsync(LoginDto loginDto);
    
    Task<UserDto> GetUserProfileAsync(string idOrSlug);
    Task<UserDto> UpdateProfileAsync(string userId, UserDto updateDto);

    Task<IEnumerable<UserDto>> GetNeighborhoodHeroesAsync();
    Task VerifyIdentityAsync(string userId, IFormFile idImage);
}