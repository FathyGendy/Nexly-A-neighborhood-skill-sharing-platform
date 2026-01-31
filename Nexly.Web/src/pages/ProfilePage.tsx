import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile } from '../api/client';
import type { User, Review } from '../types';
import Logo from '../components/Logo';
import ImageCropper from '../components/ImageCropper';
import { 
    MapPin, Calendar, ShieldCheck, Edit2, Star, User as UserIcon, Camera, Phone, Mail, Clock, X, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    // --- Slug instead of id from URL ---
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    
    const [profile, setProfile] = useState<User | null>(null);
    const [services, setServices] = useState<any[]>([]); 
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [showAllReviews, setShowAllReviews] = useState(false);

    const profileImageInputRef = useRef<HTMLInputElement>(null);

    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        bio: '',
        address: '',
        phoneNumber: '',
    });
    
    const [cropperOpen, setCropperOpen] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);

    const [selectedProfileImage, setSelectedProfileImage] = useState<Blob | null>(null);
    const [previewProfileImage, setPreviewProfileImage] = useState<string | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) setCurrentUser(JSON.parse(userStr));
        fetchProfile();
    }, [slug]); // Depend on slug now

    const fetchProfile = async () => {
        if (!slug) return;
        setLoading(true);
        try {
            // 1. Fetch User Details using Slug (Backend handles Slug -> User logic)
            const data = await getUserProfile(slug);
            setProfile(data);

            // 2. Fetch Active Services Separately using the REAL ID from the fetched profile
            // (Services endpoint likely still expects GUID)
            try {
                const servicesRes = await fetch(`/api/Services/provider/${data.id}`);
                if (servicesRes.ok) {
                    const servicesData = await servicesRes.json();
                    setServices(servicesData);
                } else {
                    setServices(data.services || []);
                }
            } catch (err) {
                console.error("Failed to fetch fresh services", err);
                setServices(data.services || []);
            }

            setEditForm({
                firstName: data.firstName,
                lastName: data.lastName,
                bio: data.bio || '',
                address: data.address,
                phoneNumber: data.phoneNumber || ''
            });
        } catch (error) {
            toast.error("Failed to load profile");
            navigate('/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                setTempImageSrc(reader.result?.toString() || null);
                setCropperOpen(true);
                e.target.value = '';
            });
            reader.readAsDataURL(file);
        }
    };

    const onCropComplete = (croppedBlob: Blob) => {
        const previewUrl = URL.createObjectURL(croppedBlob);
        setSelectedProfileImage(croppedBlob);
        setPreviewProfileImage(previewUrl);
        setCropperOpen(false);
        setTempImageSrc(null);
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            formData.append('firstName', editForm.firstName);
            formData.append('lastName', editForm.lastName);
            formData.append('bio', editForm.bio);
            formData.append('address', editForm.address);
            formData.append('phoneNumber', editForm.phoneNumber);
            
            if (selectedProfileImage) {
                formData.append('profileImage', selectedProfileImage);
            }

            const updatedUser = await updateUserProfile(formData);
            
            setProfile(prev => ({ ...prev!, ...updatedUser }));
            setIsEditing(false);
            
            setSelectedProfileImage(null);
            
            // Note: We use profile.id for comparison here
            if (currentUser?.id === profile?.id) {
                localStorage.setItem('user', JSON.stringify({ ...currentUser, ...updatedUser }));
                setCurrentUser({ ...currentUser, ...updatedUser });
            }
            toast.success("Profile updated successfully!");
        } catch (error) {
            console.error(error);
            toast.error("Failed to update profile");
        }
    };

    if (loading) return <div className="flex h-screen justify-center items-center bg-gray-50 dark:bg-gray-900"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div></div>;
    if (!profile) return null;

    const isOwnProfile = currentUser?.id === profile.id;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 pb-12">
             <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700 px-6 py-4 sticky top-0 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Mobile Back Button */}
                        <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition md:hidden">
                            <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
                        </button>
                        <Logo />
                    </div>
                    <button onClick={() => navigate('/dashboard')} className="hidden md:block text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
                        Back to Dashboard
                    </button>
                </div>
            </nav>

            {/* Cropper Modal (Only for Profile Picture) */}
            {cropperOpen && tempImageSrc && (
                <ImageCropper 
                    imageSrc={tempImageSrc}
                    aspectRatio={1} // Always square for profile pics
                    onCancel={() => setCropperOpen(false)}
                    onCropComplete={onCropComplete}
                />
            )}

            {/* All Reviews Modal */}
            {showAllReviews && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in duration-200 border border-gray-200 dark:border-gray-700">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-xl text-gray-800 dark:text-white">All Reviews ({profile.reviews?.length || 0})</h3>
                            <button onClick={() => setShowAllReviews(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-6 bg-white dark:bg-gray-800">
                            {profile.reviews?.map(review => (
                                <ReviewItem key={review.id} review={review} />
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto mt-6 px-4">
                
                {/* 1. Header Area */}
                <div className="relative w-full h-48 md:h-64 rounded-t-3xl overflow-hidden shadow-sm group bg-gray-50 dark:bg-gray-900 border-x border-t border-gray-200 dark:border-gray-700">
                     <div className="absolute inset-0 bg-slate-100 dark:bg-gray-900"></div>
                     <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-200/40 via-purple-200/40 to-indigo-200/40 dark:from-blue-900/30 dark:via-purple-900/30 dark:to-indigo-900/30 blur-3xl opacity-80"></div>
                     <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-300/30 dark:bg-blue-600/20 rounded-full blur-[80px]"></div>
                     <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-300/30 dark:bg-indigo-600/20 rounded-full blur-[80px]"></div>
                     <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-32 bg-white/40 dark:bg-white/5 blur-[60px] rotate-12"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="bg-white/70 dark:bg-gray-900/60 backdrop-blur-md border border-white/50 dark:border-white/10 px-8 py-3 rounded-full shadow-xl flex items-center gap-3 transform transition hover:scale-105 duration-500">
                            <Logo className="w-10 h-10 text-[#2563EB]" /> 
                            <span className="text-3xl font-bold text-[#2563EB] tracking-tight" style={{ fontFamily: 'sans-serif' }}>
                            </span>
                         </div>
                     </div>
                </div>

                {/* 2. Main Profile Content */}
                <div className="bg-white dark:bg-gray-800 rounded-b-3xl shadow-lg px-8 pb-8 mb-8 relative z-20 border border-t-0 border-gray-200 dark:border-gray-700 transition-colors duration-300">
                    
                    <div className="flex flex-col md:flex-row justify-between items-start">
                        
                        <div className="-mt-12 md:-mt-20 relative group">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[6px] border-white dark:border-gray-800 bg-white dark:bg-gray-800 overflow-hidden shadow-md relative transition-colors duration-300">
                                {(previewProfileImage || profile.profileImageUrl) ? (
                                    <img 
                                        src={previewProfileImage || profile.profileImageUrl} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400">
                                        <UserIcon size={64} />
                                    </div>
                                )}

                                {isOwnProfile && isEditing && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <button 
                                            onClick={() => profileImageInputRef.current?.click()}
                                            className="text-white hover:text-blue-200 transition transform hover:scale-110"
                                        >
                                            <Camera size={32} />
                                        </button>
                                        <input 
                                            type="file" 
                                            hidden 
                                            ref={profileImageInputRef}
                                            accept="image/*"
                                            onChange={(e) => onSelectFile(e)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-4 md:mt-6 flex gap-3">
                            {isOwnProfile && !isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl font-semibold transition"
                                >
                                    <Edit2 size={18}/> Edit Profile
                                </button>
                            )}
                            {isEditing && (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => {
                                            setIsEditing(false);
                                            setPreviewProfileImage(null);
                                        }} 
                                        className="px-5 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleSave} 
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold shadow-lg shadow-blue-200/50 transition"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4">
                        {isEditing ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 dark:bg-gray-700/30 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-4 duration-300">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.firstName}
                                            onChange={e => setEditForm({...editForm, firstName: e.target.value})}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                                        <input 
                                            type="text" 
                                            value={editForm.lastName}
                                            onChange={e => setEditForm({...editForm, lastName: e.target.value})}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                        <input 
                                            type="text" 
                                            value={editForm.phoneNumber}
                                            onChange={e => setEditForm({...editForm, phoneNumber: e.target.value})}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                        <input 
                                            type="text" 
                                            value={editForm.address}
                                            onChange={e => setEditForm({...editForm, address: e.target.value})}
                                            className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                        />
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                                    <textarea 
                                        value={editForm.bio}
                                        onChange={e => setEditForm({...editForm, bio: e.target.value})}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none h-24 resize-none transition-colors"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {profile.firstName} {profile.lastName}
                                        </h1>
                                        {profile.isVerifiedNeighbor && (
                                            <ShieldCheck className="text-blue-500 fill-blue-100 dark:fill-blue-900/50" size={28} />
                                        )}
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl">{profile.bio || "This neighbor hasn't written a bio yet."}</p>
                                </div>

                                <div className="flex flex-wrap gap-4 md:gap-8 border-t border-b border-gray-100 dark:border-gray-700 py-4">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <MapPin className="text-gray-400 dark:text-gray-500" size={20}/>
                                        <span>{profile.address}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Phone className="text-gray-400 dark:text-gray-500" size={20}/>
                                        <span>{profile.phoneNumber || "No phone added"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Mail className="text-gray-400 dark:text-gray-500" size={20}/>
                                        <span>{profile.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <Calendar className="text-gray-400 dark:text-gray-500" size={20}/>
                                        <span>Joined {new Date(profile.createdAt || '').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {!isEditing && (
                            <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800 flex flex-col md:flex-row items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-2 text-blue-900 dark:text-blue-300 font-bold mb-1">
                                        <ShieldCheck size={20}/> Neighbor Trust Score
                                    </div>
                                    <p className="text-blue-700 dark:text-blue-400 text-sm">
                                        {profile.isVerifiedNeighbor 
                                            ? "Fully verified and trusted community member." 
                                            : "Complete 3 successful jobs with 5-star reviews to become Verified."}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1 w-full md:w-auto min-w-[200px]">
                                    <span className="text-xs font-bold text-blue-600 dark:text-blue-300 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">
                                        {profile.vouchesCount || 0} / 3 VOUCHES
                                    </span>
                                    <div className="w-full bg-white dark:bg-gray-700 h-3 rounded-full overflow-hidden border border-blue-200 dark:border-blue-800">
                                        <div 
                                            className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                                            style={{ width: `${Math.min(((profile.vouchesCount || 0) / 3) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Offered Services</h2>
                        </div>

                        {services && services.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map(service => (
                                    <div key={service.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition flex flex-col">
                                        <div className="h-40 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-3">
                                            <img src={service.imageUrl || 'https://placehold.co/400x300'} alt={service.title} className="w-full h-full object-cover"/>
                                        </div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{service.title}</h3>
                                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-md">
                                                ${service.hourlyRate}/hr
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3 flex-grow">{service.description}</p>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                                            <Star size={14} className="text-amber-400 fill-amber-400"/>
                                            <span className="font-semibold text-gray-900 dark:text-gray-200">{service.averageRating.toFixed(1)}</span>
                                            <span>({service.totalReviews} reviews)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300 dark:text-gray-500">
                                    <Clock size={32}/>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400">No active services listed.</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Recent Reviews</h2>
                            {profile.reviews && profile.reviews.length > 3 && (
                                <button 
                                    onClick={() => setShowAllReviews(true)}
                                    className="text-sm text-blue-600 dark:text-blue-400 font-medium cursor-pointer hover:underline bg-transparent border-0"
                                >
                                    See All
                                </button>
                            )}
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 space-y-6">
                            {profile.reviews && profile.reviews.length > 0 ? (
                                profile.reviews.slice(0, 3).map(review => (
                                    <ReviewItem key={review.id} review={review} />
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-400 dark:text-gray-500 italic">
                                    No reviews received yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component for a single review
function ReviewItem({ review }: { review: Review }) {
    return (
        <div className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-6 last:pb-0">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                        {review.reviewerName.charAt(0)}
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{review.reviewerName}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex text-amber-400 mb-2">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} className={i < review.rating ? "" : "text-gray-300 dark:text-gray-600"} />
                ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">"{review.comment}"</p>
        </div>
    );
}