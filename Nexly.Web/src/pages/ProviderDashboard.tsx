import { useEffect, useState } from 'react';
import { apiClient, getMyServices, deleteService, updateService } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { 
    LogOut, CheckCircle, XCircle, Trash2, Edit, 
    Calendar, DollarSign, Clock, MessageSquare, Plus, Image as ImageIcon, X, ImageOff,
    Coins, ArrowRightLeft, CheckSquare, ChevronRight, LayoutDashboard, User as UserIcon,
    AlertCircle, History, Ban, Type, Tag, FileText, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatWindow from '../components/ChatWindow';
import type { User } from '../types'; 

// --- CONSTANTS ---
const CATEGORIES = [
    "Cleaning", 
    "Gardening", 
    "Tutoring", 
    "HomeRepair",  
    "Cooking", 
    "PetCare", 
    "Moving", 
    "Technology", 
    "Fitness", 
    "Music", 
    "Art", 
    "Other"
];

const FALLBACK_IMAGE = 'https://placehold.co/600x400?text=Nexly+Service';

const getValidImageUrl = (url?: string) => {
    if (!url) return FALLBACK_IMAGE;
    if (url.includes('via.placeholder.com')) return FALLBACK_IMAGE; 
    return url;
};

const ServiceThumbnail = ({ src, category }: { src?: string, category: string }) => {
    const [error, setError] = useState(false);

    if (!src || error || src.includes('placehold.co')) {
        return (
            <div className="w-full h-full bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 group-hover:bg-gray-100 dark:group-hover:bg-gray-600 transition">
                <ImageOff size={24} className="mb-2 opacity-40" />
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-40">No Image</span>
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={category} 
            className="w-full h-full object-cover group-hover:scale-105 transition duration-700 ease-in-out"
            onError={() => setError(true)}
        />
    );
};

// --- TYPES ---
interface Booking {
    id: number;
    clientName: string;
    serviceTitle: string;
    scheduledDate: string;
    startTime: string;
    durationHours: number;
    totalAmount: number;
    status: number; 
    paymentMethod?: string;
    exchangeServiceTitle?: string;
}

interface ServiceItem {
    id: number;
    title: string;
    description: string;
    hourlyRate: number;
    category: string;
    imageUrl?: string;
}

const Toast = ({ message, type, onClose }: { message: string, type: 'success'|'error', onClose: () => void }) => (
    <div className={`fixed bottom-6 right-6 px-6 py-4 rounded-xl shadow-2xl text-white font-medium flex items-center gap-3 animate-in slide-in-from-right-10 z-50 backdrop-blur-md ${type === 'success' ? 'bg-green-600/95' : 'bg-red-600/95'}`}>
        {type === 'success' ? <CheckCircle size={20}/> : <XCircle size={20}/>}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 text-white/80 hover:text-white transition p-1">
            <X size={16} />
        </button>
    </div>
);

const Modal = ({ isOpen, title, children, onClose }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700"
            >
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur z-10">
                    <h3 className="font-bold text-xl text-gray-800 dark:text-white tracking-tight">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-full transition"><X size={20}/></button>
                </div>
                <div className="p-0 text-gray-800 dark:text-gray-200">{children}</div>
            </motion.div>
        </div>
    );
};

export default function ProviderDashboard() {
    const navigate = useNavigate();
    
    // Data State
    const [incomingBookings, setIncomingBookings] = useState<Booking[]>([]);
    const [myServices, setMyServices] = useState<ServiceItem[]>([]);
    const [loading, setLoading] = useState(true);
    
    // User State
    const [user, setUser] = useState<User | null>(null);
    
    // UI State
    const [activeTab, setActiveTab] = useState<'requests' | 'services'>('services');
    const [requestSubTab, setRequestSubTab] = useState<'pending' | 'active' | 'completed' | 'cancelled'>('pending');
    const [activeChatId, setActiveChatId] = useState<number | null>(null);
    const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

    // Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<number | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<ServiceItem | null>(null);
    const [editImageFile, setEditImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const showToast = (msg: string, type: 'success'|'error') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 5000); 
    };

    const fetchData = async () => {
        try {
            const bookingsRes = await apiClient.get('/Bookings/incoming-requests');
            const servicesData = await getMyServices();
            setIncomingBookings(bookingsRes.data);
            setMyServices(servicesData || []);
        } catch (error) {
            console.error("Failed to fetch data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (!userStr) { navigate('/login'); return; }
        setUser(JSON.parse(userStr));
        fetchData();
    }, []);

    const handleStatusUpdate = async (id: number, status: 'Confirmed' | 'Cancelled' | 'Completed') => {
        try {
            await apiClient.put(`/Bookings/${id}/status`, { status });
            const res = await apiClient.get('/Bookings/incoming-requests');
            setIncomingBookings(res.data);
            
            const msg = status === 'Completed' 
                ? 'Job completed! Credits/Payment transferred.' 
                : `Booking ${status.toLowerCase()}.`;
            
            showToast(msg, 'success');
        } catch (error) {
            showToast("Failed to update status", 'error');
        }
    };

    const confirmDelete = (id: number) => { setServiceToDelete(id); setIsDeleteModalOpen(true); };
    const executeDelete = async () => { if (!serviceToDelete) return; try { await deleteService(serviceToDelete); setMyServices(myServices.filter(s => s.id !== serviceToDelete)); showToast("Service deleted successfully", 'success'); setIsDeleteModalOpen(false); } catch (error: any) { const msg = error.response?.data?.message || "Cannot delete service."; showToast(msg, 'error'); setIsDeleteModalOpen(false); } };
    const openEditModal = (service: ServiceItem) => { setEditingService(service); setEditImageFile(null); setImagePreview(getValidImageUrl(service.imageUrl)); setIsEditModalOpen(true); };
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { const file = e.target.files[0]; setEditImageFile(file); setImagePreview(URL.createObjectURL(file)); } };
    const handleEditSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!editingService) return; try { const formData = new FormData(); formData.append('title', editingService.title); formData.append('description', editingService.description); formData.append('hourlyRate', (editingService.hourlyRate || 0).toString()); formData.append('category', editingService.category); if (editImageFile) formData.append('Image', editImageFile); await updateService(editingService.id, formData); const servicesData = await getMyServices(); setMyServices(servicesData || []); showToast("Service updated successfully", 'success'); setIsEditModalOpen(false); } catch (error) { showToast("Failed to update service", 'error'); } };

    const getStatusColor = (status: number) => {
        switch(status) {
            case 0: return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'; 
            case 1: return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'; 
            case 2: return 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'; 
            case 3: return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800'; 
            case 4: return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'; 
            default: return 'bg-gray-50 text-gray-500 dark:text-gray-400';
        }
    };

    // --- HELPER COMPONENT FOR BOOKING CARD ---
    const BookingCard = ({ booking }: { booking: Booking }) => (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition duration-300 relative overflow-hidden group mb-4"
        >
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-6 relative z-10">
                <div className="flex items-start gap-5">
                    <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner ${
                        booking.status === 0 ? 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400' :
                        booking.status === 1 ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' :
                        booking.status === 4 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' :
                        'bg-gray-50 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    }`}>
                        {booking.paymentMethod === 'Credits' ? <Coins size={28}/> : 
                         booking.paymentMethod === 'Barter' ? <ArrowRightLeft size={28}/> : 
                         <Calendar size={28} />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{booking.clientName}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${getStatusColor(booking.status)}`}>
                                {booking.status === 0 ? 'Pending' : booking.status === 1 ? 'Confirmed' : booking.status === 4 ? 'Completed' : booking.status === 2 ? 'Rejected' : 'Cancelled'}
                            </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 font-medium mb-3">{booking.serviceTitle}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-md"><Clock size={14}/> {new Date(booking.scheduledDate).toLocaleDateString()} • {booking.startTime}</span>
                            
                            {(!booking.paymentMethod || booking.paymentMethod === 'Cash') && <span className="flex items-center gap-1.5 font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md"><DollarSign size={14}/> ${booking.totalAmount}</span>}
                            
                            {booking.paymentMethod === 'Credits' && <span className="flex items-center gap-1.5 font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-md"><Coins size={14}/> {Math.ceil(booking.durationHours)} Credits</span>}
                            
                            {booking.paymentMethod === 'Barter' && <span className="flex items-center gap-1.5 font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md"><ArrowRightLeft size={14}/> Swap: {booking.exchangeServiceTitle || 'Service'}</span>}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:border-l md:border-gray-100 dark:md:border-gray-700 md:pl-6">
                    {booking.status === 0 && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => handleStatusUpdate(booking.id, 'Cancelled')} className="p-3 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition tooltip" title="Reject"><XCircle size={24} /></button>
                            <button onClick={() => handleStatusUpdate(booking.id, 'Confirmed')} className="flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-md shadow-gray-200 dark:shadow-none hover:bg-gray-800 dark:hover:bg-gray-200 hover:-translate-y-0.5 transition"><CheckCircle size={18} /> Accept</button>
                        </div>
                    )}

                    {booking.status === 1 && (
                        <button 
                            onClick={() => handleStatusUpdate(booking.id, 'Completed')}
                            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:-translate-y-0.5 transition shadow-lg shadow-blue-200 dark:shadow-none"
                        >
                            <CheckSquare size={18} /> Mark Complete
                        </button>
                    )}
                    
                    <button onClick={() => setActiveChatId(booking.id)} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 hover:text-blue-600 dark:hover:text-blue-400 transition"><MessageSquare size={20} /></button>
                </div>
            </div>
        </motion.div>
    );

    // Grouping Logic
    const pendingRequests = incomingBookings.filter(b => b.status === 0);
    const confirmedRequests = incomingBookings.filter(b => b.status === 1);
    const completedRequests = incomingBookings.filter(b => b.status === 4);
    const cancelledRequests = incomingBookings.filter(b => ![0, 1, 4].includes(b.status));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans text-gray-800 dark:text-white transition-colors duration-300">
            {/* --- HEADER --- */}
            <nav className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-30 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-black dark:bg-blue-600 p-2 rounded-xl">
                            <LayoutDashboard className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Nexly<span className="text-blue-600 dark:text-blue-400">Provider</span></span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {user && (
                            <button
                                onClick={() => navigate(`/profile/${user.slug || user.id}`)}
                                className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition"
                            >
                                <UserIcon size={16} />
                                View Profile
                            </button>
                        )}

                        <div className="hidden md:flex items-center bg-gray-100/80 dark:bg-gray-700/80 p-1 rounded-full border border-gray-200 dark:border-gray-600 backdrop-blur-md">
                            <div className="px-4 flex items-center gap-2.5">
                                <span className="relative flex h-2.5 w-2.5">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{myServices.length}</span>
                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wide">Services Active</span>
                                </div>
                            </div>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="flex items-center gap-2 px-4 py-1.5 bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-full shadow-sm border border-gray-200 dark:border-gray-500 hover:border-blue-200 transition-all text-xs font-bold group"
                            >
                                Client View
                                <ChevronRight size={14} className="text-gray-400 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5"/>
                            </button>
                        </div>

                        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full" title="Logout">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">Dashboard</h1>
                        <p className="text-gray-500 dark:text-gray-400 text-lg">
                            You have <span className="font-bold text-gray-900 dark:text-white">{pendingRequests.length}</span> pending requests today.
                        </p>
                    </div>
                </div>

                {/* --- MAIN TAB SWITCHER (Portfolio vs Requests) --- */}
                <div className="flex gap-8 border-b border-gray-200 dark:border-gray-700 mb-10">
                    <button onClick={() => setActiveTab('services')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'services' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                        My Portfolio
                        {activeTab === 'services' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-t-full"/>}
                    </button>
                    <button onClick={() => setActiveTab('requests')} className={`pb-4 text-sm font-bold uppercase tracking-wider transition-colors relative ${activeTab === 'requests' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}>
                        Incoming Requests
                        {pendingRequests.length > 0 && <span className="ml-2 bg-blue-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm">{pendingRequests.length}</span>}
                        {activeTab === 'requests' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white rounded-t-full"/>}
                    </button>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black dark:border-white"></div>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {/* --- REQUESTS TAB --- */}
                        {activeTab === 'requests' && (
                            <motion.div 
                                key="requests"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                {/* --- Sub-Tab Navigation for Requests --- */}
                                <div className="flex items-center gap-6 mb-8 border-b border-gray-100 dark:border-gray-800 pb-1 overflow-x-auto">
                                    {[
                                        { id: 'pending', label: 'PENDING', count: pendingRequests.length },
                                        { id: 'active', label: 'ACTIVE', count: confirmedRequests.length },
                                        { id: 'completed', label: 'COMPLETED', count: completedRequests.length },
                                        { id: 'cancelled', label: 'CANCELLED', count: cancelledRequests.length }
                                    ].map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setRequestSubTab(tab.id as any)}
                                            className={`relative pb-3 text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${
                                                requestSubTab === tab.id 
                                                ? 'text-blue-600 dark:text-blue-400' 
                                                : 'text-gray-400 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-400'
                                            }`}
                                        >
                                            {tab.label}
                                            {tab.count > 0 && (
                                                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                                                    requestSubTab === tab.id 
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' 
                                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                                                }`}>
                                                    {tab.count}
                                                </span>
                                            )}
                                            {requestSubTab === tab.id && (
                                                <motion.div 
                                                    layoutId="subtab-indicator" 
                                                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 dark:bg-blue-400 rounded-t-full"
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="space-y-4">
                                    {/* 1. PENDING VIEW */}
                                    {requestSubTab === 'pending' && (
                                        pendingRequests.length === 0 ? (
                                            <div className="py-12 text-center opacity-60">
                                                <AlertCircle className="mx-auto mb-3 text-gray-300" size={32} />
                                                <p className="text-gray-500 font-medium">No pending requests</p>
                                            </div>
                                        ) : (
                                            pendingRequests.map(b => <BookingCard key={b.id} booking={b} />)
                                        )
                                    )}

                                    {/* 2. ACTIVE VIEW */}
                                    {requestSubTab === 'active' && (
                                        confirmedRequests.length === 0 ? (
                                            <div className="py-12 text-center opacity-60">
                                                <CheckCircle className="mx-auto mb-3 text-gray-300" size={32} />
                                                <p className="text-gray-500 font-medium">No active jobs</p>
                                            </div>
                                        ) : (
                                            confirmedRequests.map(b => <BookingCard key={b.id} booking={b} />)
                                        )
                                    )}

                                    {/* 3. COMPLETED VIEW */}
                                    {requestSubTab === 'completed' && (
                                        completedRequests.length === 0 ? (
                                            <div className="py-12 text-center opacity-60">
                                                <History className="mx-auto mb-3 text-gray-300" size={32} />
                                                <p className="text-gray-500 font-medium">No completed jobs yet</p>
                                            </div>
                                        ) : (
                                            completedRequests.map(b => <BookingCard key={b.id} booking={b} />)
                                        )
                                    )}

                                    {/* 4. CANCELLED VIEW */}
                                    {requestSubTab === 'cancelled' && (
                                        cancelledRequests.length === 0 ? (
                                            <div className="py-12 text-center opacity-60">
                                                <Ban className="mx-auto mb-3 text-gray-300" size={32} />
                                                <p className="text-gray-500 font-medium">No cancelled requests</p>
                                            </div>
                                        ) : (
                                            cancelledRequests.map(b => <BookingCard key={b.id} booking={b} />)
                                        )
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {/* --- SERVICES TAB --- */}
                        {activeTab === 'services' && (
                            <motion.div 
                                key="services"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                            >
                                {myServices.map((service, index) => (
                                    <motion.div 
                                        key={service.id} 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="group bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-500"
                                    >
                                        <div className="aspect-[4/3] w-full overflow-hidden relative bg-gray-100 dark:bg-gray-700">
                                            <ServiceThumbnail src={service.imageUrl} category={service.category} />
                                            <div className="absolute top-4 left-4 flex gap-2">
                                                <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-900 dark:text-white shadow-sm uppercase tracking-wider">{service.category}</div>
                                            </div>
                                            <div className="absolute bottom-4 right-4">
                                                <div className="bg-black/80 dark:bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold shadow-lg">
                                                    ${service.hourlyRate}<span className="text-xs font-normal text-white/70">/hr</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-6">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-2 line-clamp-1">{service.title}</h3>
                                            <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-6 h-10 leading-relaxed">{service.description}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700">
                                                <div className="flex gap-2">
                                                    <button onClick={() => openEditModal(service)} className="p-2 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"><Edit size={18} /></button>
                                                    <button onClick={() => confirmDelete(service.id)} className="p-2 rounded-full text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 size={18} /></button>
                                                </div>
                                                <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md">ACTIVE</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                <motion.button 
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    onClick={() => navigate('/create-service')} 
                                    className="min-h-[400px] h-full rounded-[2rem] border-2 border-dashed border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/5 dark:hover:bg-blue-900/10 transition duration-300 gap-4 group cursor-pointer"
                                >
                                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition duration-300">
                                        <Plus size={32} />
                                    </div>
                                    <span className="font-bold text-lg">Create New Service</span>
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </main>

            <Modal isOpen={isDeleteModalOpen} title="Delete Service" onClose={() => setIsDeleteModalOpen(false)}>
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32}/></div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">This action cannot be undone. This service will be permanently removed from your portfolio.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition">Cancel</button>
                        <button onClick={executeDelete} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-200 dark:shadow-none">Delete Service</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={isEditModalOpen} title="Edit Service" onClose={() => setIsEditModalOpen(false)}>
                {editingService && (
                    <form onSubmit={handleEditSubmit} className="flex flex-col">
                        
                        {/* 1. Full Width Image Header */}
                        <div className="relative w-full h-48 bg-gray-100 dark:bg-gray-700 group cursor-pointer overflow-hidden">
                             {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover group-hover:scale-105 transition duration-700"/> : <div className="flex flex-col items-center justify-center h-full text-gray-400"><ImageIcon size={40}/><span className="text-xs mt-2 font-medium">No image uploaded</span></div>}
                             
                             {/* Gradient Overlay */}
                             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>

                             {/* Change Photo Button - Centered */}
                             <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer">
                                <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white px-5 py-2.5 rounded-full font-bold flex items-center gap-2 hover:bg-white/30 transition shadow-lg">
                                    <Camera size={18} />
                                    <span>Change Photo</span>
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                             </label>
                        </div>

                        {/* 2. Content Area */}
                        <div className="p-8 space-y-6">
                            
                            {/* Title Field */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 ml-1">Service Title</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Type size={18} className="text-gray-400" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={editingService.title} 
                                        onChange={e => setEditingService({...editingService, title: e.target.value})} 
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 dark:focus:border-blue-500 rounded-2xl font-bold text-lg outline-none transition-all placeholder:font-normal" 
                                        placeholder="e.g. Lawn Mowing"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* Category Field */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 ml-1">Category</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Tag size={16} className="text-gray-400" />
                                        </div>
                                        <select 
                                            value={editingService.category} 
                                            onChange={e => setEditingService({...editingService, category: e.target.value})} 
                                            className="w-full pl-10 pr-8 py-3 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 rounded-xl font-medium outline-none transition appearance-none cursor-pointer"
                                        >
                                            {CATEGORIES.map(cat => (<option key={cat} value={cat}>{cat}</option>))}
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                            <ChevronRight size={14} className="text-gray-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Rate Field */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 ml-1">Rate ($/hr)</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <DollarSign size={16} className="text-gray-400" />
                                        </div>
                                        <input 
                                            type="number" 
                                            value={editingService.hourlyRate || ''} 
                                            onChange={e => setEditingService({...editingService, hourlyRate: parseFloat(e.target.value) || 0})} 
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 rounded-xl font-medium outline-none transition" 
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Description Field */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2 ml-1">Description</label>
                                <div className="relative">
                                    <div className="absolute top-4 left-4 pointer-events-none">
                                        <FileText size={18} className="text-gray-400" />
                                    </div>
                                    <textarea 
                                        value={editingService.description} 
                                        onChange={e => setEditingService({...editingService, description: e.target.value})} 
                                        className="w-full pl-11 pr-4 py-3.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white border border-gray-100 dark:border-gray-600 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 rounded-2xl font-medium outline-none h-32 resize-none transition leading-relaxed" 
                                        placeholder="Describe your service..."
                                        required
                                    />
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="pt-2 flex gap-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-6 py-3.5 text-gray-500 dark:text-gray-400 font-bold hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-xl transition">Cancel</button>
                                <button type="submit" className="flex-1 py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 dark:shadow-none flex items-center justify-center gap-2">
                                    <CheckCircle size={18} />
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </Modal>

            {activeChatId && <ChatWindow bookingId={activeChatId} onClose={() => setActiveChatId(null)} />}
            {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
}