import { useState } from 'react';
import { apiClient } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, X, CheckCircle, AlertCircle } from 'lucide-react';
import Logo from '../components/Logo';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // --- Forgot Password States ---
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetStatus, setResetStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    // ------------------------------

    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.post('/Auth/login', {
                email,
                password
            });

            // Save the token and user info (which now includes the SLUG)
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            window.dispatchEvent(new Event('auth-change')); 
            
            // Go to dashboard immediately
            navigate('/dashboard'); 
        } catch (err: any) {
            console.error(err);
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Forgot Password Logic ---
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setResetStatus('sending');

        try {
            // TODO: Replace this with an actual API call
            // await apiClient.post('/Auth/forgot-password', { email: resetEmail });
            
            // Simulating API delay for UI demonstration
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setResetStatus('success');
        } catch (error) {
            setResetStatus('error');
        }
    };

    const closeForgotModal = () => {
        setShowForgotModal(false);
        setResetStatus('idle');
        setResetEmail('');
    };
    // -----------------------------

    return (
        <div className="min-h-screen flex bg-white relative">
            
            {/* --- Forgot Password Modal --- */}
            {showForgotModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative animate-scale-up">
                        <button 
                            onClick={closeForgotModal}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Reset Password</h3>
                            <p className="text-gray-500 text-sm mt-2">
                                Enter your email and we'll send you instructions to reset your password.
                            </p>
                        </div>

                        {resetStatus === 'success' ? (
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="text-green-600" size={32} />
                                </div>
                                <h4 className="text-lg font-bold text-gray-900">Check your inbox</h4>
                                <p className="text-gray-600 mt-2 mb-6">
                                    If an account exists for <strong>{resetEmail}</strong>, we have sent a password reset link.
                                </p>
                                <button 
                                    onClick={closeForgotModal}
                                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition duration-200"
                                >
                                    Back to Login
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleResetPassword} className="space-y-4">
                                {resetStatus === 'error' && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
                                        <AlertCircle size={16} />
                                        Something went wrong. Please try again.
                                    </div>
                                )}
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                        <input 
                                            type="email" 
                                            required
                                            value={resetEmail}
                                            onChange={(e) => setResetEmail(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                                            placeholder="Enter your registered email"
                                        />
                                    </div>
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={resetStatus === 'sending'}
                                    className={`w-full py-3 rounded-xl font-bold text-white transition-all 
                                        ${resetStatus === 'sending' 
                                            ? 'bg-gray-400 cursor-not-allowed' 
                                            : 'bg-primary hover:bg-blue-700 shadow-lg shadow-blue-500/30'}`}
                                >
                                    {resetStatus === 'sending' ? 'Sending Link...' : 'Send Reset Link'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
            {/* ----------------------------- */}

            {/* Left Side: Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-12">
                <div className="max-w-md w-full mx-auto">
                    <div className="mb-8">
                        <Logo className="h-10 w-auto mb-6" />
                        <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
                        <p className="text-gray-500 mt-2">Please enter your details to sign in.</p>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center">
                            <span className="font-medium mr-2">Error:</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-gray-700">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-800 placeholder-gray-400"
                                    placeholder="you@example.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-semibold text-gray-700">Password</label>
                                <button 
                                    type="button"
                                    onClick={() => setShowForgotModal(true)}
                                    className="text-xs font-semibold text-primary hover:text-blue-700 transition-colors focus:outline-none"
                                >
                                    Forgot Password?
                                </button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none text-gray-800 placeholder-gray-400"
                                    placeholder="••••••••"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 flex justify-center items-center gap-2
                                ${isLoading ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-primary hover:bg-blue-700 shadow-blue-500/30'}`}
                        >
                            {isLoading ? 'Signing In...' : 'Sign In'}
                            {!isLoading && <ArrowRight size={20} />}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-600">
                        Don't have an account? 
                        <span 
                            onClick={() => navigate('/register')} 
                            className="text-primary cursor-pointer font-bold hover:underline ml-1"
                        >
                            Register for free
                        </span>
                    </p>
                </div>
            </div>

            {/* Right Side: Moving Image */}
            <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gray-900 relative overflow-hidden">
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
                    className="absolute inset-0 bg-cover bg-center opacity-50 animate-ken-burns" 
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&q=80')" }} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
                
                <div className="relative z-10 p-12 text-white max-w-lg">
                    <h2 className="text-5xl font-bold mb-6 leading-tight">Welcome to Nexly</h2>
                    <p className="text-xl text-gray-300 mb-8">
                        The easiest way to find trusted help in your neighborhood. Secure, fast, and reliable.
                    </p>
                    
                    <div className="flex gap-4">
                        <div className="flex -space-x-3">
                            {[1,2,3,4].map((i) => (
                                <div key={i} className="w-10 h-10 rounded-full border-2 border-gray-900 bg-gray-700 flex items-center justify-center text-xs overflow-hidden">
                                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-gray-400 flex items-center">
                            Join 2,000+ neighbors today
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}