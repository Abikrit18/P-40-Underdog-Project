const formatTimeForDisplay = (timeString) => {
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

export default formatTimeForDisplay;