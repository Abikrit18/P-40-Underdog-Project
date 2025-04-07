import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Create the context
const NotificationContext = createContext();

// Create a custom hook to use the notification context
const useNotifications = () => useContext(NotificationContext);

// Provider component
function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);

  // Get user ID from token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('Token decoded in NotificationContext:', decoded);

        // Check if id exists in the token
        if (decoded.id) {
          console.log('Found user ID in token:', decoded.id);
          setUserId(decoded.id);
        } else {
          console.error('No user ID found in token:', decoded);
          // Try to find user ID in other possible locations
          if (decoded.sub) {
            console.log('Using sub as userId');
            setUserId(decoded.sub);
          } else if (decoded.userId) {
            console.log('Using userId property');
            setUserId(decoded.userId);
          } else {
            // As a last resort, try to extract user ID from other token properties
            const possibleIdFields = Object.keys(decoded).filter(key =>
              key.toLowerCase().includes('id') || key === '_id'
            );

            if (possibleIdFields.length > 0) {
              const idField = possibleIdFields[0];
              console.log(`Using ${idField} as userId:`, decoded[idField]);
              setUserId(decoded[idField]);
            }
          }
        }
      } catch (error) {
        console.error('Invalid token:', error);
      }
    }
  }, []);

  // Listen for token changes (e.g., when user logs in)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        if (e.newValue) {
          try {
            const decoded = jwtDecode(e.newValue);
            console.log('Token changed, new decoded token:', decoded);
            // Use the same ID extraction logic as above
            if (decoded.id) {
              console.log('Found user ID in new token:', decoded.id);
              setUserId(decoded.id);
            } else {
              // Try to find user ID in other possible locations
              if (decoded.sub) {
                console.log('Using sub as userId in new token');
                setUserId(decoded.sub);
              } else if (decoded.userId) {
                console.log('Using userId property in new token');
                setUserId(decoded.userId);
              } else {
                // As a last resort, try to extract user ID from other token properties
                const possibleIdFields = Object.keys(decoded).filter(key =>
                  key.toLowerCase().includes('id') || key === '_id'
                );

                if (possibleIdFields.length > 0) {
                  const idField = possibleIdFields[0];
                  console.log(`Using ${idField} as userId in new token:`, decoded[idField]);
                  setUserId(decoded[idField]);
                }
              }
            }
          } catch (error) {
            console.error('Error decoding new token:', error);
          }
        } else {
          // Token was removed (logout)
          setUserId(null);
          setNotifications([]);
          setUnreadCount(0);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Fetch notifications when userId changes
  useEffect(() => {
    if (userId) {
      console.log('UserId changed, fetching notifications for:', userId);
      fetchNotifications();

      // Set up polling to check for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);

      // Clean up interval on unmount
      return () => clearInterval(interval);
    }
  }, [userId]);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    if (!userId) {
      console.log('No userId available, skipping notification fetch');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token available, skipping notification fetch');
      return;
    }

    setLoading(true);
    try {
      console.log(`Fetching notifications for user: ${userId}`);
      const response = await axios.get(`http://localhost:3000/notifications/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Notifications response:', response.data);
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to mark a notification as read
  const markAsRead = async (notificationId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(`http://localhost:3000/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification =>
          notification._id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );

      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    if (!userId) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.put(`http://localhost:3000/notifications/user/${userId}/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, read: true }))
      );

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Function to delete a notification
  const deleteNotification = async (notificationId) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      await axios.delete(`http://localhost:3000/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification._id !== notificationId)
      );

      // If the deleted notification was unread, decrement the unread count
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export { NotificationContext, useNotifications, NotificationProvider };