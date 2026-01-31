import { useState, useRef, useEffect } from 'react';
import { chatWithNexy } from '../api/client';
import { toast } from 'react-hot-toast';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
}

const SUGGESTED_QUESTIONS = [
    "Who built this wonderful website?",
    "Who is Fathy?",
    "What is Nexly?",
    "How does Skill Swap work?",
    "How do I become a provider?",
    "How do I find a service?",
    "How do I contact support?",
    "Is my payment safe?"
];

// --- CUSTOM PUPPY LOGO (Built-in SVG) ---
const PuppyLogo = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Ears */}
        <path d="M20 30C10 30 5 50 15 60C20 65 25 50 25 40" fill="#E2E8F0" stroke="#475569" strokeWidth="3"/>
        <path d="M80 30C90 30 95 50 85 60C80 65 75 50 75 40" fill="#E2E8F0" stroke="#475569" strokeWidth="3"/>
        {/* Head */}
        <circle cx="50" cy="50" r="35" fill="white" stroke="#475569" strokeWidth="3"/>
        {/* Eyes */}
        <circle cx="38" cy="45" r="4" fill="#1E293B"/>
        <circle cx="62" cy="45" r="4" fill="#1E293B"/>
        {/* Nose */}
        <ellipse cx="50" cy="55" rx="6" ry="4" fill="#1E293B"/>
        {/* Mouth */}
        <path d="M45 62Q50 65 55 62" stroke="#1E293B" strokeWidth="2" strokeLinecap="round"/>
        {/* Tie */}
        <path d="M50 75L40 90H60L50 75Z" fill="#2563EB" stroke="#1E40AF" strokeWidth="1"/>
        <circle cx="50" cy="75" r="3" fill="#1E40AF"/>
    </svg>
);

export default function NexyWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [userName, setUserName] = useState("Friend");
    
    useEffect(() => {
        const updateName = () => {
            try {
                const userStr = localStorage.getItem('user');
                if (userStr) {
                    const userObj = JSON.parse(userStr);
                    if (userObj.firstName) setUserName(userObj.firstName);
                    else if (userObj.fullName) setUserName(userObj.fullName.split(' ')[0]);
                } else {
                    setUserName("Friend");
                }
            } catch (e) {
                console.log("Could not load user name");
            }
        };

        // Run immediately on mount
        updateName();

        // Listen for the 'auth-change' event (triggered by Login/Logout)
        window.addEventListener('auth-change', updateName);

        // Cleanup listener when component unmounts
        return () => {
            window.removeEventListener('auth-change', updateName);
        };
    }, []);
    // ------------------------------------------

    // Initial Greeting
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: `Woof! 🐶 Hi ${userName}! I'm Nexy! I'm doing pawsome! How can I help you today?`, sender: 'bot' }
    ]);

    // Update greeting inside chat if name changes
    useEffect(() => {
        if (messages.length === 1 && messages[0].sender === 'bot') {
             setMessages([{ id: 1, text: `Woof! 🐶 Hi ${userName}! I'm Nexy! I'm doing pawsome! How can I help you today?`, sender: 'bot' }]);
        }
    }, [userName]);

    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen, isTyping]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || inputValue;
        if (!textToSend.trim()) return;

        const userMsg: Message = { id: Date.now(), text: textToSend, sender: 'user' };
        setMessages(prev => [...prev, userMsg]);
        
        if (!textOverride) setInputValue("");
        setIsTyping(true);

        try {
            const data = await chatWithNexy(userMsg.text);
            const botMsg: Message = { 
                id: Date.now() + 1, 
                text: data.response, 
                sender: 'bot' 
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            console.error(error);
            toast.error("Nexy is napping 😴. Try again later.");
            setIsTyping(false);
        } finally {
            setIsTyping(false);
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        handleSend();
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden flex flex-col animate-scale-up origin-bottom-right h-[500px]">
                    
                    {/* Header */}
                    <div className="bg-primary p-4 flex justify-between items-center text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                             <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        </div>

                        <div className="flex items-center gap-4 z-10">
                            <div className="relative">
                                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30 overflow-hidden">
                                    <PuppyLogo className="w-10 h-10" />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-xl tracking-tight">Nexy</h3>
                                <p className="text-xs text-blue-100 font-medium">Hello, sweetie! Nexy is at your service! 👔</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition z-10">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50 scrollbar-hide">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.sender === 'bot' && (
                                    <div className="w-8 h-8 rounded-full bg-blue-50 overflow-hidden mr-2 flex-shrink-0 border border-blue-100 flex items-center justify-center">
                                        <PuppyLogo className="w-7 h-7" />
                                    </div>
                                )}
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm 
                                    ${msg.sender === 'user' 
                                        ? 'bg-primary text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-gray-100 dark:border-slate-700 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex justify-start items-end">
                                <div className="w-8 h-8 rounded-full bg-blue-50 overflow-hidden mr-2 flex-shrink-0 border border-blue-100 flex items-center justify-center">
                                    <PuppyLogo className="w-7 h-7" />
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-gray-100 dark:border-slate-700 flex gap-1">
                                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-100"></span>
                                    <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce delay-200"></span>
                                </div>
                            </div>
                        )}

                        {!isTyping && messages[messages.length - 1].sender === 'bot' && (
                            <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-800 animate-fade-in">
                                <p className="text-xs text-slate-400 mb-2 ml-1">Suggested for you:</p>
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTED_QUESTIONS.map((q, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => handleSend(q)}
                                            className="text-xs bg-white hover:bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700 px-3 py-1.5 rounded-full border border-blue-100 dark:border-slate-600 transition-all shadow-sm active:scale-95"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleFormSubmit} className="p-3 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask Nexy..."
                            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                        <button 
                            type="submit"
                            disabled={!inputValue.trim() || isTyping}
                            className="p-2 bg-primary text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/30"
                        >
                            <svg className="w-5 h-5 translate-x-px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                        </button>
                    </form>
                </div>
            )}

            {/* LAUNCHER AREA */}
            <div className="relative group">
                {/* Speech Bubble (Emoji Removed) */}
                {!isOpen && (
                    <div className="absolute bottom-20 right-0 w-32 bg-white dark:bg-slate-800 p-3 rounded-xl rounded-br-none shadow-xl mb-2 mr-4 animate-bounce-slow transform origin-bottom-right border border-gray-100 dark:border-slate-700 z-40">
                        <p className="text-xs text-slate-700 dark:text-slate-300 font-medium text-center">
                            Hi {userName}! <br/> Need help?
                        </p>
                        <div className="absolute -bottom-2 right-4 w-4 h-4 bg-white dark:bg-slate-800 transform rotate-45 border-b border-r border-gray-100 dark:border-slate-700"></div>
                    </div>
                )}

                {/* THE SIMPLE LAUNCHER BUTTON (No Wiggle, No Red Dot) */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'} transition-all duration-300 w-16 h-16 bg-white dark:bg-slate-800 border-2 border-primary/20 flex items-center justify-center rounded-full shadow-2xl hover:shadow-blue-500/30 hover:scale-110 active:scale-95 z-50`}
                >
                    <PuppyLogo className="w-10 h-10" />
                </button>
            </div>
        </div>
    );
}