using Nexly.Core.Entities;

namespace Nexly.Core.Interfaces;

public interface INotificationService
{
        Task SendNotificationAsync(string userId, string title, string message, string type, int referenceId);
        
        Task MarkAsReadAsync(int notificationId);
        
        Task<IEnumerable<Notification>> GetUserNotificationsAsync(string userId);
}