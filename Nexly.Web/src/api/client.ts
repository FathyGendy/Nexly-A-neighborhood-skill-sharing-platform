import axios from 'axios';

export const API_URL = import.meta.env.PROD 
    ? '/api' 
    : (import.meta.env.VITE_API_URL || 'http://localhost:5002/api');

export const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Request Interceptor
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// 2. Response Interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn("Session expired. Redirecting to login...");
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export const generateDescription = async (title: string, category: string) => {
  const response = await apiClient.post('/ai/generate-description', { title, category });
  return response.data.description;
};

export const chatWithNexy = async (message: string) => {
    const response = await apiClient.post('/ai/chat', { message });
    return response.data; 
};

export const updateBookingStatus = async (bookingId: number, status: 'Confirmed' | 'Cancelled') => {
  await apiClient.put(`/Bookings/${bookingId}/status`, { status });
};

export const submitReview = async (bookingId: number, rating: number, comment: string) => {
    const response = await apiClient.post('/Reviews', { 
        bookingId, 
        rating, 
        comment 
    });
    return response.data;
};

export const getChatHistory = async (bookingId: number) => {
  const response = await apiClient.get(`/messages/${bookingId}`);
  return response.data;
};

export const getUserProfile = async (idOrSlug: string) => {
    const response = await apiClient.get(`/auth/profile/${idOrSlug}`);
    return response.data;
};

export const updateUserProfile = async (data: FormData | any) => {
    const isFormData = data instanceof FormData;
    const response = await apiClient.put(`/auth/profile`, data, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : { 'Content-Type': 'application/json' }
    });
    return response.data;
};

export const searchServices = async (lat: number, lng: number, category?: number, searchTerm?: string) => {
    let url = `/Services/nearby?latitude=${lat}&longitude=${lng}&radiusKm=50`;
    if (category !== undefined && category !== null) {
        url += `&category=${category}`;
    }
    if (searchTerm) {
        url += `&searchTerm=${encodeURIComponent(searchTerm)}`;
    }
    const response = await apiClient.get(url);
    return response.data;
};

export const getMyServices = async () => {
    const response = await apiClient.get('/Services/my-services');
    return response.data;
};

export const deleteService = async (id: number) => {
    await apiClient.delete(`/Services/${id}`);
};

export const updateService = async (id: number, formData: FormData) => {
    const response = await apiClient.put(`/Services/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const uploadChatAttachment = async (file: File | Blob, filename?: string) => {
    const formData = new FormData();
    if (file instanceof Blob && filename) {
        formData.append('file', file, filename);
    } else {
        formData.append('file', file as File);
    }
    
    const response = await apiClient.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data.url;
};

export const translateMessage = async (content: string) => {
    const response = await apiClient.post('/messages/translate', { content });
    return response.data.translation;
};