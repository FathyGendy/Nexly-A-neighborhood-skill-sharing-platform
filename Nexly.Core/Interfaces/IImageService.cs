using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace Nexly.Core.Interfaces
{
    public interface IImageService
    {
        Task<string?> UploadImageAsync(IFormFile file);
        
        Task<string?> UploadFileAsync(IFormFile file);
    }
}