import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  CheckCircleOutline as CheckIcon,
  DeleteOutline as DeleteIcon,
  Pets as PetsIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';

const NotificationItem = ({ notification }) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  // Format the date to a readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  // Get the appropriate icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'walk':
        return <CalendarIcon className="text-blue-600" />;
      case 'dog':
        return <PetsIcon className="text-orange-600" />;
      case 'user':
        return <PersonIcon className="text-green-600" />;
      case 'system':
      default:
        return <NotificationsIcon className="text-purple-600" />;
    }
  };

  // Get the appropriate background color for the icon
  const getIconBgColor = () => {
    switch (notification.type) {
      case 'walk':
        return 'bg-blue-100';
      case 'dog':
        return 'bg-orange-100';
      case 'user':
        return 'bg-green-100';
      case 'system':
      default:
        return 'bg-purple-100';
    }
  };

  // Handle click on notification
  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification._id);
    }

    // Navigate based on notification type and entityId if available
    if (notification.entityId && notification.entityModel) {
      switch (notification.entityModel) {
        case 'Walk':
          navigate('/profile'); // Navigate to profile to see walks
          break;
        case 'User':
          navigate('/profile'); // Navigate to profile
          break;
        case 'Dog':
          navigate('/dogs'); // Navigate to dogs page
          break;
        default:
          // No navigation
          break;
      }
    }
  };

  return (
    <div
      className={`flex items-start p-4 hover:bg-gray-50 transition-colors cursor-pointer relative notification-item group ${!notification.read ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
      onClick={handleClick}
    >
      {!notification.read && (
        <span className="absolute top-4 left-0 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
      )}

      <div className={`flex-shrink-0 mt-1 p-2 rounded-full ${getIconBgColor()}`}>
        {getIcon()}
      </div>

      <div className="ml-3 flex-grow">
        <p className={`text-sm ${!notification.read ? 'font-semibold' : ''}`}>
          {notification.content}
        </p>
        <p className="text-xs text-gray-500 mt-1 flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-gray-300 mr-2"></span>
          {formatDate(notification.createdAt)}
        </p>
      </div>

      <div className="flex-shrink-0 flex space-x-1 notification-actions opacity-0 group-hover:opacity-100">
        {!notification.read && (
          <button
            className="text-blue-500 hover:text-blue-700 p-1.5 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              markAsRead(notification._id);
            }}
            title="Mark as read"
          >
            <CheckIcon fontSize="small" />
          </button>
        )}

        <button
          className="text-red-500 hover:text-red-700 p-1.5 rounded-full hover:bg-red-100 transition-colors shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            deleteNotification(notification._id);
          }}
          title="Delete notification"
        >
          <DeleteIcon fontSize="small" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;
