import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import toast from 'react-hot-toast';

export const useSignalR = () => {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        const hubUrl = import.meta.env.PROD 
            ? "/hubs/notifications" 
            : "http://localhost:5002/hubs/notifications";

        const connection = new signalR.HubConnectionBuilder()
            .withUrl(hubUrl, {
                accessTokenFactory: () => token 
            })
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => console.log('🟢 Connected to SignalR'))
            .catch(err => console.error('🔴 SignalR Connection Error: ', err));

        connection.on("ReceiveNotification", (notification: any) => {
            console.log("New Notification:", notification);
            setNotifications(prev => [...prev, notification]);

            toast.success(notification.message, {
                duration: 5000,
                position: 'top-right',
                style: {
                    border: '1px solid #2563eb',
                    padding: '16px',
                    color: '#1f2937',
                },
                iconTheme: {
                    primary: '#2563eb',
                    secondary: '#FFFAEE',
                },
            });
        });

        return () => {
            connection.stop();
        };
    }, []);

    return { notifications };
};