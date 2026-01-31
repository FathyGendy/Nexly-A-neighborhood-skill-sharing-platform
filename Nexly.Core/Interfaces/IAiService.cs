using System.Threading.Tasks;

namespace Nexly.Core.Interfaces
{
    public interface IAiService
    {
        Task<string> GenerateDescriptionAsync(string serviceTitle, string category);
        Task<string> TranslateTextAsync(string text, string targetLanguage = "en");
        Task<string> ChatWithNexyAsync(string userMessage, string userRole = "Guest");
    }
}