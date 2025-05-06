import React, { useEffect, useRef } from 'react';
import { useNotifications } from '../context/NotificationContext';
import NotificationItem from './NotificationItem';
import {
  CheckCircle as CheckAllIcon,
  Refresh as RefreshIcon,
  NotificationsOff as EmptyIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationPanel = ({ isOpen, onClose }) => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAllAsRead
  } = useNotifications();

  const scrollRef = useRef(null);
  const [filter, setFilter] = React.useState('all'); // 'all', 'unread', 'read'

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

  // Scroll to top when notifications change
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = 0;
    }
  }, [notifications, isOpen]);

  // Filter notifications based on current filter
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  // Toggle filter
  const toggleFilter = (e) => {
    e.stopPropagation();
    if (filter === 'all') setFilter('unread');
    else if (filter === 'unread') setFilter('read');
    else setFilter('all');
  };

  // If panel is not open, don't render anything
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="notification-panel"
        onClick={(e) => e.stopPropagation()}
      >
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 to-red-850 text-white p-4 flex justify-between items-center shadow-sm">
        <h3 className="font-semibold text-lg flex items-center">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 bg-white text-orange-600 text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex space-x-3">
          <button
            className="text-white hover:text-orange-100 transition-colors p-1 rounded-full hover:bg-orange-700/30"
            onClick={toggleFilter}
            title={`Filter: ${filter === 'all' ? 'All' : filter === 'unread' ? 'Unread' : 'Read'}`}
          >
            <FilterIcon fontSize="small" />
            <span className="sr-only">Filter: {filter}</span>
          </button>

          <button
            className="text-white hover:text-orange-100 transition-colors p-1 rounded-full hover:bg-orange-700/30"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh notifications"
          >
            <RefreshIcon fontSize="small" className={loading ? 'animate-spin' : ''} />
          </button>

          {unreadCount > 0 && (
            <button
              className="text-white hover:text-orange-100 transition-colors p-1 rounded-full hover:bg-orange-700/30"
              onClick={handleMarkAllAsRead}
              title="Mark all as read"
            >
              <CheckAllIcon fontSize="small" />
            </button>
          )}
        </div>
      </div>

      {/* Filter indicator */}
      {filter !== 'all' && (
        <div className="bg-gray-100 px-4 py-2 text-sm text-gray-600 flex justify-between items-center border-b border-gray-200">
          <span>
            Showing {filter === 'unread' ? 'unread' : 'read'} notifications
          </span>
          <button
            onClick={() => setFilter('all')}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Show all
          </button>
        </div>
      )}

      {/* Notification List */}
      <div
        ref={scrollRef}
        className="overflow-y-auto flex-grow custom-scrollbar"
        style={{
          maxHeight: notifications.length > 3 ? '40vh' : 'auto',
          scrollBehavior: 'smooth'
        }}
      >
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p>Loading notifications...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <EmptyIcon className="text-gray-400 mb-2" style={{ fontSize: '3rem' }} />
            <p className="font-medium mb-1">
              {notifications.length === 0
                ? 'No notifications yet'
                : `No ${filter === 'unread' ? 'unread' : 'read'} notifications`}
            </p>
            {notifications.length > 0 && filter !== 'all' && (
              <p className="text-sm text-gray-400">
                Try changing the filter to see all notifications
              </p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map(notification => (
              <motion.div
                key={notification._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <NotificationItem notification={notification} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <span className="text-xs text-gray-500">
          {notifications.length} {notifications.length === 1 ? 'notification' : 'notifications'}
        </span>

        {unreadCount > 0 && (
          <button
            className="text-xs text-blue-600 hover:text-blue-800 font-medium py-1 px-2 rounded hover:bg-blue-50"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>
    </motion.div>
    </AnimatePresence>
  );
};

export default NotificationPanel;
