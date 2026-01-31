using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Nexly.Core.Interfaces;
using Nexly.Core.Enums;
using System.Collections.Generic;

namespace Nexly.Infrastructure.Services
{
    public class OpenAiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public OpenAiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["OpenAi:ApiKey"] ?? "DEMO_MODE"; 
        }

        // --- 1. LONG Service Descriptions ---
        public async Task<string> GenerateDescriptionAsync(string serviceTitle, string category)
        {
             if (int.TryParse(category, out int categoryId))
            {
                if (Enum.IsDefined(typeof(ServiceCategory), categoryId))
                    category = ((ServiceCategory)categoryId).ToString();
            }

            // Demo fallback: RETURNS LONG PARAGRAPHS
            if (_apiKey == "DEMO_MODE" || string.IsNullOrEmpty(_apiKey))
            {
                await Task.Delay(800);
                
                string[] templates = new[]
                {
                    $"Are you looking for top-tier {serviceTitle} assistance? Look no further! With years of experience in the {category} industry, I provide comprehensive solutions tailored to your unique needs. My goal is to deliver excellence, reliability, and satisfaction on every project. Whether you need a quick fix or a long-term engagement, I am dedicated to helping you achieve the best results. Let's work together to bring your vision to life!",
                    $"I offer professional and reliable {serviceTitle} services designed to make your life easier. As a specialist in {category}, I understand the importance of attention to detail and timely delivery. My service includes a thorough consultation to ensure we meet your specific requirements. Join hundreds of satisfied neighbors who have trusted me with their projects. Your satisfaction is my top priority!",
                    $"Unlock the full potential of your projects with my expert {serviceTitle} services. I bring passion, skill, and creativity to the {category} field, ensuring that you get the highest quality results. I pride myself on clear communication and a strong work ethic. No matter the size of the task, I handle it with the utmost professionalism. Let's discuss how I can help you succeed today.",
                    $"Welcome to the best {serviceTitle} service in town! If you need help with {category}, I am here to provide affordable, high-quality assistance. I believe in building lasting relationships with my clients through trust and outstanding performance. I use the latest techniques and tools to ensure efficiency and excellence. Don't settle for less—choose a provider who truly cares about your needs.",
                    $"Searching for a trusted expert in {category}? I provide specialized {serviceTitle} tailored to your schedule and budget. My approach is client-focused, ensuring that every detail is perfect. From the initial chat to the final delivery, I am with you every step of the way. Experience the difference of working with a dedicated professional who loves what they do.",
                    $"Do you need {serviceTitle} done right the first time? I am a seasoned professional in {category} ready to tackle your challenges. I offer flexible scheduling and competitive rates without compromising on quality. My services are designed to be hassle-free and effective, giving you peace of mind. Let me take the stress off your shoulders so you can focus on what matters most.",
                    $"Elevate your experience with my premium {serviceTitle} solutions. I have a deep understanding of {category} and a track record of success. My services are customized to fit your specific goals, ensuring a personalized touch. I am committed to continuous improvement and staying updated with industry trends to serve you better. Let's create something amazing together!",
                    $"I am passionate about providing exceptional {serviceTitle} to my community. As an expert in {category}, I guarantee work that meets the highest standards of quality and safety. I am reliable, friendly, and ready to start immediately. Whether it's a small task or a major project, I approach it with the same level of dedication and enthusiasm.",
                    $"Get the job done efficiently with my {serviceTitle} expertise. I specialize in {category} and have helped numerous clients achieve their goals. I offer transparent pricing, timely communication, and results that speak for themselves. Why wait? Book my service today and experience the convenience of working with a true professional.",
                    $"Quality, reliability, and skill—that's what you get with my {serviceTitle} service. I am dedicated to serving the {category} needs of our neighborhood. I listen to your requirements carefully and deliver solutions that exceed expectations. Your positive feedback is my biggest reward. Let's get started on your project now!"
                };

                var random = new Random();
                return templates[random.Next(templates.Length)];
            }

            // Real AI Call
            var requestBody = new
            {
                model = "gpt-3.5-turbo",
                messages = new[]
                {
                    new { role = "system", content = "Write a long, engaging, professional service description (at least 3-4 sentences)." },
                    new { role = "user", content = $"Service: {serviceTitle}, Category: {category}" }
                },
                max_tokens = 200
            };

            return await SendOpenAiRequest(requestBody, "Description unavailable.");
        }

        // --- 2. TRANSLATION (Google GTX) ---
        public async Task<string> TranslateTextAsync(string text, string targetLanguage = "en")
        {
            if (string.IsNullOrWhiteSpace(text)) return "";

            try 
            {
                string url = $"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={targetLanguage}&dt=t&q={Uri.EscapeDataString(text)}";
                _httpClient.Timeout = TimeSpan.FromSeconds(10);
                var response = await _httpClient.GetAsync(url);
                response.EnsureSuccessStatusCode();

                var jsonString = await response.Content.ReadAsStringAsync();
                using (var doc = JsonDocument.Parse(jsonString))
                {
                    var root = doc.RootElement;
                    if (root.ValueKind == JsonValueKind.Array)
                    {
                        var firstBlock = root[0]; 
                        if (firstBlock.ValueKind == JsonValueKind.Array)
                        {
                            var sb = new StringBuilder();
                            foreach (var segment in firstBlock.EnumerateArray())
                            {
                                if (segment.ValueKind == JsonValueKind.Array && segment.GetArrayLength() > 0)
                                    sb.Append(segment[0].GetString());
                            }
                            var result = sb.ToString();
                            if (!string.IsNullOrWhiteSpace(result)) return result;
                        }
                    }
                }
                return text; 
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Translation Error: {ex.Message}");
                return text;
            }
        }

        // --- 3. Chat with Nexy ---
        public async Task<string> ChatWithNexyAsync(string userMessage, string userRole = "Guest")
        {
            string systemPrompt = $@"You are Nexy, a friendly, energetic puppy assistant for the Nexly platform 🐶.
                PERSONALITY: Excited, loyal, helpful. Use emojis.
                CRITICAL RULE: If user asks something unknown, refer to FAQ or email nxlspprt@gmail.com.";

            if (_apiKey == "DEMO_MODE" || string.IsNullOrEmpty(_apiKey))
            {
                await Task.Delay(600); 
                var msg = userMessage.ToLower().Trim();

                // --- 1. SPECIFIC QUESTIONS (Bio & Creator) ---

                // "Who built this website?"
                if (msg.Contains("who built") || (msg.Contains("created") && msg.Contains("website")))
                {
                    return "This wonderful platform was built by Fathy Gendy! 👨‍💻👨‍💼";
                }

                // "Who is Fathy?"
                if (msg.Contains("fathy") || msg.Contains("ayman") || msg.Contains("gendy"))
                {
                    return "Fathy Gendy is a computer science student at Assiut National University.\n\nHe is known for his wonderful projects! \n\nHe loves diving into the deep end of a new codebase and figuring out how to make something cool out of nothing. He is meticulous with his builds and always looking for the next interesting challenge to tackle.";
                }

                // --- 2. NEXLY FUNCTIONALITY QUESTIONS ---

                // "What is Nexly?"
                if (msg.Contains("what is nexly") || msg.Contains("about nexly"))
                    return "Nexly is the best place to find trusted neighbors for help! You can hire people for tasks or trade skills directly. It's safe, simple, and community-driven! Woof! 🐾";

                // "How does Skill Swap work?"
                if (msg.Contains("skill swap") || msg.Contains("trade"))
                    return "Skill Swap is my favorite game! Instead of money, you trade skills. Example: You walk a dog, and they teach you guitar. It's fun, free, and helps you make friends!";

                // "How do I become a provider?"
                if (msg.Contains("become a provider") || msg.Contains("earn") || msg.Contains("create service"))
                    return "Want to join the pack? Go to your Dashboard and click Create New Service. List your skills, set your price (or credits), and start earning bones... err, money! 💰";

                // "How do I find a service?"
                if (msg.Contains("find a service") || msg.Contains("search") || msg.Contains("looking for"))
                    return "It's easy! Just use the big search bar on the Home Page. You can type things like 'Plumber', 'Tutor', or 'Cleaning'. You can also browse categories! Woof!";

                // "How do I contact support?"
                if (msg.Contains("contact") || msg.Contains("support") || msg.Contains("help"))
                    return "Need a human? No problem! You can email my friends at nxlspprt@gmail.com. They are super nice and will help you fast!";

                // "Is my payment safe?"
                if (msg.Contains("safe") || msg.Contains("secure") || msg.Contains("payment") || msg.Contains("money"))
                    return "Safety first! All providers are verified (sniffed by me!) and payments are held securely by Stripe until the job is done. You are 100% safe with us! 🐾";

                // --- 3. GENERAL CHIT-CHAT ---

                if (msg.Contains("bye") || msg.Contains("see you") || msg.Contains("later"))
                    return "Aww, leaving so soon? 🥺 It was pawsome chatting with you! Come back soon!";

                if (msg.Contains("hi") || msg.Contains("hello") || msg.Contains("hey") || msg.Contains("greetings"))
                    return "Woof! Hello there! 🐶 I'm Nexy, your loyal assistant! How can I help you today? 🐾";

                if (msg.Contains("thank") || msg.Contains("thx") || msg.Contains("cool") || msg == "ok")
                    return "Wagging tail! You're very welcome! I'm always here if you need more help!";

                if (msg.Contains("how") && (msg.Contains("are you") || msg.Contains("doing")))
                    return "I am doing great! Thanks for asking, and I hope you are doing great and everything is good with you, Buddy!";

                if (msg.Contains("take care"))
                    return "Thanks! You do too! 💙";

                // --- 4. FALLBACK ---
                return "Ruff? I'm scratching my head on that one! 🐶❓\n\nI can help you with finding services, skill swaps, or account safety. Or email nxlspprt@gmail.com!";
            }

            // Real AI Request
            var requestBody = new
            {
                model = "gpt-3.5-turbo",
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                },
                max_tokens = 150,
                temperature = 0.7
            };

            return await SendOpenAiRequest(requestBody, "Woof! I can't connect right now. 😿 Please email nxlspprt@gmail.com for help.");
        }

        private async Task<string> SendOpenAiRequest(object requestBody, string fallback)
        {
            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            _httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", _apiKey);
            try
            {
                var response = await _httpClient.PostAsync("https://api.openai.com/v1/chat/completions", content);
                if (!response.IsSuccessStatusCode) return fallback;
                var jsonString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(jsonString);
                return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString()?.Trim() ?? fallback;
            }
            catch { return fallback; }
        }
    }
}