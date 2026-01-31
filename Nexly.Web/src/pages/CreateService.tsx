import React, { useState } from 'react';
import { apiClient, generateDescription } from '../api/client';
import { useNavigate } from 'react-router-dom';
import { ServiceCategory } from '../types';
import { ArrowLeft, DollarSign, Sparkles, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function CreateService() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [isAiLoading, setIsAiLoading] = useState(false);
    
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category: 0,
        hourlyRate: '',
        customCategory: '',
    });

    // Handle Text Changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file)); // Create a local preview
        }
    };

    // Remove Selected Image
    const removeImage = () => {
        setImageFile(null);
        setPreviewUrl(null);
    };

    const handleAiGenerate = async () => {
        if (!formData.title) {
            toast.error("Please enter a Service Title first!");
            return;
        }

        try {
            setIsAiLoading(true);
            
            // Determine the context to send to AI
            let categoryContext = "";
            
            // Check if "Other" (Enum value 11) is selected
            if (Number(formData.category) === 11) {
                if (!formData.customCategory.trim()) {
                    toast.error("Please specify the service type first!");
                    setIsAiLoading(false);
                    return;
                }
                // Use the custom text (e.g., "Dog Walking")
                categoryContext = formData.customCategory;
            } else {
                // Correctly find the Key (Name) by Value (ID)
                const categoryName = Object.keys(ServiceCategory).find(
                    key => ServiceCategory[key as keyof typeof ServiceCategory] === Number(formData.category)
                );
                categoryContext = categoryName || "General Service";
            }

            const description = await generateDescription(formData.title, categoryContext);
            setFormData(prev => ({ ...prev, description: description }));
            toast.success("Description generated!");
        } catch (error) {
            console.error(error);
            toast.error("AI Generation failed.");
        } finally {
            setIsAiLoading(false);
        }
    };
    // -----------------------------------

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Create FormData object (Required for sending files)
            const data = new FormData();
            
            let finalTitle = formData.title;
            const isOtherCategory = Number(formData.category) === 11; // 11 is 'Other' in ServiceCategory enum

            if (isOtherCategory && formData.customCategory) {
                // Appending custom type to title for visibility in dashboard
                finalTitle = `${formData.title} (${formData.customCategory})`;
            }

            data.append('title', finalTitle);
            data.append('description', formData.description);
            data.append('category', formData.category.toString());
            data.append('hourlyRate', formData.hourlyRate.toString());
            
            // Defaulting to New York for testing visibility
            data.append('latitude', '40.7128');
            data.append('longitude', '-74.0060');
            
            // 2. Append the file if it exists
            if (imageFile) {
                data.append('image', imageFile);
            }

            // 3. Send as Multipart Form Data
            await apiClient.post('/Services', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success("Service Published Successfully!");
            navigate('/provider-dashboard');
        } catch (err: any) {
            console.error(err);
            toast.error('Failed to create service. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-6 flex justify-center">
            <div className="max-w-2xl w-full">
                <button 
                    onClick={() => navigate('/provider-dashboard')}
                    className="flex items-center text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary mb-6 transition"
                >
                    <ArrowLeft size={20} className="mr-2" /> Back to Dashboard
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-300">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Offer a New Service</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Fill in the details to start getting booked by neighbors.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Service Title</label>
                            <input 
                                name="title"
                                required
                                minLength={5}
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="e.g. Expert Math Tutoring"
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white dark:bg-gray-700 dark:text-white transition-colors"
                            />
                        </div>

                        {/* Category */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                            <select 
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:text-white transition-colors"
                            >
                                {Object.keys(ServiceCategory).filter(k => isNaN(Number(k))).map((key) => (
                                    <option key={key} value={ServiceCategory[key as keyof typeof ServiceCategory]}>
                                        {key}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Conditional Input for "Other" Category */}
                        {Number(formData.category) === 11 && (
                            <div className="animate-fade-in-up">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Specify Service Type <span className="text-red-500">*</span>
                                </label>
                                <input 
                                    name="customCategory"
                                    required
                                    value={formData.customCategory}
                                    onChange={handleChange}
                                    placeholder="e.g. Software Services, Dog Walking, Snow Shoveling..."
                                    className="w-full px-4 py-2 border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-colors"
                                />
                            </div>
                        )}

                        {/* Image Upload Area */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Service Photo <span className="text-gray-400 font-normal ml-2">(Optional - Leave blank for default)</span>
                            </label>
                            
                            {!previewUrl ? (
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer relative bg-white dark:bg-gray-700/30">
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="space-y-1 text-center">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <div className="flex text-sm text-gray-600 dark:text-gray-400 justify-center">
                                            <span className="font-medium text-blue-600 hover:text-blue-500">Upload a file</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, GIF up to 5MB</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative mt-2 w-full h-48 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="absolute top-2 right-2 bg-white dark:bg-gray-800 p-1 rounded-full shadow-md text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <div className="flex justify-between items-end mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                <button
                                    type="button"
                                    onClick={handleAiGenerate}
                                    disabled={isAiLoading}
                                    className="text-xs flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded-md border border-purple-200 dark:border-purple-800 transition-colors disabled:opacity-50"
                                >
                                    <Sparkles className="w-3 h-3" />
                                    {isAiLoading ? "Writing..." : "Auto-Write with AI"}
                                </button>
                            </div>
                            <textarea 
                                name="description"
                                required
                                minLength={20}
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                placeholder="Describe your experience and what you offer..."
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none resize-none bg-white dark:bg-gray-700 dark:text-white transition-colors"
                            />
                        </div>

                        {/* Price */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hourly Rate (USD)</label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={18} />
                                <input 
                                    name="hourlyRate"
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.hourlyRate}
                                    onChange={handleChange}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary outline-none bg-white dark:bg-gray-700 dark:text-white transition-colors"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition
                                ${isLoading ? 'bg-gray-400 dark:bg-gray-600' : 'bg-primary hover:bg-blue-600 shadow-md'}`}
                        >
                            {isLoading ? 'Creating...' : 'Publish Service'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}