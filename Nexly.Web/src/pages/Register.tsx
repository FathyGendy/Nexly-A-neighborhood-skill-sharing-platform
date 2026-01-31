import { useState } from 'react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ArrowRight, MapPin, Phone, User, Mail, Lock } from 'lucide-react';
import Logo from '../components/Logo';

export default function Register() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        phoneNumber: '',
        address: 'Cairo, Egypt',
        bio: '',
        isServiceProvider: false
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckbox = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, isServiceProvider: e.target.checked }));
    };

    // --- Validation Logic ---

    const validatePhone = (phone: string) => {
        const egyptPhoneRegex = /^\+20\s?1[0125]\d{8}$/;
        return egyptPhoneRegex.test(phone);
    };

    const validateEmail = (email: string) => {
        // Standard email regex ensuring @ and .domain
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        // Min 8 chars, 1 uppercase, 1 number, 1 special char
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
        return passwordRegex.test(password);
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setNotification(null);

        // 1. Validate Email
        if (!validateEmail(formData.email)) {
            setNotification({ 
                type: 'error', 
                text: 'Please enter a valid email address (e.g., name@gmail.com).' 
            });
            setIsLoading(false);
            return;
        }

        // 2. Validate Phone Number
        if (!validatePhone(formData.phoneNumber)) {
            setNotification({ 
                type: 'error', 
                text: 'Please enter a valid number format: +20 1xxxxxxxxx' 
            });
            setIsLoading(false);
            return;
        }

        // 3. Validate Password
        if (!validatePassword(formData.password)) {
            setNotification({ 
                type: 'error', 
                text: 'Password must be 8+ chars, with an uppercase letter, number, and special character.' 
            });
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                // Ensure format is clean for backend
                phoneNumber: formData.phoneNumber.replace(/\s/g, ''), 
                latitude: 30.0444, 
                longitude: 31.2357
            };

            await apiClient.post('/Auth/register', payload);

            setIsSuccess(true);
            window.scrollTo(0, 0);

        } catch (err: any) {
            console.error(err);
            let errorMessage = 'Registration failed. Try again.';

            if (err.response?.data?.errors) {
                errorMessage = Object.values(err.response.data.errors).flat().join(' ');
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            }

            setNotification({ type: 'error', text: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    // Shared Right Side Image Component with Animation
    const SideImage = () => (
        <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-blue-600 relative overflow-hidden">
            <style>
                {`
                    @keyframes kenBurns {
                        0% { transform: scale(1) translate(0, 0); }
                        50% { transform: scale(1.1) translate(-2%, -1%); }
                        100% { transform: scale(1) translate(0, 0); }
                    }
                    .animate-ken-burns {
                        animation: kenBurns 20s ease-in-out infinite alternate;
                    }
                `}
            </style>
            
            <div 
                className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-multiply animate-ken-burns" 
                style={{ 
                    backgroundImage: "url('https://images.unsplash.com/photo-1558522195-e1201b090344?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80')" 
                }} 
            />
            
            <div className="relative z-10 p-12 text-center text-white backdrop-blur-sm bg-white/5 rounded-3xl border border-white/10 shadow-2xl mx-12">
                <h2 className="text-4xl font-bold mb-4 drop-shadow-md">Join Your Neighbors</h2>
                <p className="text-lg text-blue-50 max-w-md mx-auto drop-shadow-sm">
                    Connect, share skills, and build a stronger community with Nexly.
                </p>
            </div>

            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500 rounded-full opacity-30 blur-3xl animate-pulse"></div>
            <div className="absolute top-12 right-12 w-32 h-32 bg-purple-500 rounded-full opacity-30 blur-2xl animate-pulse delay-700"></div>
        </div>
    );

    // ------------------------------------------------------------------
    // Success View
    // ------------------------------------------------------------------
    if (isSuccess) {
        return (
            <div className="min-h-screen flex bg-white">
                <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-12 animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="w-full max-w-md text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-up">
                            <CheckCircle className="text-green-600" size={40} />
                        </div>
                        
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Aboard!</h2>
                        <p className="text-gray-500 mb-8">Your account was created successfully.</p>

                        <button 
                            onClick={() => navigate('/login')}
                            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl transition duration-200 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group"
                        >
                            Sign In Now
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
                <SideImage />
            </div>
        );
    }

    // ------------------------------------------------------------------
    // Registration Form View
    // ------------------------------------------------------------------
    return (
        <div className="min-h-screen flex bg-white">
            {/* Left Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12 overflow-y-auto max-h-screen">
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-8">
                        <Logo className="h-10 w-auto mb-6" />
                        <h1 className="text-3xl font-bold text-gray-900">Create an account</h1>
                        <p className="text-gray-500 mt-2">Start connecting with your community today.</p>
                    </div>

                    {notification && (
                        <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2 
                            ${notification.type === 'error' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                            
                            <AlertCircle className={`mt-0.5 flex-shrink-0 ${notification.type === 'error' ? 'text-red-500' : 'text-green-500'}`} size={20} />
                            <p className={`text-sm font-medium ${notification.type === 'error' ? 'text-red-800' : 'text-green-800'}`}>
                                {notification.text}
                            </p>
                        </div>
                    )}

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">First Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input 
                                        name="firstName" 
                                        required 
                                        onChange={handleChange} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-800 placeholder-gray-400" 
                                        placeholder="Fathy" 
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Last Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 text-gray-400" size={18} />
                                    <input 
                                        name="lastName" 
                                        required 
                                        onChange={handleChange} 
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-800 placeholder-gray-400" 
                                        placeholder="Ayman" 
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    name="email" 
                                    type="email" 
                                    required 
                                    onChange={handleChange} 
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 transition-all outline-none text-gray-800 placeholder-gray-400
                                         ${notification?.text.includes('valid email') 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                            : 'border-gray-200 focus:border-primary focus:ring-primary/20'}`}
                                    placeholder="fathy@example.com" 
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    name="phoneNumber" 
                                    type="tel" 
                                    required 
                                    onChange={handleChange} 
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 transition-all outline-none text-gray-800 placeholder-gray-400 
                                        ${notification?.text.includes('valid number') 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                            : 'border-gray-200 focus:border-primary focus:ring-primary/20'}`}
                                    placeholder="+20 1012378911" 
                                />
                            </div>
                            <p className="text-xs text-gray-400 ml-1">Format: +20 1xxxxxxxxx</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    name="password" 
                                    type="password" 
                                    required 
                                    onChange={handleChange} 
                                    className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg focus:bg-white focus:ring-2 transition-all outline-none text-gray-800 placeholder-gray-400
                                         ${notification?.text.includes('Password must be') 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                                            : 'border-gray-200 focus:border-primary focus:ring-primary/20'}`}
                                    placeholder="••••••••" 
                                />
                            </div>
                            <p className="text-xs text-gray-400 ml-1">8+ chars, Uppercase, Number & Symbol</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Address</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    name="address" 
                                    required 
                                    value={formData.address} 
                                    onChange={handleChange} 
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-800 placeholder-gray-400" 
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                                <input 
                                    type="checkbox" 
                                    id="providerCheck"
                                    name="isServiceProvider"
                                    checked={formData.isServiceProvider}
                                    onChange={handleCheckbox}
                                    className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-900">Become a Provider</span>
                                    <span className="text-xs text-gray-500">I want to offer my services to neighbors</span>
                                </div>
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5
                                ${isLoading 
                                    ? 'bg-gray-400 cursor-not-allowed shadow-none' 
                                    : 'bg-primary hover:bg-blue-700 shadow-blue-500/30'}`}
                        >
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <span 
                            onClick={() => navigate('/login')} 
                            className="text-primary font-bold cursor-pointer hover:underline"
                        >
                            Log in
                        </span>
                    </p>
                </div>
            </div>

            {/* Right Side: Moving Image */}
            <SideImage />
        </div>
    );
}