import { useEffect } from 'react'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom'; 
import { Toaster } from 'react-hot-toast';
import { useSignalR } from './hooks/useSignalR';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MyBookings from './pages/MyBookings';
import ProviderDashboard from './pages/ProviderDashboard';
import CreateService from './pages/CreateService';
import LandingPage from './pages/LandingPage'; 
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import BlogPage from './pages/BlogPage';
import CareersPage from './pages/CareersPage';

import NexyWidget from './components/NexyWidget';

function SignalRListener() {
    useSignalR();
    return null;
}

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster />
      <SignalRListener />
      
      <NexyWidget />
      
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/provider-dashboard" element={<ProviderDashboard />} />
        <Route path="/create-service" element={<CreateService />} />
        
        {/* --- CHANGED: :id to :slug --- */}
        <Route path="/profile/:slug" element={<ProfilePage />} />
        
        <Route path="/settings" element={<SettingsPage />} />
        
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/careers" element={<CareersPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;