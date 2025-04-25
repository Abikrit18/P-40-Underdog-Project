import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { BellIcon, BellSlashIcon } from '@heroicons/react/24/outline';

const PushNotificationManager = () => {
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setPushSupported(true);
      
      // Check if notifications are already enabled
      checkNotificationStatus();
      
      // Get user ID from token
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setUserId(decoded.id);
        } catch (error) {
          console.error('Invalid token:', error);
        }
      }
    }
  }, []);

  const checkNotificationStatus = async () => {
    try {
      // Check if service worker is registered
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;
      
      // Check if permission is granted
      const permission = Notification.permission;
      if (permission === 'granted') {
        // Check if we have a subscription
        const subscription = await registration.pushManager.getSubscription();
        setPushEnabled(!!subscription);
      } else {
        setPushEnabled(false);
      }
    } catch (error) {
      console.error('Error checking notification status:', error);
    }
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      throw error;
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!userId) {
      toast.error('You must be logged in to enable notifications');
      return;
    }
    
    setLoading(true);
    try {
      // Register service worker if not already registered
      const registration = await navigator.serviceWorker.getRegistration() || 
                          await registerServiceWorker();
      
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast.error('Notification permission denied');
        setLoading(false);
        return;
      }
      
      // Get existing subscription or create a new one
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Get public key from server
        const response = await axios.get('http://localhost:3000/notifications/vapid-public-key');
        const vapidPublicKey = response.data.vapidPublicKey;
        
        // Convert the key to the format required by the browser
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
        
        // Subscribe the user
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }
      
      // Send the subscription to the server
      await axios.post('http://localhost:3000/notifications/push-subscription', {
        userId,
        subscription: JSON.stringify(subscription)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setPushEnabled(true);
      toast.success('Push notifications enabled');
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      toast.error('Failed to enable push notifications');
    } finally {
      setLoading(false);
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    if (!userId) {
      toast.error('You must be logged in to disable notifications');
      return;
    }
    
    setLoading(true);
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        setPushEnabled(false);
        setLoading(false);
        return;
      }
      
      // Get subscription
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setPushEnabled(false);
        setLoading(false);
        return;
      }
      
      // Unsubscribe
      await subscription.unsubscribe();
      
      // Notify server
      await axios.delete(`http://localhost:3000/notifications/push-subscription/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      setPushEnabled(false);
      toast.success('Push notifications disabled');
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      toast.error('Failed to disable push notifications');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  if (!pushSupported) {
    return null; // Don't render anything if push is not supported
  }

  return (
    <div className="flex items-center">
      <button
        onClick={pushEnabled ? unsubscribeFromPushNotifications : subscribeToPushNotifications}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
          pushEnabled 
            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        } transition-colors`}
        title={pushEnabled ? 'Disable push notifications' : 'Enable push notifications'}
      >
        {loading ? (
          <span className="animate-spin">⟳</span>
        ) : pushEnabled ? (
          <BellIcon className="h-5 w-5" />
        ) : (
          <BellSlashIcon className="h-5 w-5" />
        )}
        {pushEnabled ? 'Notifications On' : 'Enable Notifications'}
      </button>
    </div>
  );
};

export default PushNotificationManager;
