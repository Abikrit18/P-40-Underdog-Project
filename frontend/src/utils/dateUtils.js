import { parse, format, parseISO, isBefore, startOfToday, set, getYear, getMonth, getDate } from 'date-fns';

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
    // console.log("timing" + timeString); // Keep console log if needed for debugging

    try {
        // Parse the time string assuming it's HH:mm
        const time = parse(timeString, 'HH:mm', new Date());
        // Format it into h:mm a (12-hour format with AM/PM)
        return format(time, 'h:mm a');
    } catch (error) {
        console.error("Error formatting time:", error, timeString);
        // Fallback to original string or handle error appropriately
        return timeString;
    }
};

/**
 * Converts a date object or a valid date string to a standardized format (YYYY-MM-DD)
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string (YYYY-MM-DD) or empty string if invalid
 */
export const formatDateString = (date) => {
    if (!date) return "";

    try {
        const dateObj = date instanceof Date ? date : parseISO(date); // Prefer parseISO for 'YYYY-MM-DD'
        if (isNaN(dateObj.getTime())) {
             // Fallback for non-ISO formats if necessary, though normalize should handle this
             const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
             if (isNaN(parsedDate.getTime())) throw new Error("Invalid date format");
             return format(parsedDate, 'yyyy-MM-dd');
        }
        return format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
        console.error("Error formatting date string:", error, date);
        return ""; // Return empty for invalid dates
    }
};

/**
 * Normalizes a date string to ensure consistent format (YYYY-MM-DD) for comparison
 * Tries to parse various common date formats.
 * @param {string} dateStr - Date string in any valid format supported by parseISO or common formats
 * @returns {string} Normalized date string in YYYY-MM-DD format or empty string if invalid
 */
export const normalizeDateString = (dateStr) => {
    if (!dateStr) return "";

    try {
        let parsedDate;
        // Try ISO format first (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
            parsedDate = parseISO(dateStr);
        } else {
            // Try other common formats if needed, or rely on Date constructor's flexibility
            // For robustness, you might add specific parse calls for expected formats
            // e.g., parsedDate = parse(dateStr, 'MM/dd/yyyy', new Date());
            // Using parseISO or new Date() might be sufficient depending on inputs
             parsedDate = new Date(dateStr); // Less reliable, depends on browser implementation
             // A more robust approach might involve multiple parse attempts
             if (isNaN(parsedDate.getTime())) {
                // Attempt parsing with a specific format if known
                 parsedDate = parse(dateStr, 'yyyy-MM-dd', new Date());
             }
        }


        if (isNaN(parsedDate.getTime())) {
            console.error("Invalid date:", dateStr);
            return ""; // Invalid date
        }

        // Format the date consistently to YYYY-MM-DD
        const normalized = format(parsedDate, 'yyyy-MM-dd');
        // console.log(`Normalized date: ${dateStr} → ${normalized}`); // Keep if needed
        return normalized;
    } catch (error) {
        console.error("Error normalizing date string:", error, dateStr);
        return "";
    }
};

/**
 * Checks if a date is in the past (before today)
 * @param {string|Date} date - Date to check (assumes YYYY-MM-DD format if string)
 * @returns {boolean} True if date is in the past
 */
export const isDateInPast = (date) => {
    if (!date) return false;

    try {
        let dateToCheck;
        if (typeof date === 'string') {
            // Assume YYYY-MM-DD format based on previous usage
            dateToCheck = parse(date, 'yyyy-MM-dd', new Date());
             // Alternatively, use parseISO if strictly YYYY-MM-DD
             // dateToCheck = parseISO(date);
        } else if (date instanceof Date) {
            dateToCheck = date;
        } else {
             console.warn("Invalid date type for isDateInPast:", date);
             return false; // Or handle as an error
        }


        if (isNaN(dateToCheck.getTime())) {
            console.error("Invalid date provided to isDateInPast:", date);
            return false; // Treat invalid date as not in the past
        }

        // Compare the start of the dateToCheck day with the start of today
        return isBefore(startOfToday(dateToCheck), startOfToday());
    } catch (error) {
        console.error("Error checking if date is in past:", error, date);
        return false; // Default to false on error
    }
};

/**
 * Checks if a time (on today's date) has already passed
 * @param {string} timeString - Time in 24-hour format (HH:MM)
 * @returns {boolean} True if time has already passed today
 */
export const hasTimePassed = (timeString) => {
    if (!timeString) return false;

    try {
        // Parse the time string (HH:mm)
        const timeParts = parse(timeString, 'HH:mm', new Date());

        if (isNaN(timeParts.getTime())) {
             console.error("Invalid time format for hasTimePassed:", timeString);
             return false;
        }

        // Set the parsed time onto today's date
        const dateTimeToCheck = set(new Date(), {
            hours: timeParts.getHours(),
            minutes: timeParts.getMinutes(),
            seconds: 0, // Explicitly set seconds/ms for accurate comparison
            milliseconds: 0
        });

        // Compare with the current time
        return isBefore(dateTimeToCheck, new Date());

    } catch (error) {
        console.error("Error checking if time has passed:", error, timeString);
        return false; // Default to false on error
    }
};

/**
 * Parses a date string in YYYY-MM-DD format into its components
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {Object|null} Object with year, month (0-indexed), and day properties, or null if invalid
 */
export const parseDateString = (dateString) => {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
         console.warn("Invalid format for parseDateString, expected YYYY-MM-DD:", dateString);
        return null; // Return null for invalid input
    }

    try {
        // Parse the date string assuming YYYY-MM-DD format
        const parsedDate = parseISO(dateString); // parseISO is strict for YYYY-MM-DD

        if (isNaN(parsedDate.getTime())) {
             console.error("Failed to parse date string with parseISO:", dateString);
            return null; // Return null if parsing fails
        }

        // Extract components
        return {
            year: getYear(parsedDate),
            month: getMonth(parsedDate), // month is 0-indexed in date-fns (and JS Date)
            day: getDate(parsedDate)
        };
    } catch (error) {
        console.error("Error parsing date string:", error, dateString);
        return null; // Return null on error
    }
};
