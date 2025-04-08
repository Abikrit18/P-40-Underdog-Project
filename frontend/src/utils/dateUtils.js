/**
 * Utility functions for handling dates and times consistently across the application
 */

/**
 * Formats a time string (HH:MM) for display in 12-hour format with AM/PM
 * @param {string} timeString - Time in 24-hour format (HH:MM)
 * @returns {string} Formatted time string in 12-hour format
 */
export const formatTimeForDisplay = (timeString) => {
    if (!timeString) return "N/A";

    try {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours, 10);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12; // Convert 0 to 12 for 12 AM

        return `${hour12}:${minutes} ${ampm}`;
    } catch (error) {
        console.error("Error formatting time:", error);
        return timeString;
    }
};

/**
 * Converts a date string to a standardized format (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateString = (date) => {
    if (!date) return "";

    const dateObj = date instanceof Date ? date : new Date(date);

    // Get date components in local timezone
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

/**
 * Normalizes a date string to ensure consistent format for comparison
 * @param {string} dateStr - Date string in any valid format
 * @returns {string} Normalized date string in YYYY-MM-DD format
 */
export const normalizeDateString = (dateStr) => {
    if (!dateStr) return "";

    // If it's already in YYYY-MM-DD format and valid, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }

    try {
        // Create a new date object with the date string
        // Use the date constructor with explicit year, month, day to avoid timezone issues
        let date;

        if (typeof dateStr === 'string' && dateStr.includes('-')) {
            // Parse YYYY-MM-DD format
            const [year, month, day] = dateStr.split('-').map(Number);
            // Create date with local timezone (month is 0-indexed in JS Date)
            date = new Date(year, month - 1, day);
        } else {
            // Handle other formats
            date = new Date(dateStr);
        }

        if (isNaN(date.getTime())) {
            console.error("Invalid date:", dateStr);
            return ""; // Invalid date
        }

        // Format the date consistently
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const normalized = `${year}-${month}-${day}`;
        console.log(`Normalized date: ${dateStr} → ${normalized}`);
        return normalized;
    } catch (error) {
        console.error("Error normalizing date string:", error, dateStr);
        return "";
    }
};

/**
 * Checks if a date is in the past (before today)
 * @param {string|Date} date - Date to check (YYYY-MM-DD format if string)
 * @returns {boolean} True if date is in the past
 */
export const isDateInPast = (date) => {
    if (!date) return false;

    let year, month, day;

    if (typeof date === 'string' && date.includes('-')) {
        // Parse YYYY-MM-DD format
        [year, month, day] = date.split('-').map(Number);
        // Month is 0-indexed in JavaScript Date
        month = month - 1;
    } else {
        // Handle Date object or other string formats
        const dateObj = date instanceof Date ? date : new Date(date);
        year = dateObj.getFullYear();
        month = dateObj.getMonth();
        day = dateObj.getDate();
    }

    // Create date objects in local timezone
    const dateToCheck = new Date(year, month, day);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return dateToCheck < today;
};

/**
 * Checks if a time has already passed for today
 * @param {string} timeString - Time in 24-hour format (HH:MM)
 * @returns {boolean} True if time has already passed
 */
export const hasTimePassed = (timeString) => {
    if (!timeString) return false;

    const now = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);

    // Compare using minutes since midnight for more reliable comparison
    const currentMinutesSinceMidnight = (now.getHours() * 60) + now.getMinutes();
    const timeToCheckMinutesSinceMidnight = (hours * 60) + minutes;

    return timeToCheckMinutesSinceMidnight < currentMinutesSinceMidnight;
};

/**
 * Parses a date string in YYYY-MM-DD format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Object} Object with year, month, and day properties
 */
export const parseDateString = (dateString) => {
    if (!dateString || typeof dateString !== 'string') {
        return { year: 0, month: 0, day: 0 };
    }

    const [year, month, day] = dateString.split('-').map(Number);

    // Month is 0-indexed in JavaScript Date
    return { year, month: month - 1, day };
};
