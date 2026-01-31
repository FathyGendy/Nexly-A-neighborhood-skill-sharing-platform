using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization; 
using Microsoft.EntityFrameworkCore;
using Nexly.Core.Entities;
using Nexly.Infrastructure.Data;
using System;
using System.Security.Claims; 
using System.Threading.Tasks;
using System.Collections.Concurrent;
using System.Linq;
using System.Collections.Generic;

namespace Nexly.Infrastructure.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        private readonly ApplicationDbContext _context;
        private static ConcurrentDictionary<string, HashSet<string>> _activeBookingUsers = new();
        
        public ChatHub(ApplicationDbContext context)
        {
            _context = context;
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId))
            {
                foreach (var bookingId in _activeBookingUsers.Keys)
                {
                    if (_activeBookingUsers.TryGetValue(bookingId, out var users))
                    {
                        bool removed = false;
                        lock (users) { if (users.Contains(userId)) { users.Remove(userId); removed = true; } }
                        if (removed) await Clients.Group(bookingId).SendAsync("ActiveUsers", users.ToList());
                    }
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinBookingGroup(string bookingId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId) || !int.TryParse(bookingId, out int bId)) return;

            var booking = await _context.Bookings.Include(b => b.Service).AsNoTracking().FirstOrDefaultAsync(b => b.Id == bId);
            if (booking == null) return;

            if (booking.ClientId == userId || booking.Service.ProviderId == userId)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, bookingId);
                _activeBookingUsers.AddOrUpdate(bookingId, new HashSet<string> { userId }, (key, existing) => { lock(existing) { existing.Add(userId); } return existing; });

                List<string> currentUsers;
                if (_activeBookingUsers.TryGetValue(bookingId, out var users)) { lock(users) { currentUsers = users.ToList(); } }
                else { currentUsers = new List<string> { userId }; }

                await Clients.Group(bookingId).SendAsync("ActiveUsers", currentUsers);
            }
        }

        public async Task LeaveBookingGroup(string bookingId)
        {
             var userId = Context.UserIdentifier;
             await Groups.RemoveFromGroupAsync(Context.ConnectionId, bookingId);
             if (!string.IsNullOrEmpty(userId) && _activeBookingUsers.TryGetValue(bookingId, out var users))
             {
                 lock (users) { users.Remove(userId); }
                 await Clients.Group(bookingId).SendAsync("ActiveUsers", users.ToList());
             }
        }

        // WebRTC Signaling
        public async Task SendSignal(string bookingId, object signalData)
        {
            await Clients.OthersInGroup(bookingId).SendAsync("ReceiveSignal", signalData);
        }

        // Call Logic (End/Reject)
        public async Task EndVideoCall(string bookingId, string reason)
        {
             // 1. Tell everyone to close the window
             await Clients.Group(bookingId).SendAsync("CallEnded");

             // 2. Save a System Message Log
             await SendSystemMessage(bookingId, reason); 
        }

        private async Task SendSystemMessage(string bookingId, string content)
        {
            if (!int.TryParse(bookingId, out int bId)) return;
            var senderId = Context.UserIdentifier;
            
            var booking = await _context.Bookings.Include(b => b.Service).FirstOrDefaultAsync(b => b.Id == bId);
            if (booking == null) return;
            
            string receiverId = (senderId == booking.ClientId) ? booking.Service.ProviderId : booking.ClientId;

            var msg = new Message
            {
                BookingId = bId,
                SenderId = senderId!,
                ReceiverId = receiverId,
                Content = content,
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                IsSystemMessage = true 
            };

            _context.Messages.Add(msg);
            await _context.SaveChangesAsync();

            await Clients.Group(bookingId).SendAsync("ReceiveMessage", new 
            {
                Id = msg.Id,
                SenderId = senderId,
                Content = content,
                Timestamp = msg.CreatedAt,
                IsSystemMessage = true
            });
        }

        // Edit Message
        public async Task EditMessage(string bookingId, int messageId, string newContent)
        {
            var userId = Context.UserIdentifier;
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null || message.SenderId != userId || message.IsDeleted) return;

            // 15 Minute Limit
            if (DateTime.UtcNow > message.CreatedAt.AddMinutes(15)) return;

            message.Content = newContent;
            message.IsEdited = true;
            await _context.SaveChangesAsync();

            await Clients.Group(bookingId).SendAsync("MessageUpdated", new { Id = messageId, Content = newContent, IsEdited = true });
        }

        // Delete (Unsend) Message
        public async Task DeleteMessage(string bookingId, int messageId)
        {
            var userId = Context.UserIdentifier;
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null || message.SenderId != userId) return;

            // 15 Minute Limit
            if (DateTime.UtcNow > message.CreatedAt.AddMinutes(15)) return;

            message.IsDeleted = true;
            message.Content = "This message was deleted";
            message.AttachmentUrl = null; 
            await _context.SaveChangesAsync();

            await Clients.Group(bookingId).SendAsync("MessageDeleted", messageId);
        }

        public async Task SendMessage(string bookingId, string messageContent, string? attachmentUrl = null, string? attachmentType = null, string? fileName = null)
        {
            if (!int.TryParse(bookingId, out int bId)) return;
            var senderId = Context.UserIdentifier; 
            if (string.IsNullOrEmpty(senderId)) return;

            var booking = await _context.Bookings.Include(b => b.Service).FirstOrDefaultAsync(b => b.Id == bId);
            if (booking == null) return;
            if (booking.ClientId != senderId && booking.Service.ProviderId != senderId) return; 

            string receiverId = (senderId == booking.ClientId) ? booking.Service.ProviderId : booking.ClientId;

            var message = new Message
            {
                BookingId = bId,
                SenderId = senderId, 
                ReceiverId = receiverId,
                Content = messageContent ?? "",
                CreatedAt = DateTime.UtcNow,
                IsRead = false,
                AttachmentUrl = attachmentUrl,
                AttachmentType = attachmentType,
                FileName = fileName,
                IsDeleted = false,
                IsEdited = false,
                IsSystemMessage = false
            };

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            await Clients.Group(bookingId).SendAsync("ReceiveMessage", new 
            {
                Id = message.Id,
                SenderId = senderId,
                Content = messageContent,
                Timestamp = message.CreatedAt,
                AttachmentUrl = attachmentUrl,
                AttachmentType = attachmentType,
                FileName = fileName,
                IsMine = true
            });
        }
    }
}