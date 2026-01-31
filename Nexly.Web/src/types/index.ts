export interface User {
    id: string;
    slug?: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address: string;
    latitude: number;
    longitude: number;
    bio?: string;
    profileImageUrl?: string;
    coverPhoto?: string; 
    isServiceProvider: boolean;
    timeCredits?: number; 
    isVerifiedNeighbor?: boolean;
    isVerificationPending?: boolean;
    monthlyHelps?: number;
    vouchesCount?: number;
    createdAt?: string;
    
    // For Profile Page
    services?: Service[];
    reviews?: Review[];
}

export interface Review {
    id: number;
    bookingId: number;
    reviewerName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface Service {
    id: number;
    title: string;
    description: string;
    category: number | string;
    hourlyRate: number;
    currency: string;
    averageRating: number;
    totalReviews: number;
    providerName: string;
    providerId: string;
    providerIsVerified: boolean; 
    providerAddress: string; 
    distanceKm: number;
    imageUrl?: string; 
}

export const BookingStatus = {
    Pending: 0,
    Confirmed: 1,
    InProgress: 2,
    Completed: 3,
    Cancelled: 4,
    Disputed: 5
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export interface Booking {
    id: number;
    serviceTitle: string;
    providerName: string;
    clientName: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    totalAmount: number;
    status: BookingStatus;
    paymentMethod?: string;
    exchangeServiceTitle?: string;
    createdAt: string;
    hasBeenReviewed?: boolean;
    meetingLink?: string;
}

export const ServiceCategory = {
    Gardening: 0,
    Tutoring: 1,
    HomeRepair: 2,
    Cleaning: 3,
    PetCare: 4,
    Moving: 5,
    Cooking: 6,
    Technology: 7,
    Fitness: 8,
    Music: 9,
    Art: 10,
    Other: 11
} as const;

export type ServiceCategory = typeof ServiceCategory[keyof typeof ServiceCategory];

export const CategoryData = [
    { id: 0, name: 'Gardening', image: 'https://images.unsplash.com/photo-1558904541-efa843a96f01?auto=format&fit=crop&w=600&q=80' },
    { id: 1, name: 'Tutoring', image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=600&q=80' },
    { id: 2, name: 'HomeRepair', image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&w=600&q=80' },
    { id: 3, name: 'Cleaning', image: 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?auto=format&fit=crop&w=600&q=80' },
    { id: 4, name: 'PetCare', image: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=600&q=80' },
    { id: 5, name: 'Moving', image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=600&q=80' },
    { id: 6, name: 'Cooking', image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80' },
    { id: 7, name: 'Technology', image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80' },
    { id: 8, name: 'Fitness', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=600&q=80' },
    { id: 9, name: 'Music', image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=600&q=80' },
    { id: 10, name: 'Art', image: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=600&q=80' },
    { id: 11, name: 'Other', image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=600&q=80' },
];