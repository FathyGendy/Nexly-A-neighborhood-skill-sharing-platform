import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { 
    Calendar, Clock, ArrowLeft, Coins, ArrowRightLeft, 
    MessageSquare, Star, SearchX, CheckCircle2, 
    Hourglass, AlertCircle
} from 'lucide-react'; 
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from '../components/ChatWindow';
import ReviewModal from '../components/ReviewModal';
import { useSignalR } from '../hooks/useSignalR';

// --- TYPES ---
interface Booking {
    id: number;
    providerName: string;
    serviceTitle: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
    status: number; 
    paymentMethod: string;
    exchangeServiceTitle?: string;
    hasBeenReviewed: boolean;
}

// --- CONFIG ---
const STATUS_CONFIG: Record<number, { label: string, color: string, icon: any }> = {
    0: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800', icon: Hourglass },
    1: { label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800', icon: CheckCircle2 },
    2: { label: 'Rejected', color: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-900', icon: AlertCircle },
    3: { label: 'In Progress', color: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800', icon: Clock },
    4: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800', icon: CheckCircle2 },
    5: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700', icon: SearchX },
    6: { label: 'Disputed', color: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800', icon: AlertCircle },
};

export default function MyBookings() {
    const navigate = useNavigate();
    const { notifications } = useSignalR(); 

    // State
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'cancelled'>('active');
    
    // Modals
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);

    // --- DATA FETCHING ---
    const fetchBookings = async () => {
        try {
            const response = await apiClient.get('/Bookings/my-bookings');
            setBookings(response.data);
        } catch (error) {
            console.error("Failed to fetch bookings", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchBookings(); }, []);
    
    useEffect(() => {
        if (notifications.length > 0) {
            const latest = notifications[notifications.length - 1];
            if (latest.type?.includes('Booking')) fetchBookings();
        }
    }, [notifications]);

    // --- HANDLERS ---
    const handleOpenReview = (booking: Booking) => {
        setSelectedBookingForReview(booking);
        setReviewModalOpen(true);
    };

    const handleReviewSubmitted = (success: boolean) => {
        setReviewModalOpen(false);
        setSelectedBookingForReview(null);
        if (success) fetchBookings(); 
    };

    // --- FILTERING ---
    const filteredBookings = bookings.filter(b => {
        if (activeTab === 'active') return [0, 1, 3].includes(b.status);
        if (activeTab === 'completed') return [4].includes(b.status);
        if (activeTab === 'cancelled') return [2, 5, 6].includes(b.status);
        return false;
    });

    const getDay = (dateStr: string) => new Date(dateStr).getDate();
    const getMonth = (dateStr: string) => new Date(dateStr).toLocaleString('default', { month: 'short' });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
            {/* --- HEADER SECTION --- */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-20 transition-colors duration-300">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                            <ArrowLeft size={22} />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Bookings</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Manage your appointments & history</p>
                        </div>
                    </div>
                    
                    {/* Stats Pill (Hidden on mobile) */}
                    <div className="hidden md:flex bg-gray-50 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600 p-1">
                        <div className="px-4 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                            <span className="text-blue-600 dark:text-blue-400 font-bold mr-1">{bookings.filter(b => b.status === 4).length}</span> Completed
                        </div>
                        <div className="px-4 py-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                            <span className="text-amber-600 dark:text-amber-400 font-bold mr-1">{bookings.filter(b => [0,1,3].includes(b.status)).length}</span> Active
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                
                {/* --- TABS --- */}
                <div className="flex gap-8 mb-8 border-b border-gray-200 dark:border-gray-700">
                    {['active', 'completed', 'cancelled'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-bold uppercase tracking-wider transition-all relative ${
                                activeTab === tab ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <motion.div layoutId="underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* --- CONTENT --- */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400"></div>
                        <p className="text-gray-400 dark:text-gray-500 text-sm animate-pulse">Loading your schedule...</p>
                    </div>
                ) : filteredBookings.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 text-center"
                    >
                        <div className="bg-blue-50 dark:bg-blue-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500 dark:text-blue-400">
                            <Calendar size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No {activeTab} bookings found</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like your schedule is clear for now.</p>
                        {activeTab === 'active' && (
                            <button onClick={() => navigate('/dashboard')} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none">
                                Browse Services
                            </button>
                        )}
                    </motion.div>
                ) : (
                    <div className="space-y-4">
                        <AnimatePresence mode="popLayout">
                            {filteredBookings.map((booking, index) => {
                                const status = STATUS_CONFIG[booking.status] || STATUS_CONFIG[0];
                                const StatusIcon = status.icon;

                                return (
                                    <motion.div
                                        key={booking.id}
                                        initial={{ opacity: 0, scale: 0.98 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.98 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                                    >
                                        <div className="flex flex-col md:flex-row">
                                            {/* Left: Date */}
                                            <div className="bg-gray-50 dark:bg-gray-700/50 p-6 flex flex-col items-center justify-center min-w-[120px] border-b md:border-b-0 md:border-r border-gray-100 dark:border-gray-700 group-hover:bg-blue-50/30 dark:group-hover:bg-blue-900/20 transition">
                                                <span className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">{getDay(booking.scheduledDate)}</span>
                                                <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{getMonth(booking.scheduledDate)}</span>
                                                <div className="mt-2 text-xs text-gray-400 font-medium flex items-center gap-1">
                                                    <Clock size={12} /> {booking.startTime}
                                                </div>
                                            </div>

                                            {/* Middle: Info */}
                                            <div className="p-6 flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">{booking.serviceTitle}</h3>
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${status.color}`}>
                                                        <StatusIcon size={14} strokeWidth={2.5} /> {status.label}
                                                    </span>
                                                </div>

                                                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 flex items-center gap-2">
                                                    Provided by <span className="font-semibold text-gray-800 dark:text-gray-200">{booking.providerName}</span>
                                                </p>

                                                {/* Payment Badge */}
                                                <div className="flex flex-wrap gap-2">
                                                    {booking.paymentMethod === 'Credits' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-100 dark:border-purple-800">
                                                            <Coins size={14} /> {Math.ceil(booking.durationHours)} Credits
                                                        </span>
                                                    )}
                                                    {booking.paymentMethod === 'Barter' && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs font-bold border border-orange-100 dark:border-orange-800">
                                                            <ArrowRightLeft size={14} /> Swap: {booking.exchangeServiceTitle || 'Service'}
                                                        </span>
                                                    )}
                                                    {(!booking.paymentMethod || booking.paymentMethod === 'Cash') && (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold border border-green-100 dark:border-green-800">
                                                            Cash: ${booking.totalAmount}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs font-medium border border-gray-100 dark:border-gray-600">
                                                        <Hourglass size={14} /> {booking.durationHours} hrs
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="p-6 flex flex-row md:flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                                                <button 
                                                    onClick={() => setActiveChatId(booking.id)}
                                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold hover:bg-white dark:hover:bg-gray-600 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:shadow-sm transition"
                                                >
                                                    <MessageSquare size={16} /> Chat
                                                </button>

                                                {booking.status === 4 && !booking.hasBeenReviewed && (
                                                    <button 
                                                        onClick={() => handleOpenReview(booking)}
                                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 dark:bg-black text-white rounded-lg text-sm font-semibold hover:bg-black dark:hover:bg-gray-900 hover:scale-105 transition shadow-lg shadow-gray-300 dark:shadow-none"
                                                    >
                                                        <Star size={16} className="fill-white" /> Rate
                                                    </button>
                                                )}
                                                
                                                {booking.hasBeenReviewed && (
                                                    <div className="text-center text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/50 py-1 rounded-md select-none">
                                                        ✓ Reviewed
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* --- MODALS --- */}
            {activeChatId && (
                <ChatWindow bookingId={activeChatId} onClose={() => setActiveChatId(null)} />
            )}

            {selectedBookingForReview && (
                <ReviewModal 
                    isOpen={reviewModalOpen}
                    bookingId={selectedBookingForReview.id}
                    providerName={selectedBookingForReview.providerName}
                    onClose={handleReviewSubmitted}
                />
            )}
        </div>
    );
}