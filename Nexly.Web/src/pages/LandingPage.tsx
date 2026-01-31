import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import { CategoryData } from '../types';
import { Search, ArrowRight, CheckCircle2, Wrench, Sprout, GraduationCap, Sparkles, LayoutDashboard } from 'lucide-react';
import testimonialImg from '../assets/happy-user.jpeg';

export default function LandingPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<{ firstName: string } | null>(null);

    useEffect(() => {
        const userString = localStorage.getItem('user');
        if (userString) {
            try {
                const parsedUser = JSON.parse(userString);
                setUser(parsedUser);
            } catch (e) {
                console.error("Error parsing user data", e);
            }
        }
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-gray-900 dark:text-gray-100 selection:bg-blue-100 selection:text-blue-700">
            
            {/* --- NAVBAR --- */}
            <nav className="fixed w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md z-50 border-b border-gray-100 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <Logo className="h-9 w-9" />
                    <div className="flex items-center gap-6">
                        {user ? (
                            // LOGGED IN VIEW
                            <>
                                <span className="text-gray-600 dark:text-gray-300 font-medium hidden sm:block">
                                    Hi, {user.firstName}
                                </span>
                                <button 
                                    onClick={() => navigate('/dashboard')}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 flex items-center gap-2"
                                >
                                    <LayoutDashboard size={18} />
                                    Dashboard
                                </button>
                            </>
                        ) : (
                            // LOGGED OUT VIEW
                            <>
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="text-gray-600 dark:text-gray-300 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition"
                                >
                                    Log in
                                </button>
                                <button 
                                    onClick={() => navigate('/register')}
                                    className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20"
                                >
                                    Get Started
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* --- HERO SECTION (Split Layout) --- */}
            <section className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 transition-colors duration-300">
                
                {/* Left: Content */}
                <div className="flex-1 text-center lg:text-left space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm font-semibold border border-blue-100 dark:border-blue-800">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 dark:bg-blue-400"></span>
                        </span>
                        #1 Service Marketplace in your area
                    </div>
                    
                    <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
                        Help is just around the <span className="text-blue-600 dark:text-blue-500">corner.</span>
                    </h1>
                    
                    <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                        Nexly connects you with verified neighbors for gardening, tutoring, cleaning, and more. Simple, safe, and secure.
                    </p>

                    {/* Search Component */}
                    <div className="max-w-md mx-auto lg:mx-0 relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                        <div 
                            onClick={() => navigate(user ? '/dashboard' : '/register')}
                            className="relative bg-white dark:bg-slate-900 rounded-full flex items-center p-2 shadow-xl cursor-pointer border border-gray-100 dark:border-slate-800"
                        >
                            <Search className="ml-4 text-gray-400 dark:text-gray-500" size={24} />
                            <div className="flex-1 px-4 text-gray-500 dark:text-gray-400 select-none">
                                Try "Math Tutor" or "Plumber"...
                            </div>
                            <button className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition">
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center lg:justify-start gap-x-8 gap-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-600 dark:text-blue-500" /> Verified Experts</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-600 dark:text-blue-500" /> Secure Payment</span>
                        <span className="flex items-center gap-2"><CheckCircle2 size={18} className="text-blue-600 dark:text-blue-500" /> 24/7 Support</span>
                    </div>
                </div>

                {/* Right: Visual (Rounded Image) */}
                <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
                    {/* Decorative Blob */}
                    <div className="absolute top-0 right-0 w-full h-full bg-blue-100/50 dark:bg-blue-500/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10 -z-10"></div>
                    
                    <img 
                        src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" 
                        alt="Community Collaboration" 
                        className="rounded-3xl shadow-2xl border-4 border-white dark:border-slate-800 rotate-2 hover:rotate-0 transition duration-500 object-cover w-full h-[500px]"
                    />
                    
                    {/* --- COMPACT 'FATHY / I LOVE NEXLY' CARD --- */}
<div className="absolute -bottom-6 -left-6 bg-white dark:bg-slate-900 p-3 pr-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-black/50 border border-gray-100 dark:border-slate-800 flex items-center gap-3">
    
    {/* Profile Picture (Smaller: w-10) */}
    <img 
        src={testimonialImg} 
        alt="Fathy" 
        className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 p-0.5 bg-white dark:bg-slate-800"
    />

    {/* Text Container (Stacked) */}
    <div className="flex flex-col">
        {/* Name */}
        <span className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
            Fathy
        </span>
        
        {/* Sentence */}
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            I love Nexly
        </span>
    </div>
</div>
                </div>
            </section>

            {/* --- CATEGORIES PREVIEW --- */}
            <section className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex justify-between items-end mb-10">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Popular Services</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Discover what your neighbors are offering.</p>
                        </div>
                        <button onClick={() => navigate(user ? '/dashboard' : '/login')} className="hidden md:flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:gap-3 transition-all">
                            View All Categories <ArrowRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {CategoryData.slice(0, 6).map((cat) => (
                            <div 
                                key={cat.id}
                                onClick={() => navigate(user ? '/dashboard' : '/login')}
                                className="group bg-white dark:bg-slate-900 rounded-2xl p-3 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-slate-800 hover:-translate-y-1"
                            >
                                <div className="h-32 w-full overflow-hidden rounded-xl relative bg-gray-100 dark:bg-slate-800">
                                    <img 
                                        src={cat.image} 
                                        alt={cat.name} 
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-90 group-hover:opacity-100" 
                                    />
                                </div>
                                <div className="mt-4 mb-2 text-center">
                                    <h3 className="font-bold text-gray-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{cat.name}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- CREATIVE OPEN CTA SECTION --- */}
            <section className="py-32 relative overflow-hidden bg-white dark:bg-slate-950">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-50"></div>
                
                {/* Central Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-100 dark:bg-blue-900/20 rounded-full blur-[100px] -z-10"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col items-center text-center">
                        
                        {/* Main Headline */}
                        <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 dark:text-white mb-6 z-20 relative">
                            Your neighborhood, <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                unlocked.
                            </span>
                        </h2>

                        <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mb-10 leading-relaxed z-20 relative">
                            Stop searching and start connecting. Join the community that’s redefining how we get things done locally.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto z-20 relative">
                            <button 
                                onClick={() => navigate(user ? '/dashboard' : '/register')}
                                className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-2xl flex items-center justify-center gap-2"
                            >
                                {user ? 'Go to Dashboard' : 'Get Started Now'} <ArrowRight size={20} />
                            </button>
                            {!user && (
                                <button 
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-white dark:bg-slate-900 text-gray-900 dark:text-white border border-gray-200 dark:border-slate-800 rounded-full font-bold text-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Log in
                                </button>
                            )}
                        </div>

                        {/* Floating Elements (Moved further to corners to avoid text overlap) */}
                        
                        {/* 1. Top Left - Gardening (Moved up and far left) */}
                        <div className="hidden md:flex absolute -top-8 left-0 lg:left-8 animate-bounce delay-700 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 items-center gap-3 rotate-[-6deg]">
                            <div className="bg-green-100 dark:bg-green-900/30 p-2.5 rounded-full text-green-600 dark:text-green-400">
                                <Sprout size={20} />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-gray-200">Gardening</span>
                        </div>

                        {/* 2. Top Right - Tutoring (Moved up and far right) */}
                        <div className="hidden md:flex absolute top-4 right-0 lg:right-8 animate-bounce delay-1000 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 items-center gap-3 rotate-[3deg]">
                            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2.5 rounded-full text-yellow-600 dark:text-yellow-400">
                                <GraduationCap size={20} />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-gray-200">Tutoring</span>
                        </div>

                        {/* 3. Bottom Left - Cleaning (Moved down and far left) */}
                        <div className="hidden md:flex absolute -bottom-4 left-4 lg:left-12 animate-bounce delay-2000 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 items-center gap-3 rotate-[5deg]">
                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2.5 rounded-full text-purple-600 dark:text-purple-400">
                                <Sparkles size={20} />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-gray-200">Cleaning</span>
                        </div>

                        {/* 4. Bottom Right - Repairs (Moved down and far right) */}
                        <div className="hidden md:flex absolute bottom-8 right-0 lg:right-12 animate-bounce delay-500 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 items-center gap-3 rotate-[-4deg]">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-full text-blue-600 dark:text-blue-400">
                                <Wrench size={20} />
                            </div>
                            <span className="font-semibold text-gray-900 dark:text-gray-200">Home Repair</span>
                        </div>

                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-white dark:bg-slate-950 py-12 px-6 border-t border-gray-100 dark:border-slate-900 transition-colors duration-300">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 opacity-60">
                    <div className="flex items-center gap-2">
                        <Logo className="h-6 w-6 grayscale dark:invert" />
                        <span className="font-medium text-gray-900 dark:text-white">Nexly Inc.</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">© 2026. Made with care for the community.</p>
                </div>
            </footer>
        </div>
    );
}