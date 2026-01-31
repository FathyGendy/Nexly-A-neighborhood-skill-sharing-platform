import { useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { Service } from '../types'; 
import { X, Clock, Calendar, CheckCircle, AlertCircle, Coins, CreditCard, Repeat, ArrowRightLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 

interface BookingModalProps {
    service: Service;
    isOpen: boolean;
    onClose: () => void;
}

export default function BookingModal({ service, isOpen, onClose }: BookingModalProps) {
    const navigate = useNavigate(); 
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [duration, setDuration] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Payment States
    const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'SkillSwap'>('Cash');
    const [swapType, setSwapType] = useState<'Credits' | 'Barter'>('Credits');
    
    // Data States
    const [userCredits, setUserCredits] = useState(0);
    const [currentUserId, setCurrentUserId] = useState<string>(''); 
    const [myServices, setMyServices] = useState<Service[]>([]);
    const [selectedExchangeServiceId, setSelectedExchangeServiceId] = useState<number | ''>('');

    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Fetch User Data & Services on Open
    useEffect(() => {
        if(isOpen) {
            const token = localStorage.getItem('token');
            if (!token) {
                // Not logged in -> Redirect to login
                onClose();
                navigate('/login');
                return;
            }

            const fetchData = async () => {
                try {
                    // 1. Get User Balance from API (Fresh Data)
                    const userRes = await apiClient.get('/Auth/me');
                    setUserCredits(userRes.data.timeCredits || 0); 
                    setCurrentUserId(userRes.data.id);

                    // 2. Get My Services (For Barter)
                    const res = await apiClient.get('/Services/my-services'); 
                    setMyServices(res.data);
                } catch (err) {
                    console.error("Failed to load user data", err);
                    // If auth check fails here (401), the interceptor in client.ts will handle redirect
                }
            };
            fetchData();
        }
    }, [isOpen, navigate, onClose]); // Added dependencies

    if (!isOpen) return null;

    // Check for self-booking
    const isSelfBooking = currentUserId === service.providerId;

    const timeSlots = Array.from({ length: 24 }, (_, i) => {
        const hour = i.toString().padStart(2, '0');
        const timeValue = `${hour}:00`;
        const displayHour = i % 12 || 12; 
        const ampm = i >= 12 ? 'PM' : 'AM';
        return { value: timeValue, label: `${displayHour}:00 ${ampm}` };
    });

    const handleBooking = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setNotification(null);

        // Determine actual backend payment method string
        let finalMethod = 'Cash';
        let exchangeId = null;

        if (paymentMethod === 'SkillSwap') {
            finalMethod = swapType; // "Credits" or "Barter"
            if (swapType === 'Barter') {
                if(!selectedExchangeServiceId) {
                    setNotification({ type: 'error', text: 'Please select a service to swap.' });
                    setLoading(false);
                    return;
                }
                exchangeId = selectedExchangeServiceId;
            }
        }

        try {
            await apiClient.post('/Bookings', {
                serviceId: service.id,
                scheduledDate: date,
                startTime: time,
                durationHours: Number(duration),
                paymentMethod: finalMethod,
                exchangeServiceId: exchangeId
            });

            setNotification({ type: 'success', text: 'Request sent! Waiting for provider approval.' });
            setTimeout(() => { onClose(); setNotification(null); }, 2000);

        } catch (error: any) {
            setNotification({ 
                type: 'error', 
                text: error.response?.data?.message || 'Booking failed' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Costs
    const cashPrice = service.hourlyRate * duration;
    const creditPrice = Math.ceil(duration);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 flex justify-between items-center text-white">
                    <div>
                        <h3 className="font-bold text-xl">Confirm Booking</h3>
                        <p className="text-blue-100 text-xs mt-1">with {service.providerName}</p>
                    </div>
                    <button onClick={onClose} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    {/* Self Booking Check */}
                    {isSelfBooking ? (
                         <div className="text-center py-8">
                            <AlertCircle size={48} className="mx-auto text-gray-300 mb-3" />
                            <h4 className="text-lg font-bold text-gray-700">This is your service</h4>
                            <p className="text-gray-500 text-sm mt-1">You cannot book your own service.</p>
                            <button onClick={onClose} className="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleBooking}>
                            
                            {/* Notification */}
                            {notification && (
                                <div className={`mb-5 p-3 rounded-lg flex items-center gap-3 text-sm font-medium
                                    ${notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                    {notification.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
                                    {notification.text}
                                </div>
                            )}

                            {/* Payment Toggle */}
                            <label className="block text-sm font-bold text-gray-700 mb-2">How do you want to pay?</label>
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('Cash')}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                                        ${paymentMethod === 'Cash' 
                                            ? 'border-blue-600 bg-blue-50 text-blue-700' 
                                            : 'border-gray-200 hover:border-blue-300 text-gray-500'}`}
                                >
                                    <CreditCard size={20} />
                                    <span className="font-semibold text-sm">Cash</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('SkillSwap')}
                                    className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all
                                        ${paymentMethod === 'SkillSwap' 
                                            ? 'border-purple-600 bg-purple-50 text-purple-700' 
                                            : 'border-gray-200 hover:border-purple-300 text-gray-500'}`}
                                >
                                    <ArrowRightLeft size={20} />
                                    <span className="font-semibold text-sm">Skill Swap</span>
                                </button>
                            </div>

                            {/* Skill Swap Sub-Options */}
                            {paymentMethod === 'SkillSwap' && (
                                <div className="mb-6 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex gap-4 mb-4 border-b border-purple-200 pb-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="swapType" 
                                                checked={swapType === 'Credits'} 
                                                onChange={() => setSwapType('Credits')}
                                                className="text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="flex items-center gap-1 text-sm font-medium text-gray-700">
                                                <Coins size={14} className="text-yellow-600"/> Use Credits
                                            </span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name="swapType" 
                                                checked={swapType === 'Barter'} 
                                                onChange={() => setSwapType('Barter')}
                                                className="text-purple-600 focus:ring-purple-500"
                                            />
                                            <span className="text-sm font-medium text-gray-700">Offer a Service</span>
                                        </label>
                                    </div>

                                    {swapType === 'Credits' ? (
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-600">Your Balance:</span>
                                            <span className={`font-bold ${userCredits < creditPrice ? 'text-red-600' : 'text-green-600'}`}>
                                                {userCredits} Credits
                                            </span>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Select your service to swap</label>
                                            <select 
                                                className="w-full p-2 text-sm border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none bg-white"
                                                value={selectedExchangeServiceId}
                                                onChange={(e) => setSelectedExchangeServiceId(Number(e.target.value))}
                                            >
                                                <option value="">Select a service...</option>
                                                {myServices.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title}</option>
                                                ))}
                                            </select>
                                            {myServices.length === 0 && (
                                                <p className="text-xs text-red-500 mt-1">You have no services to offer.</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Date & Time Inputs */}
                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                        <input 
                                            type="date" 
                                            required
                                            min={new Date().toISOString().split('T')[0]} 
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                            <select
                                                required
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none bg-white"
                                            >
                                                <option value="" disabled>--:--</option>
                                                {timeSlots.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Hrs)</label>
                                        <input 
                                            type="number" 
                                            min="1" max="8"
                                            value={duration}
                                            onChange={(e) => setDuration(Number(e.target.value))}
                                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Submit */}
                            <div className="border-t pt-4">
                                <div className="flex justify-between items-end mb-4">
                                    <span className="text-gray-500 text-sm font-medium">Total:</span>
                                    {paymentMethod === 'Cash' ? (
                                        <span className="text-2xl font-bold text-gray-900">${cashPrice}</span>
                                    ) : swapType === 'Credits' ? (
                                        <span className="text-2xl font-bold text-purple-600">{creditPrice} Credits</span>
                                    ) : (
                                        <span className="text-lg font-bold text-purple-600 flex items-center gap-1">
                                            <Repeat size={18}/> Swap
                                        </span>
                                    )}
                                </div>

                                <button 
                                    type="submit"
                                    disabled={loading || (paymentMethod === 'SkillSwap' && swapType === 'Credits' && userCredits < creditPrice)}
                                    className={`w-full py-3 rounded-xl font-bold text-white transition shadow-lg
                                        ${loading || (paymentMethod === 'SkillSwap' && swapType === 'Credits' && userCredits < creditPrice)
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-200'}`}
                                >
                                    {loading ? 'Processing...' : 'Send Booking Request'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}