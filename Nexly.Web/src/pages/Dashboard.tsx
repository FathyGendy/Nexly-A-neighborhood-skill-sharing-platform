import { useEffect, useState } from 'react';
import { searchServices, API_URL } from '../api/client'; 
import axios from 'axios';
import Logo from '../components/Logo';
import type { Service, User } from '../types'; 
import { CategoryData } from '../types';
import { useNavigate } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import { 
    LogOut, MapPin, Search, Star, X, ImageOff, ShieldCheck, Trophy, 
    User as UserIcon, ChevronDown, LayoutDashboard, Calendar, Settings, Medal, Home
} from 'lucide-react';

const ImageWithFallback = ({ src, alt, className }: { src?: string, alt: string, className?: string }) => {
    const [error, setError] = useState(false);

    if (!src || error || src.includes('placehold.co')) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
                <div className="flex flex-col items-center">
                    <ImageOff size={24} className="mb-1 opacity-50" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-50">No Image</span>
                </div>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt} 
            className={className}
            onError={() => setError(true)}
            loading="lazy"
        />
    );
};

export default function Dashboard() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [heroes, setHeroes] = useState<User[]>([]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const userString = localStorage.getItem('user');
        const userLocal: User | null = userString ? JSON.parse(userString) : null;

        if (!userLocal) {
            navigate('/login');
            return;
        }

        setCurrentUser(userLocal);
        
        const refreshUser = async () => {
            try {
                const res = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setCurrentUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            } catch (err) {
                console.error("Failed to refresh user data", err);
            }
        };

        refreshUser();
        fetchServices();
        fetchHeroes(); 
    }, [navigate]);

    useEffect(() => {
        if(currentUser) fetchServices();
    }, [selectedCategory, searchTerm]);

    const fetchHeroes = async () => {
        try {
            const res = await axios.get(`${API_URL}/auth/heroes`);
            setHeroes(res.data);
        } catch (err) {
            console.error("Failed to fetch heroes");
        }
    }

    const fetchServices = async () => {
        setLoading(true);
        try {
            const lat = 40.7128; // Default lat/lng for search context
            const lng = -74.0060;
            const data = await searchServices(
                lat, 
                lng, 
                selectedCategory !== null ? selectedCategory : undefined, 
                searchTerm
            );
            setServices(data);
        } catch (error) {
            console.error("Failed to fetch services", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchServices();
    };

    const handleLogout = () => {
        setIsMenuOpen(false);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('auth-change'));
        navigate('/login');
    };

    // --- Accepts slug or falls back to ID ---
    const goToProfile = (userId: string, slug?: string) => {
        navigate(`/profile/${slug || userId}`);
    };

    const handleMenuClick = (path: string) => {
        setIsMenuOpen(false);
        navigate(path);
    };

    if (!currentUser) return null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300" onClick={() => setIsMenuOpen(false)}> 
            
            {/* Navbar */}
            <nav className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-30 border-b border-gray-100 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div onClick={() => navigate('/')} className="cursor-pointer hover:opacity-80 transition">
                        <Logo className="h-10 w-10" />
                    </div>
                    
                    <div className="flex items-center gap-4 relative">
                        <span className="hidden md:block text-gray-600 dark:text-gray-300 font-medium">Hi, {currentUser.firstName}</span>
                        
                        <button 
                            // --- Use Slug ---
                            onClick={() => goToProfile(currentUser.id, currentUser.slug)}
                            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-full transition"
                            title="My Profile"
                        >
                            <UserIcon size={20} />
                        </button>

                        <div className="relative">
                            <button 
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className={`
                                    flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
                                    ${isMenuOpen 
                                        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400' 
                                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'}
                                `}
                            >
                                <span className="font-medium">Menu</span>
                                <ChevronDown 
                                    size={16} 
                                    className={`transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} 
                                />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 transform origin-top-right transition-all">
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700 mb-1">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Dashboard Navigation</p>
                                    </div>

                                    <button 
                                        onClick={() => handleMenuClick('/')}
                                        className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-3 transition-colors"
                                    >
                                        <Home size={18} />
                                        Home Page
                                    </button>

                                    {currentUser.isServiceProvider && (
                                        <button 
                                            onClick={() => handleMenuClick('/provider-dashboard')}
                                            className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-3 transition-colors"
                                        >
                                            <LayoutDashboard size={18} />
                                            Provider Portal
                                        </button>
                                    )}

                                    <button 
                                        onClick={() => handleMenuClick('/my-bookings')}
                                        className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-3 transition-colors"
                                    >
                                        <Calendar size={18} />
                                        My Bookings
                                    </button>

                                    <button 
                                        onClick={() => handleMenuClick('/settings')}
                                        className="w-full text-left px-4 py-2.5 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-700 dark:hover:text-blue-400 flex items-center gap-3 transition-colors"
                                    >
                                        <Settings size={18} />
                                        Settings & Privacy
                                    </button>

                                    <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

                                    <button 
                                        onClick={handleLogout}
                                        className="w-full text-left px-4 py-2.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors font-medium"
                                    >
                                        <LogOut size={18} />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white py-20 px-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
                        Find the perfect help, <span className="text-blue-400">instantly.</span>
                    </h1>
                    <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
                        Connect with verified neighbors for gardening, tutoring, and more.
                    </p>
                    <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto flex shadow-2xl rounded-full">
                        <input 
                            type="text" 
                            placeholder="Search services, types, or locations (e.g. Cairo)"
                            className="w-full px-8 py-4 rounded-full text-gray-800 focus:outline-none focus:ring-4 focus:ring-blue-500/30 text-lg placeholder-gray-400 dark:bg-gray-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button type="submit" className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-full hover:bg-blue-500 transition shadow-md flex items-center justify-center">
                            <Search size={20} />
                        </button>
                    </form>
                </div>
            </div>

            <main className="max-w-7xl mx-auto p-6 -mt-10 relative z-20 flex flex-col lg:flex-row gap-8">
                {/* LEFT COLUMN: Results */}
                <div className="flex-1">
                    {/* CATEGORY GRID */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-10 border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Browse by Category</h3>
                            {selectedCategory !== null && (
                                <button onClick={() => setSelectedCategory(null)} className="text-sm text-red-500 hover:underline flex items-center gap-1 font-medium">
                                    <X size={14}/> Clear Filter
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {CategoryData.map((cat) => (
                                <div 
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className={`
                                        cursor-pointer rounded-lg overflow-hidden relative group transition-all duration-300
                                        ${selectedCategory === cat.id ? 'ring-2 ring-blue-500 transform scale-105 shadow-md' : 'hover:shadow-lg hover:-translate-y-1'}
                                    `}
                                >
                                    <div className="h-24 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                        <ImageWithFallback src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" />
                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 to-transparent transition duration-300 ${selectedCategory === cat.id ? 'opacity-90' : 'opacity-70 group-hover:opacity-80'}`}></div>
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-3 text-center">
                                        <span className="text-white font-semibold text-sm tracking-wide">{cat.name}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RESULTS SECTION */}
                    <div className="flex justify-between items-end mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recommended Services</h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                            {services.length} result{services.length !== 1 && 's'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400">No services found</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services.map((service) => (
                                <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 flex flex-col h-full group">
                                    <div className="h-48 w-full relative bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                        <ImageWithFallback src={service.imageUrl} alt={service.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold text-white shadow-sm">
                                            {service.category}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <div className="mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1 text-lg group-hover:text-blue-600 transition">{service.title}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 mb-3 text-sm">
                                            <span className="text-amber-500 font-bold flex items-center gap-1">
                                                <Star size={14} fill="currentColor" /> {service.averageRating.toFixed(1)}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">|</span>
                                            <span className="text-gray-500 dark:text-gray-400">{service.totalReviews} reviews</span>
                                        </div>
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2 flex-grow">{service.description}</p>
                                        
                                        <div className="mt-auto pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); goToProfile(service.providerId); }}
                                                className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 p-1 -ml-1 rounded-lg transition"
                                            >
                                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                                    {service.providerName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col items-start">
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1">
                                                        {service.providerName}
                                                        {service.providerIsVerified && <ShieldCheck size={10} className="text-blue-500" fill="currentColor" fillOpacity={0.2} />}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <MapPin size={8} /> {service.providerAddress || 'Unknown Location'}
                                                    </span>
                                                </div>
                                            </button>
                                            
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                ${service.hourlyRate}<span className="text-xs text-gray-500 font-normal">/hr</span>
                                            </span>
                                        </div>

                                        <button 
                                            onClick={() => setSelectedService(service)}
                                            className="mt-4 w-full py-2.5 bg-gray-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-medium rounded-lg transition-colors shadow-sm text-sm"
                                        >
                                            Book Service
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Heroes */}
                <div className="w-full lg:w-80">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden sticky top-24">
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-900/10">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-500">
                                    <Trophy size={18} fill="currentColor" />
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white">Neighborhood Heroes</h3>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pl-1">Top 3 neighbors this month</p>
                        </div>

                        {/* List */}
                        <div className="p-2">
                            {heroes.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <p className="text-sm">No heroes yet.</p>
                                    <p className="text-xs mt-1">Be the first to help someone!</p>
                                </div>
                            ) : (
                                heroes.slice(0, 3).map((hero, index) => {
                                    let rankStyle = "text-gray-400 bg-gray-50 dark:bg-gray-700/50";
                                    let rankIcon = null;
                                    
                                    if (index === 0) {
                                        rankStyle = "text-amber-500 bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-100 dark:ring-amber-900/50";
                                        rankIcon = <Medal size={14} className="text-amber-500" fill="currentColor" />;
                                    } else if (index === 1) {
                                        rankStyle = "text-slate-400 bg-slate-50 dark:bg-slate-700/30";
                                        rankIcon = <Medal size={14} className="text-slate-400" fill="currentColor" />;
                                    } else if (index === 2) {
                                        rankStyle = "text-orange-400 bg-orange-50 dark:bg-orange-900/20";
                                        rankIcon = <Medal size={14} className="text-orange-400" fill="currentColor" />;
                                    }

                                    return (
                                        <button 
                                            key={hero.id} 
                                            // --- Use Slug for Heroes ---
                                            onClick={() => goToProfile(hero.id, hero.slug)}
                                            className={`
                                                relative w-full flex items-center gap-3 p-3 mb-2 rounded-xl transition-all duration-200
                                                hover:bg-gray-50 dark:hover:bg-gray-700 group
                                            `}
                                        >
                                            <div className={`
                                                flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm
                                                ${rankStyle}
                                            `}>
                                                {index === 0 ? "1" : index + 1}
                                            </div>

                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full border border-gray-100 dark:border-gray-600 overflow-hidden">
                                                    <ImageWithFallback src={hero.profileImageUrl} alt={hero.firstName} className="w-full h-full object-cover"/>
                                                </div>
                                                {index === 0 && (
                                                    <div className="absolute -top-2 -right-1 animate-bounce">
                                                        <span className="text-lg">👑</span>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 text-left min-w-0">
                                                <div className="flex items-center gap-1">
                                                    <span className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate">
                                                        {hero.firstName} {hero.lastName.charAt(0)}.
                                                    </span>
                                                    {hero.isVerifiedNeighbor && (
                                                        <ShieldCheck size={12} className="text-blue-500 flex-shrink-0" fill="currentColor" fillOpacity={0.2} />
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                                                    <span className="font-medium text-gray-900 dark:text-white">{hero.monthlyHelps}</span> Helps
                                                </div>
                                            </div>

                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                {rankIcon}
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">My Status</span>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                    {currentUser.vouchesCount || 0}/3 Vouchers
                                </span>
                            </div>
                            
                            <div className="relative h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(((currentUser.vouchesCount || 0) / 3) * 100, 100)}%` }}
                                ></div>
                            </div>
                            
                            <p className="text-[10px] text-center text-gray-400 mt-2">
                                Get 5-star reviews to earn the badge!
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            {selectedService && (
                <BookingModal service={selectedService} isOpen={true} onClose={() => setSelectedService(null)} />
            )}
        </div>
    );
}