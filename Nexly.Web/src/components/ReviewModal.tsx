import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { submitReview } from '../api/client';
import toast from 'react-hot-toast';

interface ReviewModalProps {
    bookingId: number;
    providerName: string;
    isOpen: boolean;
    onClose: (success: boolean) => void;
}

export default function ReviewModal({ bookingId, providerName, isOpen, onClose }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        
        setLoading(true);
        try {
            await submitReview(bookingId, rating, comment);
            toast.success('Review submitted successfully!');
            onClose(true);
        } catch (error: any) {
            console.error(error);
            setLoading(false);

            // Handle "Already Rated" or other API errors
            if (error.response && error.response.status === 400) {
                const msg = error.response.data?.message || "You have already reviewed this service.";
                toast.error(msg, {
                    style: {
                        border: '1px solid #ef4444',
                        color: '#7f1d1d',
                    },
                    iconTheme: {
                        primary: '#ef4444',
                        secondary: '#FFFAEE',
                    },
                });
            } else {
                toast.error("Failed to submit review. Please try again.");
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Rate Experience</h3>
                    <button onClick={() => onClose(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>
                
                <p className="text-gray-600 text-sm mb-6">
                    How was your session with <span className="font-semibold text-gray-900">{providerName}</span>?
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Star Rating */}
                    <div className="flex justify-center gap-2 mb-6">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                type="button"
                                key={star}
                                className="transition-transform hover:scale-110 focus:outline-none"
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                            >
                                <Star 
                                    size={32} 
                                    className={`${(hoveredRating || rating) >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} 
                                />
                            </button>
                        ))}
                    </div>

                    <textarea 
                        className="w-full border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-4 resize-none bg-gray-50"
                        rows={3}
                        placeholder="Write a brief comment (optional)..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />

                    <div className="text-xs text-gray-400 mb-4 text-center">
                        giving 5 stars counts as a <strong>Vouch</strong> for this neighbor!
                    </div>

                    <button 
                        type="submit"
                        disabled={loading || rating === 0}
                        className={`w-full py-3 rounded-xl font-bold text-white transition
                            ${loading || rating === 0 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
}