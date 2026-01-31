import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../api/client';
import { toast } from 'react-hot-toast';
import Logo from '../components/Logo';
import { 
    User, Lock, MapPin, Save, ArrowLeft, Shield, 
    Moon, Sun, Trash2, AlertTriangle, BadgeCheck, 
    CheckCircle2, XCircle, FileText, Eye, Info, Mail, Clock
} from 'lucide-react';
import type { User as UserType } from '../types';

export default function SettingsPage() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserType | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploadingId, setUploadingId] = useState(false);
    
    const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security' | 'location' | 'verification' | 'privacy' | 'terms' | 'about' | 'contact'>('profile');
    
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        phoneNumber: '',
        address: '',
        profileImageUrl: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) { navigate('/login'); return; }

            try {
                const res = await axios.get(`${API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userData = res.data;
                setUser(userData);
                setFormData({
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    bio: userData.bio || '',
                    phoneNumber: userData.phoneNumber || '',
                    address: userData.address || '',
                    profileImageUrl: userData.profileImageUrl || ''
                });
            } catch (error) {
                navigate('/login');
            }
        };

        fetchData();

        if (document.documentElement.classList.contains('dark')) {
            setIsDarkMode(true);
        }
    }, [navigate]);

    const toggleDarkMode = () => {
        if (isDarkMode) {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const payload = new FormData();
            payload.append('firstName', formData.firstName);
            payload.append('lastName', formData.lastName);
            payload.append('bio', formData.bio);
            payload.append('address', formData.address);
            payload.append('phoneNumber', formData.phoneNumber);
            
            await axios.put(`${API_URL}/auth/profile`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            toast.success("Profile updated successfully!");
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser as UserType);
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${API_URL}/auth/change-password`, passwordData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Password changed! Please login again.");
            setTimeout(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }, 1500);
        } catch (error: any) {
            const msg = error.response?.data?.[0]?.description || "Failed to change password. Check your current password.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleDeactivateConfirm = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_URL}/auth/deactivate`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Account deactivated.");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        } catch (error) {
            toast.error("Failed to deactivate account.");
            setShowDeleteModal(false);
        }
    };

    // --- ID Upload Logic ---
    const handleIdUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        setUploadingId(true);
        const uploadData = new FormData();
        uploadData.append('idImage', file);

        try {
            const token = localStorage.getItem('token');
            // This endpoint must update IsVerificationPending = true on the backend
            await axios.post(`${API_URL}/auth/verify-id`, uploadData, {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            toast.success("ID submitted! Verification is pending approval.", {
                duration: 5000,
                icon: '🕒'
            });

            // Update local user state immediately so UI updates
            if (user) {
                setUser({ ...user, isVerificationPending: true });
            }

        } catch (error) {
            toast.error("Failed to upload ID. Please try again.");
        } finally {
            setUploadingId(false);
            e.target.value = '';
        }
    };

    if (!user) return null;

    // --- Status Logic ---
    const isVerified = user.isVerifiedNeighbor;
    const isPending = !isVerified && user.isVerificationPending;
    
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <h1 className="text-xl font-bold text-gray-800 dark:text-white">Account Center</h1>
                    </div>
                    <Logo className="h-8 w-8 opacity-50" />
                </div>
            </nav>

            <main className="max-w-5xl mx-auto p-6 mt-4 relative">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col md:flex-row min-h-[600px] transition-colors duration-300">
                    
                    <aside className="w-full md:w-64 bg-gray-50 dark:bg-gray-800/50 border-r border-gray-100 dark:border-gray-700 p-4 overflow-y-auto max-h-[800px]">
                        <div className="flex flex-col gap-1">
                            <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</div>
                            <SidebarItem icon={User} label="Public Profile" id="profile" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarItem icon={BadgeCheck} label="Verification" id="verification" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarItem icon={Lock} label="Security" id="security" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarItem icon={MapPin} label="Location" id="location" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarItem icon={Moon} label="Appearance" id="appearance" activeTab={activeTab} setActiveTab={setActiveTab} />
                            
                            <div className="px-4 py-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Legal & Support</div>
                            <SidebarItem icon={Eye} label="Privacy Policy" id="privacy" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarItem icon={FileText} label="Terms of Use" id="terms" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarItem icon={Info} label="About Nexly" id="about" activeTab={activeTab} setActiveTab={setActiveTab} />
                            <SidebarItem icon={Mail} label="Contact Us" id="contact" activeTab={activeTab} setActiveTab={setActiveTab} />
                        </div>
                    </aside>

                    <div className="flex-1 p-8 text-gray-800 dark:text-gray-200 overflow-y-auto max-h-[800px]">
                        
                        {activeTab === 'profile' && (
                            <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Public Profile</h2>
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900 border-4 border-white dark:border-gray-700 shadow-md overflow-hidden">
                                            {user.profileImageUrl ? (
                                                <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-blue-500 font-bold text-3xl">
                                                    {formData.firstName ? formData.firstName.charAt(0) : 'U'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange} />
                                    <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange} />
                                </div>
                                <Input label="Bio" name="bio" value={formData.bio} onChange={handleInputChange} isTextArea />
                                <div className="pt-4"><SaveButton loading={loading} /></div>
                            </form>
                        )}

                        {activeTab === 'verification' && (
                           <div className="space-y-6 animate-fadeIn">
                               <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Verification & Trust</h2>
                               
                               {/* --- UPDATED BANNER --- */}
                               <div className={`p-6 rounded-xl border flex items-center justify-between transition-colors duration-300
                                   ${isVerified 
                                       ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                                       : isPending
                                           ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
                                           : 'bg-gray-50 border-gray-200 dark:bg-gray-700/50 dark:border-gray-600'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full 
                                            ${isVerified ? 'bg-green-100 text-green-600' : isPending ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-500'}`}>
                                            {isVerified ? <BadgeCheck size={32} /> : isPending ? <Clock size={32} /> : <BadgeCheck size={32} />}
                                        </div>
                                        <div>
                                            <h3 className={`font-bold text-lg 
                                                ${isVerified ? 'text-green-800 dark:text-green-400' : isPending ? 'text-yellow-800 dark:text-yellow-400' : 'text-gray-800 dark:text-gray-200'}`}>
                                                {isVerified ? 'Verified Neighbor' : isPending ? 'Verification Pending' : 'Not Verified'}
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {isVerified ? 'Your identity has been confirmed.' : isPending ? 'We are reviewing your ID. This usually takes 24 hours.' : 'Verify your account to build trust.'}
                                            </p>
                                        </div>
                                    </div>
                               </div>

                               <h3 className="text-lg font-bold text-gray-800 dark:text-white mt-8 mb-4">Verification Steps</h3>
                               <div className="grid gap-4">
                                   <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                                       <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400"><User size={20} /></div>
                                            <div><p className="font-semibold text-gray-800 dark:text-gray-200">Email Confirmed</p><p className="text-xs text-gray-500">{user.email}</p></div>
                                       </div>
                                       <CheckCircle2 className="text-green-500" size={24} />
                                   </div>
                                   <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                                       <div className="flex items-center gap-3">
                                            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-purple-600 dark:text-purple-400"><FileText size={20} /></div>
                                            <div><p className="font-semibold text-gray-800 dark:text-gray-200">Phone Verified</p><p className="text-xs text-gray-500">{user.phoneNumber || 'Not added'}</p></div>
                                       </div>
                                       {user.phoneNumber ? <CheckCircle2 className="text-green-500" size={24} /> : <XCircle className="text-gray-300" size={24} />}
                                   </div>
                                   
                                   <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg">
                                       <div className="flex items-center gap-3">
                                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400"><Shield size={20} /></div>
                                            <div><p className="font-semibold text-gray-800 dark:text-gray-200">Government ID</p><p className="text-xs text-gray-500">Required for badge</p></div>
                                       </div>
                                       {isVerified ? (
                                           <CheckCircle2 className="text-green-500" size={24} />
                                       ) : isPending ? (
                                            <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium flex items-center gap-1">
                                                <Clock size={16} /> In Review
                                            </span>
                                       ) : (
                                           <div>
                                               <input 
                                                   type="file" 
                                                   id="id-upload" 
                                                   accept="image/*"
                                                   className="hidden"
                                                   onChange={handleIdUpload}
                                                   disabled={uploadingId}
                                               />
                                               <label 
                                                   htmlFor="id-upload" 
                                                   className={`text-sm font-medium ${uploadingId ? 'text-gray-400' : 'text-blue-600 hover:text-blue-700 cursor-pointer'}`}
                                               >
                                                   {uploadingId ? 'Uploading...' : 'Upload'}
                                               </label>
                                           </div>
                                       )}
                                   </div>
                               </div>
                           </div>
                       )}

                        {activeTab === 'security' && (
                            <form onSubmit={handleChangePassword} className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Security & Login</h2>
                                <Input label="Current Password" type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} />
                                <Input label="New Password" type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} />
                                <div className="pt-2"><SaveButton loading={loading} text="Change Password" /></div>
                                <div className="pt-6 border-t border-gray-100 dark:border-gray-700 mt-6">
                                    <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-900/50">
                                        <div className="flex gap-3">
                                            <AlertTriangle className="text-red-600" size={20} />
                                            <div>
                                                <h4 className="font-semibold text-red-800 dark:text-red-400 text-sm">Delete Account</h4>
                                                <p className="text-red-600 dark:text-red-300 text-xs mt-1">Permanently remove your data.</p>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setShowDeleteModal(true)} className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium underline flex items-center gap-1"><Trash2 size={14} /> Deactivate</button>
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'location' && (
                            <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Location Settings</h2>
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex gap-3 mb-6">
                                    <Shield className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
                                    <p className="text-sm text-blue-800 dark:text-blue-300">Your exact address is only shared with neighbors after a booking is confirmed.</p>
                                </div>
                                <Input label="Home Address" name="address" value={formData.address} onChange={handleInputChange} />
                                <div className="pt-4"><SaveButton loading={loading} /></div>
                            </form>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6 animate-fadeIn">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Appearance</h2>
                                <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl border border-gray-100 dark:border-gray-600 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${isDarkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-orange-100 text-orange-500'}`}>{isDarkMode ? <Moon size={24} /> : <Sun size={24} />}</div>
                                        <div><h3 className="font-semibold text-lg dark:text-white">{isDarkMode ? 'Dark Mode' : 'Light Mode'}</h3><p className="text-sm text-gray-500 dark:text-gray-400">Adjust the interface brightness.</p></div>
                                    </div>
                                    <button onClick={toggleDarkMode} className={`w-14 h-8 flex items-center rounded-full p-1 transition-colors duration-300 ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                        <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'privacy' && (
                            <div className="space-y-6 animate-fadeIn max-w-2xl">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Privacy Policy</h2>
                                <div className="prose dark:prose-invert">
                                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                                        At Nexly, we take your privacy seriously. This policy describes how we collect, use, and handle your data.
                                    </p>
                                    
                                    <h3 className="text-lg font-semibold mt-4 mb-2 dark:text-gray-200">1. Data Collection</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                        We collect information you provide directly to us, such as when you create an account, update your profile, or communicate with other users.
                                    </p>

                                    <h3 className="text-lg font-semibold mt-4 mb-2 dark:text-gray-200">2. How We Use Data</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                        We use your data to provide, maintain, and improve our services, match you with neighbors, and ensure safety within the community.
                                    </p>

                                    <h3 className="text-lg font-semibold mt-4 mb-2 dark:text-gray-200">3. Data Sharing</h3>
                                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                                        Your exact location is never shared publicly. It is only revealed to a neighbor once a service booking is confirmed.
                                    </p>
                                    
                                    <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Last updated: January 2026</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'terms' && (
                            <div className="space-y-6 animate-fadeIn max-w-2xl">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Terms of Use</h2>
                                <div className="space-y-4">
                                    <p className="text-gray-600 dark:text-gray-300">
                                        Welcome to Nexly. By accessing or using our platform, you agree to be bound by these Terms of Use.
                                    </p>
                                    
                                    <div className="space-y-3">
                                        <details className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer">
                                            <summary className="font-semibold text-gray-800 dark:text-gray-200 list-none flex justify-between items-center">
                                                <span>1. Community Guidelines</span>
                                                <span className="transition group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 pl-2 border-l-2 border-blue-500">
                                                Treat all neighbors with respect. Harassment, hate speech, and fraudulent activities are strictly prohibited and will result in an immediate ban.
                                            </p>
                                        </details>

                                        <details className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer">
                                            <summary className="font-semibold text-gray-800 dark:text-gray-200 list-none flex justify-between items-center">
                                                <span>2. Service Payments</span>
                                                <span className="transition group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 pl-2 border-l-2 border-blue-500">
                                                Payments for services are processed securely. Nexly takes a small commission to maintain the platform. Cancellations within 24 hours may incur a fee.
                                            </p>
                                        </details>

                                        <details className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer">
                                            <summary className="font-semibold text-gray-800 dark:text-gray-200 list-none flex justify-between items-center">
                                                <span>3. Liability</span>
                                                <span className="transition group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 pl-2 border-l-2 border-blue-500">
                                                Nexly connects neighbors but is not an employer of service providers. We are not liable for damages arising from services, though we provide a dispute resolution center.
                                            </p>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'about' && (
                            <div className="space-y-6 animate-fadeIn text-center py-8">
                                <div className="flex justify-center mb-6">
                                    <Logo className="h-24 w-24" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">Nexly</h2>
                                <p className="text-gray-500 dark:text-gray-400">Version 1.0.0 (Beta)</p>
                                
                                <div className="max-w-lg mx-auto mt-8 text-gray-600 dark:text-gray-300 leading-relaxed">
                                    <p>
                                        Nexly was built with a mission: <b>To bring neighborhoods back to life.</b>
                                    </p>
                                    <p className="mt-4">
                                        In a digital world, we often forget the people living right next door. 
                                        Nexly helps you find trusted help, offer your skills, and build a safer, 
                                        friendlier community.
                                    </p>
                                </div>

                                {/* --- Real Links --- */}
                                <div className="mt-12 flex justify-center gap-6">
                                    <Link to="/" className="text-gray-400 hover:text-blue-500 transition">Website</Link>
                                    <Link to="/blog" className="text-gray-400 hover:text-blue-500 transition">Blog</Link>
                                    <Link to="/careers" className="text-gray-400 hover:text-blue-500 transition">Careers</Link>
                                </div>
                            </div>
                        )}

                        {activeTab === 'contact' && (
                            <div className="space-y-6 animate-fadeIn max-w-2xl">
                                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Contact Us</h2>
                                <p className="text-gray-500 dark:text-gray-400 mb-8">Have a question or feedback? We'd love to hear from you.</p>

                                {/* --- Colors and Emails --- */}
                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">General Support</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">For account issues and questions.</p>
                                        <a href="mailto:nxlspprt@gmail.com" className="text-sm font-bold text-slate-700 dark:text-slate-300 underline">nxlspprt@gmail.com</a>
                                    </div>
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
                                        <h3 className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">Safety & Trust</h3>
                                        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Report suspicious activity.</p>
                                        <a href="mailto:nexlysafety@gmail.com" className="text-sm font-bold text-zinc-700 dark:text-zinc-300 underline">nexlysafety@gmail.com</a>
                                    </div>
                                </div>

                                {/* --- FAQ Section --- */}
                                <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <h3 className="font-semibold text-gray-800 dark:text-white text-lg mb-2">Frequently Asked Questions</h3>
                                    
                                    <div className="space-y-3">
                                        <details className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer">
                                            <summary className="font-medium text-gray-800 dark:text-gray-200 list-none flex justify-between items-center">
                                                <span>How do I get verified?</span>
                                                <span className="transition group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                                                Go to the <strong>Verification</strong> tab in your settings. Upload a valid government ID. Our team will review it and grant you the Verified Neighbor badge within 24-48 hours.
                                            </p>
                                        </details>

                                        <details className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer">
                                            <summary className="font-medium text-gray-800 dark:text-gray-200 list-none flex justify-between items-center">
                                                <span>Is Nexly free to use?</span>
                                                <span className="transition group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                                                Yes! You can join and browse services for free. We only charge a small service fee when you successfully book a paid service.
                                            </p>
                                        </details>

                                        <details className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer">
                                            <summary className="font-medium text-gray-800 dark:text-gray-200 list-none flex justify-between items-center">
                                                <span>How do I report a problem?</span>
                                                <span className="transition group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                                                For immediate safety concerns, contact local authorities. For platform issues, email our Safety Team at <strong>nexlysafety@gmail.com</strong>.
                                            </p>
                                        </details>
                                        
                                         <details className="group bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 cursor-pointer">
                                            <summary className="font-medium text-gray-800 dark:text-gray-200 list-none flex justify-between items-center">
                                                <span>Can I delete my account?</span>
                                                <span className="transition group-open:rotate-180">▼</span>
                                            </summary>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-3">
                                                Yes. Navigate to the <strong>Security</strong> tab and click "Deactivate" at the bottom of the page. This action is irreversible.
                                            </p>
                                        </details>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </main>

            {/* Delete Modal Omitted for brevity */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
                        <div className="p-6 text-center">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Delete Account?</h3>
                             <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                                Are you sure you want to deactivate your account?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setShowDeleteModal(false)} className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg">Cancel</button>
                                <button onClick={handleDeactivateConfirm} className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg">Yes, Deactivate</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Helpers
const SidebarItem = ({ icon: Icon, label, id, activeTab, setActiveTab }: any) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors w-full text-left
        ${activeTab === id 
            ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' 
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
    >
        <Icon size={18} /> {label}
    </button>
);

const Input = ({ label, isTextArea = false, ...props }: any) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        {isTextArea ? (
            <textarea className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" rows={4} {...props} />
        ) : (
            <input className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition" {...props} />
        )}
    </div>
);

const SaveButton = ({ loading, text = "Save Changes" }: { loading: boolean, text?: string }) => (
    <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-gray-900 dark:bg-blue-600 hover:bg-black dark:hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg w-full md:w-auto">
        {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Save size={18} /> {text}</>}
    </button>
);