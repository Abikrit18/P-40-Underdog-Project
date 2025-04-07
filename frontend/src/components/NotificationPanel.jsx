import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import { 
  CheckCircle as CheckAllIcon,
  Refresh as RefreshIcon,
  NotificationsOff as EmptyIcon
} from '@mui/icons-material';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    fetchNotifications, 
    markAllAsRead 
  } = useNotifications();
  
  // Handle refresh button click
  const handleRefresh = (e) => {
    e.stopPropagation();
    fetchNotifications();
  };
  
  // Handle mark all as read button click
  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    markAllAsRead();
  };
  
  // If panel is not open, don't render anything
  if (!isOpen) return null;
  
  return (
    <div 
      className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-50 max-h-[80vh] flex flex-col overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="bg-orange-600 text-white p-3 flex justify-between items-center">
        <h3 className="font-semibold">
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </h3>
        <div className="flex space-x-2">
          <button 
            className="text-white hover:text-orange-200 transition-colors"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh notifications"
          >
            <RefreshIcon fontSize="small" className={loading ? 'animate-spin' : ''} />
          </button>
          
          {unreadCount > 0 && (
            <button 
              className="text-white hover:text-orange-200 transition-colors"
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              <CheckAllIcon fontSize="small" />
            </button>
          )}
        </div>
      </div>
      
      {/* Notification List */}
      <div className="overflow-y-auto flex-grow">
        {loading && notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <EmptyIcon className="text-gray-400 mb-2" style={{ fontSize: '3rem' }} />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map(notification => (
            <NotificationItem 
              key={notification._id} 
              notification={notification} 
            />
          ))
        )}
      </div>
      
      {/* Footer */}
      <div className="p-2 text-center border-t text-xs text-gray-500">
        {notifications.length > 0 && (
          <button 
            className="hover:text-orange-600 transition-colors"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
