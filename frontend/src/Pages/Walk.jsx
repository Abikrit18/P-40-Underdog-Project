import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import "../App.css";
import { toast } from "react-toastify";
import { formatTimeForDisplay, isDateInPast, normalizeDateString } from "../utils/dateUtils";
import { parseISO, isToday as isTodayFns } from 'date-fns';

const Walk = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState();
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState("");
    const [availableDate, setAvailableDate] = useState("");
    const [availableTime, setAvailableTime] = useState("");
    const [availableTimesData, setAvailableTimesData] = useState([]);
    const [filteredWalks, setFilteredWalks] = useState([]);
    const [shelterTimes, setShelterTimes] = useState([]);
    const [shelterDate, setShelterDate] = useState("");
    const [shelterStartTime, setShelterStartTime] = useState("");
    const [shelterEndTime, setShelterEndTime] = useState("");
    const [shelterIsClosed, setShelterIsClosed] = useState(false);
    const [shelterTimesLoading, setShelterTimesLoading] = useState(true);
    const [completedWalks, setCompletedWalks] = useState([]);
    const [isLoadingCompletedWalks, setIsLoadingCompletedWalks] = useState(false);

    // State for default shelter hours
    const [defaultShelterTimes, setDefaultShelterTimes] = useState([]);
    const [specificShelterTimes, setSpecificShelterTimes] = useState([]);
    const [defaultDayOfWeek, setDefaultDayOfWeek] = useState("");
    const [defaultStartTime, setDefaultStartTime] = useState("");
    const [defaultEndTime, setDefaultEndTime] = useState("");
    const [defaultIsClosed, setDefaultIsClosed] = useState(false);

    // Tab state for shelter hours configuration
    const [shelterConfigTab, setShelterConfigTab] = useState('default');

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser(decodedToken);
            } catch (error) {
                console.error("Failed to decode token:", error);
            }
        }
    }, [token]);

    // Fetch user's completed walks
    const fetchCompletedWalks = async (userId) => {
        if (!userId) return;

        setIsLoadingCompletedWalks(true);
        try {
            const response = await axios.get(`https://p-40-underdog-project-backend.onrender.com/walks/logs`);

            // Filter walk logs for the current user - only include walks that have been explicitly marked as completed or incomplete
            const userCompletedWalks = response.data.filter(walkLog =>
                walkLog.userId?._id === userId &&
                (walkLog.status === 'completed' || walkLog.status === 'incomplete')
            );

            console.log('Completed walks:', userCompletedWalks);
            setCompletedWalks(userCompletedWalks);
        } catch (error) {
            console.error("Error fetching completed walks:", error);
        } finally {
            setIsLoadingCompletedWalks(false);
        }
    };

    // Check if a user has already completed a walk at this time slot
    const hasCompletedWalkAtTimeSlot = (date, time) => {
        if (!completedWalks.length) return false;

        return completedWalks.some(walk =>
            walk.date === date &&
            walk.time === time &&
            (walk.status === 'completed' || walk.status === 'incomplete')
        );
    };

    // Fetch user's scheduled walks
    const [scheduledUserWalks, setScheduledUserWalks] = useState([]);

    const fetchUserScheduledWalks = async (userId) => {
        if (!userId) return;

        try {
            const response = await axios.get(`https://p-40-underdog-project-backend.onrender.com/users/profile/${userId}`);
            if (response.data && response.data.walks) {
                setScheduledUserWalks(response.data.walks);
            }
        } catch (error) {
            console.error("Error fetching user's scheduled walks:", error);
        }
    };

    // Check if a user already has a scheduled walk at this time slot
    const hasScheduledWalkAtTimeSlot = (date, time) => {
        if (!scheduledUserWalks.length) return false;

        return scheduledUserWalks.some(walk => walk.date === date && walk.time === time);
    };

    // Combined check for both completed and scheduled walks
    const isWalkAlreadyTaken = (date, time) => {
        const isScheduled = hasScheduledWalkAtTimeSlot(date, time);
        const isCompleted = hasCompletedWalkAtTimeSlot(date, time);
        console.log(`Walk ${date} at ${time}: isScheduled=${isScheduled}, isCompleted=${isCompleted}`);
        return isScheduled || isCompleted;
    };

    useEffect(() => {
        if (user?.id) {
            fetchCompletedWalks(user.id);
            fetchUserScheduledWalks(user.id);
        }
    }, [user]);

    const handleSelectWalk = async (walkId, timeSlot) => {
        try {
            // Check waiver status
            const waiverResponse = await axios.get(`https://p-40-underdog-project-backend.onrender.com/users/profile/${user.id}`);
            if (!waiverResponse.data.waiverSigned) {
                alert("You must sign the waiver before scheduling a walk.");
                navigate("/waiver");
                return;
            }

            // Check if user has already completed or scheduled a walk at this time slot
            const walk = availableTimesData.find(w => w._id === walkId);
            if (walk && isWalkAlreadyTaken(walk.date, timeSlot)) {
                toast.error("You already have a walk scheduled or completed at this time slot. Please select a different time.");
                return;
            }

            // Optimistically update the UI before the API call
            // Create a copy of the available times data
            const updatedAvailableTimesData = availableTimesData.map(w => {
                if (w._id === walkId) {
                    // Create a copy of the walk object
                    const updatedWalk = { ...w };

                    // Find the time slot in the timeSlots array
                    if (updatedWalk.timeSlots && updatedWalk.timeSlots.length > 0) {
                        const timeSlotObj = updatedWalk.timeSlots.find(ts => ts.time === timeSlot);
                        if (timeSlotObj) {
                            // Increment the booking count
                            timeSlotObj.bookedCount += 1;

                            // Update the timeSlotAvailability object
                            if (updatedWalk.timeSlotAvailability && updatedWalk.timeSlotAvailability[timeSlot]) {
                                updatedWalk.timeSlotAvailability[timeSlot].bookedCount += 1;

                                // Check if the time slot is now fully booked
                                const isFullyBooked = timeSlotObj.bookedCount >= timeSlotObj.maxBookings;
                                updatedWalk.timeSlotAvailability[timeSlot].isAvailable = !isFullyBooked;

                                // If fully booked, remove from available times
                                if (isFullyBooked && updatedWalk.availableTimes) {
                                    updatedWalk.availableTimes = updatedWalk.availableTimes.filter(t => t !== timeSlot);
                                }
                            }
                        }
                    }

                    return updatedWalk;
                }
                return w;
            });

            // Update the state with the optimistically updated data
            setAvailableTimesData(updatedAvailableTimesData);

            // Update the filtered walks if we're on the selected date
            if (selectedDate) {
                const updatedWalksForDate = updatedAvailableTimesData.filter(walk => walk.date === selectedDate);
                setFilteredWalks(updatedWalksForDate);
            }

            // Proceed to select the walk if waiver is signed
            await axios.post(`https://p-40-underdog-project-backend.onrender.com/walks/select-walk/${walkId}`, {
                userId: user.id,
                timeSlot,
            });

            // After successful API call, fetch the updated available times to ensure data consistency
            const updatedTimesResponse = await axios.get("https://p-40-underdog-project-backend.onrender.com/walks/available-times");
            const updatedTimes = updatedTimesResponse.data;
            console.log('Updated available times:', updatedTimes);
            setAvailableTimesData(updatedTimes);

            // Update the filtered walks again with the server data
            // if (selectedDate) {
            //     const updatedWalksForDate = updatedTimes.filter(walk => walk.date === selectedDate);
            //     setFilteredWalks(updatedWalksForDate);
            // }

            // Refresh the user's completed walks to include this new scheduled walk
            if (user?.id) {
                fetchCompletedWalks(user.id);
                fetchUserScheduledWalks(user.id);
            }

            // Show a more prominent success message
            toast.success("Walk successfully scheduled!", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
            });
        } catch (error) {
            console.error("Error selecting walk:", error);

            // Revert the optimistic update by fetching the actual data
            fetchTimeSlotAvailability();

            if (error.response && error.response.data && error.response.data.error) {
                // Display the specific error message from the server
                toast.error(`Failed to select walk: ${error.response.data.error}`);
            } else {
                toast.error("Failed to select walk.");
            }
        }
    };

    // Fetch slot availability information for each time slot
    const fetchTimeSlotAvailability = async () => {
        try {
            // Clear existing events first to prevent duplicates
            setEvents([]);

            const response = await axios.get("https://p-40-underdog-project-backend.onrender.com/walks/available-times");
            const walks = response.data;

            // Process the walks data to include availability information
            const todayStr = normalizeDateString(new Date());
            const enhancedWalks = walks
                .filter(walk => normalizeDateString(walk.date) >= todayStr)
                .map(walk => {
                // If the walk doesn't have timeSlots array, create default values
                if (!walk.timeSlots || walk.timeSlots.length === 0) {
                    return {
                        ...walk,
                        timeSlotAvailability: walk.availableTimes.reduce((acc, time) => {
                            acc[time] = {
                                bookedCount: 0,
                                maxBookings: 4,
                                isAvailable: true
                            };
                            return acc;
                        }, {})
                    };
                }

                // Create a mapping of time slots to their availability
                const timeSlotAvailability = {};
                walk.timeSlots.forEach(slot => {
                    // Check if the slot is permanently removed
                    const isPermanentlyRemoved = slot.permanentlyRemoved ||
                        (walk.permanentlyRemovedTimeSlots && walk.permanentlyRemovedTimeSlots.includes(slot.time));

                    timeSlotAvailability[slot.time] = {
                        bookedCount: slot.bookedCount,
                        maxBookings: slot.maxBookings,
                        isAvailable: !isPermanentlyRemoved && slot.bookedCount < slot.maxBookings,
                        isPermanentlyRemoved: isPermanentlyRemoved
                    };
                });

                return {
                    ...walk,
                    timeSlotAvailability
                };
            });

            setAvailableTimesData(enhancedWalks);

            // Highlight dates with available walks
            const availableTimeEvents = enhancedWalks.map((walk) => ({
                date: walk.date,
                display: 'background',
                className: 'has-available-time'
            }));

            setEvents(availableTimeEvents);

            // Re-filter walks for selected date if a date is already selected
            if (selectedDate) {
                const walksForDate = enhancedWalks.filter((walk) => walk.date === selectedDate);
                setFilteredWalks(walksForDate);
            }

            return enhancedWalks;
        } catch (error) {
            console.error("Error fetching available times:", error);
            return [];
        }
    };

    const fetchShelterTimes = async () => {
        try {
          // First, get all specific date shelter times
          const specificResponse = await axios.get("https://p-40-underdog-project-backend.onrender.com/shelter-times", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });

          // Then, get default shelter times
          const defaultsResponse = await axios.get("https://p-40-underdog-project-backend.onrender.com/shelter-times/defaults", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
          });

          // Process the specific shelter times to ensure dates are normalized
          const todayStr = normalizeDateString(new Date());
          const processedSpecificTimes = specificResponse.data
              .filter(time => !time.isDefault) // Filter out any default times that might be in the response
              .map(time => {
                  const normalizedDate = normalizeDateString(time.date);
                  return {
                      ...time,
                      originalDate: time.date,
                      normalizedDate: normalizedDate
                  };
              })
              .filter(time => time.normalizedDate >= todayStr);

          // Process default times
          const defaultTimes = defaultsResponse.data;

          console.log('Fetched specific shelter times:', processedSpecificTimes.length);
          console.log('Fetched default shelter times:', defaultTimes.length);

          // Combine both types of shelter times
          const combinedTimes = [...processedSpecificTimes];

          // For the next 30 days, check if we need to add default times
          const today = new Date();
          for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            const normalizedDateStr = normalizeDateString(dateStr);

            // Skip if we already have a specific time for this date
            if (processedSpecificTimes.some(time => time.normalizedDate === normalizedDateStr)) {
              continue;
            }

            // Get the day of week (0 = Sunday, 1 = Monday, etc.)
            const dayOfWeek = date.getDay();

            // Find the default time for this day of week
            const defaultTime = defaultTimes.find(time => time.dayOfWeek === dayOfWeek);

            if (defaultTime) {
              // Create a virtual shelter time entry based on the default
              combinedTimes.push({
                _id: `default-${dateStr}`, // Virtual ID
                date: dateStr,
                normalizedDate: normalizedDateStr,
                startTime: defaultTime.startTime,
                endTime: defaultTime.endTime,
                isDefault: false, // Mark as false so it's treated like a regular entry
                isVirtualDefault: true, // But add this flag to know it's derived from a default
                isClosed: defaultTime.isClosed,
                dayOfWeek: dayOfWeek
              });
            }
          }

          console.log('Combined shelter times (specific + defaults):', combinedTimes.length);

          // Set the combined times for general use
          setShelterTimes(combinedTimes);

          // Also set separate lists for the admin interface
          setDefaultShelterTimes(defaultTimes);
          setSpecificShelterTimes(processedSpecificTimes);

          setShelterTimesLoading(false);
        } catch (error) {
          console.error("Error fetching shelter times:", error);
          toast.error("Failed to load shelter hours");
          setShelterTimesLoading(false);
        }
    };

    useEffect(() => {
        fetchTimeSlotAvailability();
        fetchShelterTimes();

        // Listen for refresh events from other components
        const handleRefreshAvailableTimes = (event) => {
            console.log('Received refreshAvailableTimes event:', event.detail);
            fetchTimeSlotAvailability();
        };

        window.addEventListener('refreshAvailableTimes', handleRefreshAvailableTimes);

        return () => {
            window.removeEventListener('refreshAvailableTimes', handleRefreshAvailableTimes);
        };
    }, []);

    const handleDateClick = (arg) => {
        const selected = arg.dateStr;
        const normalizedDate = normalizeDateString(selected);

        console.log('Date clicked:', selected, 'normalized:', normalizedDate);

        // Check if the selected date is in the past using our utility function
        if (isDateInPast(selected)) {
            toast.warning("You've selected a date in the past. No walks will be available.");
        }

        // Check if there are shelter hours for this date using the normalized date field
        // Try both the normalized date and the original date for maximum compatibility
        let matchingShelterTime = shelterTimes.find(st => st.normalizedDate === normalizedDate);

        if (!matchingShelterTime) {
            // Try finding by original date as a fallback
            matchingShelterTime = shelterTimes.find(st => normalizeDateString(st.date) === normalizedDate);

            if (matchingShelterTime) {
                console.log('Found shelter time using date normalization fallback:', matchingShelterTime);
            }
        }

        const hasShelterHours = !!matchingShelterTime;

        console.log('Shelter hours check:', {
            hasShelterHours,
            matchingShelterTime,
            allShelterTimes: shelterTimes.map(st => ({
                date: st.date,
                normalized: st.normalizedDate
            }))
        });

        if (user?.role === 'Marshall' && !hasShelterHours) {
            toast.warning("No shelter hours set for this date. Please contact admin to set shelter hours first.");
        } else if (user?.role === 'Marshall' && hasShelterHours) {
            toast.success(`Shelter hours for ${selected}: ${formatTimeForDisplay(matchingShelterTime.startTime)} to ${formatTimeForDisplay(matchingShelterTime.endTime)}`);
        }

        setSelectedDate(selected);
        // Filter walks based on the selected date
        const walksForDate = availableTimesData.filter((walk) => normalizeDateString(walk.date) === normalizedDate);
        console.log('Filtered walks for date:', walksForDate);
        setFilteredWalks(walksForDate);
        setAvailableDate(selected); // Auto-set the form date field
    };

    const handleAvailableTimeSubmit = async (e) => {
        e.preventDefault();

        // Check if the selected time is within shelter hours
        if (user?.role === 'Marshall' && !isWithinShelterHours(availableDate, availableTime)) {
            toast.error("You can only schedule walks during shelter hours for this date");
            return;
        }

        if (!availableDate || !availableTime) {
            toast.error("Please fill in both date and time fields.");
            return;
        }

        try {
            await axios.post("https://p-40-underdog-project-backend.onrender.com/walks/add-time", {
                marshall: user.id,
                date: availableDate,
                time: availableTime,
            });

            toast.success("Available time added successfully!");

            // Re-fetch available times to ensure marshall's details are updated
            await fetchTimeSlotAvailability();
            setAvailableDate("");
            setAvailableTime("");
        } catch (error) {
            console.error("Error adding available time:", error);

            // Display more specific error message from the server if available
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(`Failed to add time: ${error.response.data.error}`);
            } else {
                toast.error("Failed to add available time. Please try again.");
            }
        }
    };

    const handleEditTime = (walk, timeSlot) => {
        const newTime = prompt("Enter new time:", timeSlot);
        if (newTime && newTime !== timeSlot) {
            axios.put(`https://p-40-underdog-project-backend.onrender.com/walks/update-time/${walk._id}`, {
                oldTime: timeSlot,
                newTime: newTime
            })
            .then(() => {
                alert("Time updated successfully!");
                fetchTimeSlotAvailability();
            })
            .catch(error => {
                console.error("Error updating time:", error);
                alert("Failed to update time.");
            });
        }
    };

    const handleDeleteTime = async (walkId, timeSlot) => {
        const confirmDelete = window.confirm("Are you sure you want to delete this time?");
        if (confirmDelete) {
            try {
                await axios.delete(`https://p-40-underdog-project-backend.onrender.com/walks/delete-time/${walkId}`, {
                    data: { time: timeSlot }
                });
                alert("Time deleted successfully!");
                fetchTimeSlotAvailability();
            } catch (error) {
                console.error("Error deleting time:", error);
                alert("Failed to delete time.");
            }
        }
    };

    const handleShelterTimeSubmit = async (e) => {
        e.preventDefault();

        if (!shelterDate || (!shelterIsClosed && (!shelterStartTime || !shelterEndTime))) {
          toast.error("Please fill in all shelter time fields");
          return;
        }

        // Validate start time is before end time if not closed
        if (!shelterIsClosed && shelterStartTime >= shelterEndTime) {
          toast.error("Start time must be before end time");
          return;
        }

        try {
          await axios.post(
            "https://p-40-underdog-project-backend.onrender.com/shelter-times",
            {
              date: shelterDate,
              startTime: shelterIsClosed ? "00:00" : shelterStartTime,
              endTime: shelterIsClosed ? "00:00" : shelterEndTime,
              createdBy: user?.id,
              isClosed: shelterIsClosed
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }
          );

          toast.success("Shelter hours added successfully");
          fetchShelterTimes();

          // Reset form
          setShelterDate("");
          setShelterStartTime("");
          setShelterEndTime("");
          setShelterIsClosed(false);
        } catch (error) {
          console.error("Error adding shelter time:", error);
          if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Failed to add shelter hours");
          }
        }
    };

    const handleDefaultShelterTimeSubmit = async (e) => {
        e.preventDefault();

        if (defaultDayOfWeek === "" || (!defaultIsClosed && (!defaultStartTime || !defaultEndTime))) {
          toast.error("Please fill in all default shelter time fields");
          return;
        }

        // Validate start time is before end time if not closed
        if (!defaultIsClosed && defaultStartTime >= defaultEndTime) {
          toast.error("Start time must be before end time");
          return;
        }

        try {
          await axios.post(
            "https://p-40-underdog-project-backend.onrender.com/shelter-times/defaults",
            {
              dayOfWeek: defaultDayOfWeek,
              startTime: defaultIsClosed ? "00:00" : defaultStartTime,
              endTime: defaultIsClosed ? "00:00" : defaultEndTime,
              createdBy: user?.id,
              isClosed: defaultIsClosed
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }
          );

          toast.success("Default shelter hours set successfully");
          fetchShelterTimes();

          // Reset form
          setDefaultDayOfWeek("");
          setDefaultStartTime("");
          setDefaultEndTime("");
          setDefaultIsClosed(false);
        } catch (error) {
          console.error("Error setting default shelter time:", error);
          if (error.response && error.response.data && error.response.data.message) {
            toast.error(error.response.data.message);
          } else {
            toast.error("Failed to set default shelter hours");
          }
        }
    };

    const handleInitializeDefaultHours = async () => {
        if (!window.confirm("This will set up default shelter hours (10AM-3PM Monday-Friday, closed on weekends). Continue?")) {
          return;
        }

        try {
          await axios.post(
            "https://p-40-underdog-project-backend.onrender.com/shelter-times/initialize-defaults",
            {
              createdBy: user?.id
            },
            {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            }
          );

          toast.success("Default shelter hours initialized successfully");
          fetchShelterTimes();
        } catch (error) {
          console.error("Error initializing default shelter hours:", error);
          toast.error("Failed to initialize default shelter hours");
        }
    };

    const handleDeleteShelterTime = async (id) => {
        if (window.confirm("Are you sure you want to delete these shelter hours?")) {
          try {
            await axios.delete(`https://p-40-underdog-project-backend.onrender.com/shelter-times/${id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            toast.success("Shelter hours deleted");
            fetchShelterTimes();
          } catch (error) {
            console.error("Error deleting shelter time:", error);
            toast.error("Failed to delete shelter hours");
          }
        }
    };

    const isWithinShelterHours = (date, time) => {
        if (!date || !time) return false;

        // Normalize the date for consistent comparison
        const normalizedDate = normalizeDateString(date);

        console.log('Checking if time is within shelter hours:', { date, normalizedDate, time });

        // Debug: Log all shelter times to help diagnose the issue
        console.log('All shelter times:', shelterTimes.map(st => ({
            id: st._id,
            date: st.date,
            originalDate: st.originalDate,
            normalizedDate: st.normalizedDate,
            startTime: st.startTime,
            endTime: st.endTime
        })));

        // Find the shelter time for this date using the normalized date field
        // Try both the normalized date and the original date for maximum compatibility
        let shelterTime = shelterTimes.find(st => st.normalizedDate === normalizedDate);

        if (!shelterTime) {
            // Try finding by original date as a fallback
            shelterTime = shelterTimes.find(st => normalizeDateString(st.date) === normalizedDate);
        }

        // If no shelter time is set for this date, return false
        if (!shelterTime) {
            console.log(`No shelter time found for date: ${date} (normalized: ${normalizedDate})`);
            return false;
        }

        console.log('Found shelter time:', shelterTime);

        // Convert all times to minutes since midnight for easier comparison
        const [timeHours, timeMinutes] = time.split(':').map(Number);
        const timeValue = (timeHours * 60) + timeMinutes;

        const [startHours, startMinutes] = shelterTime.startTime.split(':').map(Number);
        const startValue = (startHours * 60) + startMinutes;

        const [endHours, endMinutes] = shelterTime.endTime.split(':').map(Number);
        const endValue = (endHours * 60) + endMinutes;

        const isWithinRange = timeValue >= startValue && timeValue <= endValue;

        console.log('Time comparison:', {
            timeValue,
            startValue,
            endValue,
            isWithinRange
        });

        // Check if the time is within the shelter time range
        return isWithinRange;
    };

    // Function to generate time slots at 30-minute intervals within shelter hours
    const generateTimeOptions = (date) => {
        if (!date) return [];

        // Normalize the date for consistent comparison
        let normalizedDate = normalizeDateString(date);
        // Just for debugging purposes - trying to see what happens with date + 1
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextDayNormalized = normalizeDateString(nextDay.toISOString().split('T')[0]);
        console.log('Current date:', date, 'Next day:', nextDay.toISOString().split('T')[0]);
        normalizedDate = nextDayNormalized;

        // Debug: Log all shelter times and the date we're looking for
        console.log('Looking for shelter time for date:', date, 'normalized:', normalizedDate);

        let shelterTime = shelterTimes.find(st =>
            normalizeDateString(st.normalizedDate) === normalizedDate ||
            normalizeDateString(st.date) === normalizedDate
        );

        if (!shelterTime) {
            console.log(`No shelter time found for date: ${date} (normalized: ${normalizedDate})`);
            return [];
        }

        console.log('Found shelter time:', shelterTime);

        const { startTime, endTime } = shelterTime;
        const options = [];

        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        // Convert to minutes since midnight for easier manipulation
        const startMinutes = (startHour * 60) + startMinute;
        const endMinutes = (endHour * 60) + endMinute;

        // Generate time slots at 30-minute intervals
        let currentMinutes = startMinutes;

        // Check if we need to skip past times for today
        const inputDate = parseISO(date);
        const isToday = isTodayFns(inputDate);

        if (isToday) {
            const now = new Date();
            const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
            const roundedCurrentTime = Math.ceil((currentTimeMinutes + 5) / 30) * 30;
            currentMinutes = Math.max(currentMinutes, roundedCurrentTime);
            if (currentMinutes > endMinutes) {
                console.log('Current time is past shelter end time, no time options available for today.');
                return [];
            }
        }

        while (currentMinutes <= endMinutes) {
            const hours = Math.floor(currentMinutes / 60).toString().padStart(2, '0');
            const minutes = (currentMinutes % 60).toString().padStart(2, '0');
            options.push(`${hours}:${minutes}`);

            // Add 30 minutes
            currentMinutes += 30;
        }

        console.log('Generated time options:', options);
        return options;
    };

    // We're now using the imported formatTimeForDisplay function from dateUtils

    // Generate 30-minute interval options for shelter hours
    const generate30MinTimeOptions = () => {
        const options = [];
        for (let i = 0; i < 24 * 60; i += 30) {
            const hours = String(Math.floor(i / 60)).padStart(2, '0');
            const minutes = String(i % 60).padStart(2, '0');
            options.push(`${hours}:${minutes}`);
        }
        return options;
    };

    // Enhanced dropdown scrollable time picker component
    const EnhancedTimePicker = ({ value, onChange, options, placeholder, disabled }) => {
        const [isOpen, setIsOpen] = useState(false);
        const dropdownRef = useRef(null);
        const scrollContainerRef = useRef(null);
        const optionRefs = useRef({});
        console.log("time options:", options);

        // Debug: Log the options being passed to the component
        useEffect(() => {
            console.log('EnhancedTimePicker options:', options);
        }, [options]);

        // Close dropdown when clicking outside
        useEffect(() => {
            const handleClickOutside = (event) => {
                if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            };

            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }, []);

        // Scroll to selected value when dropdown opens
        useEffect(() => {
            if (isOpen && value && scrollContainerRef.current && optionRefs.current[value]) {
                const scrollContainer = scrollContainerRef.current;
                const optionElement = optionRefs.current[value];

                // Calculate position to center the selected item
                const scrollTop = optionElement.offsetTop -
                    (scrollContainer.clientHeight / 2) +
                    (optionElement.offsetHeight / 2);

                scrollContainer.scrollTop = scrollTop;
            }
        }, [isOpen, value]);

        // Toggle dropdown
        const toggleDropdown = () => {
            if (!disabled) {
                setIsOpen(!isOpen);
            }
        };

        // Handle option selection
        const handleSelect = (option) => {
            onChange({ target: { value: option } });
            setIsOpen(false);
        };

        return (
            <div ref={dropdownRef} className="relative w-full">
                {/* Selected value display / dropdown trigger */}
                <div
                    onClick={toggleDropdown}
                    className={`
                        w-full px-4 py-2 rounded-md border flex justify-between items-center cursor-pointer
                        ${disabled
                            ? 'bg-gray-100 text-gray-500 border-gray-300'
                            : 'bg-white text-gray-800 border-gray-300 hover:border-blue-400'}
                        ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
                    `}
                >
                    <span className={!value ? 'text-gray-500' : ''}>
                        {value ? formatTimeForDisplay(value) : placeholder || "Select time"}
                    </span>
                    <svg
                        className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </div>

                {/* Dropdown menu */}
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                    <div
                        ref={scrollContainerRef}
                        className="max-h-60 overflow-y-auto py-1 scrollbar-thin"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {options.length > 0 ? (
                            options.map((option) => (
                                <div
                                    key={option}
                                    ref={(el) => optionRefs.current[option] = el}
                                    className={`
                                        px-4 py-2 cursor-pointer text-sm hover:bg-blue-50
                                        ${value === option ? 'bg-blue-100 font-medium' : ''}
                                    `}
                                    onClick={() => handleSelect(option)}
                                >
                                    {formatTimeForDisplay(option)}
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                                No times available
                            </div>
                        )}
                    </div>
                    </div>
                )}

                {/* Custom scrollbar styling */}
                <style jsx>{`
                    .scrollbar-thin::-webkit-scrollbar {
                        width: 6px;
                    }

                    .scrollbar-thin::-webkit-scrollbar-track {
                        background: #f1f1f1;
                        border-radius: 3px;
                    }

                    .scrollbar-thin::-webkit-scrollbar-thumb {
                        background: #c1c1c1;
                        border-radius: 3px;
                    }

                    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
                        background: #a1a1a1;
                    }
                `}</style>
            </div>
        );
    };

    // Render the time slot cards with visual indicators for completed walks
    const renderTimeSlotCards = () => {
        return filteredWalks.map((walk, index) =>
            walk.availableTimes.map((timeSlot, idx) => {
                // Get availability info for this time slot
                const slotInfo = walk.timeSlotAvailability && walk.timeSlotAvailability[timeSlot];
                const bookedCount = slotInfo ? slotInfo.bookedCount : 0;
                const maxBookings = slotInfo ? slotInfo.maxBookings : 4;
                const isFullyBooked = bookedCount >= maxBookings;
                const availableSlots = maxBookings - bookedCount;

                // Check if the user has already completed or scheduled a walk at this time
                const alreadyTakenWalk = isWalkAlreadyTaken(walk.date, timeSlot);

                // Check if the time slot is permanently removed
                const isPermanentlyRemoved = walk.permanentlyRemovedTimeSlots &&
                    walk.permanentlyRemovedTimeSlots.includes(timeSlot);

                // Determine card style and status based on conditions
                let cardStyle, statusBadge, progressColor, buttonStyle, buttonText, buttonIcon;

                if (isFullyBooked || isPermanentlyRemoved) {
                    // Fully booked or permanently removed slots
                    cardStyle = "bg-red-50 border-red-200 border-2";
                    statusBadge = (
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                </svg>
                                Fully Booked
                            </span>
                        </div>
                    );
                    progressColor = "bg-red-500";
                    buttonStyle = "bg-gray-400 cursor-not-allowed text-white";
                    buttonText = "Fully Booked";
                    buttonIcon = (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                        </svg>
                    );
                } else if (alreadyTakenWalk) {
                    // Already scheduled walks
                    cardStyle = "bg-blue-50 border-blue-200 border-2";
                    statusBadge = (
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Your Walk
                            </span>
                        </div>
                    );
                    progressColor = "bg-blue-500";
                    buttonStyle = "bg-blue-400 cursor-not-allowed text-white";
                    buttonText = "Already Scheduled";
                    buttonIcon = (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    );
                } else {
                    // Available slots
                    cardStyle = "bg-white border-green-200 border hover:border-green-300 hover:shadow-lg transition-all duration-200";
                    statusBadge = availableSlots <= 1 ? (
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Last Spot
                            </span>
                        </div>
                    ) : (
                        <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Available
                            </span>
                        </div>
                    );
                    progressColor = availableSlots <= 1 ? "bg-yellow-500" : "bg-green-500";
                    buttonStyle = "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow transition-all duration-200";
                    buttonText = "Select";
                    buttonIcon = (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    );
                }

                return (
                <div
                    key={`${index}-${idx}`}
                    className={`${cardStyle} shadow-md rounded-lg p-6 border relative flex flex-col justify-between`}
                >
                    {statusBadge}

                    <div className="mt-2">
                        {/* Date and Time Section */}
                        <div className="flex items-center mb-3">
                            <div className="bg-indigo-100 p-2 rounded-full mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Date & Time</h3>
                                <p className="text-base font-semibold text-gray-800">{walk.date}, {formatTimeForDisplay(timeSlot)}</p>
                            </div>
                        </div>

                        {/* Marshall Section */}
                        <div className="flex items-center mb-4">
                            <div className="bg-purple-100 p-2 rounded-full mr-3">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Marshall</h3>
                                <p className="text-base font-semibold text-gray-800">{walk.marshall?.firstName || "Unknown"}</p>
                            </div>
                        </div>

                        {/* Booking Capacity Section */}
                        <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">Booking Capacity</span>
                                <span className={`text-sm font-bold ${isFullyBooked || isPermanentlyRemoved ? 'text-red-600' : alreadyTakenWalk ? 'text-blue-600' : availableSlots <= 1 ? 'text-yellow-600' : 'text-green-600'}`}>
                                    {isPermanentlyRemoved ? '0' : availableSlots} of {maxBookings} spots left
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`${progressColor} h-2.5 rounded-full transition-all duration-300`}
                                    style={{ width: `${isPermanentlyRemoved ? 100 : (bookedCount / maxBookings) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-2">
                        {user?.id !== walk.marshall?._id && (
                            <button
                                className={`w-full flex justify-center items-center px-4 py-2.5 rounded-md text-sm font-medium ${buttonStyle}`}
                                onClick={() => !isFullyBooked && !isPermanentlyRemoved && !alreadyTakenWalk && handleSelectWalk(walk._id, timeSlot)}
                                disabled={isFullyBooked || isPermanentlyRemoved || alreadyTakenWalk}
                            >
                                {buttonIcon}
                                {buttonText}
                            </button>
                        )}
                        {user?.id === walk.marshall?._id && (
                            <div className="flex gap-2">
                                <button
                                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
                                    onClick={() => handleEditTime(walk, timeSlot)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                    Edit
                                </button>
                                <button
                                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium shadow-sm hover:shadow transition-all duration-200"
                                    onClick={() => handleDeleteTime(walk._id, timeSlot)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    Delete
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )})
        );
    };

    return (
        <div>
            <h1 className="calendar-title" style={{ textAlign: "center", margin: "20px 0" }}>Walk Scheduling Calendar</h1>
            <div className="calendar-container">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    selectable={true}
                    dateClick={handleDateClick}
                    events={events}
                    height="auto"
                selectAllow={({ start }) => {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    return start >= today;
                }}
                dayCellClassNames={(arg) => {
                    const now = new Date();
                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    const date = arg.date;
                    if (date < today) {
                        return ['fc-day-disabled'];
                    }
                    return [];
                }}
                />
                {user?.role === "Marshall" && (
                    <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden border border-indigo-100">
                        {/* Header */}
                        <div className="bg-indigo-600 px-6 py-4">
                            <h2 className="text-xl font-bold text-white">Add Available Walk Time</h2>
                            <p className="text-indigo-100 mt-1 text-sm">Schedule times when you're available to walk dogs</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Form */}
                                <div className="bg-white rounded-lg border border-gray-200 p-5">
                                    <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586l-1.707 1.707a1 1 0 00 1.414 1.414l2-2a1 1 0 00.293-.707V7a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Schedule New Time Slot
                                    </h3>
                                    <form onSubmit={handleAvailableTimeSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                            <input
                                                type="date"
                                                value={availableDate}
                                                onChange={(e) => {
                                                    const newDate = e.target.value;
                                                    console.log('Date input changed:', newDate);
                                                    setAvailableDate(newDate);
                                                    setAvailableTime(''); // Reset time when date changes

                                                    // Debug: Check if shelter hours exist for this date
                                                    const normalizedNewDate = normalizeDateString(newDate);
                                                    const hasShelterHours = shelterTimes.some(st => st.normalizedDate === normalizedNewDate);
                                                    console.log('Has shelter hours for selected date:', hasShelterHours);

                                                    // Generate time options for debugging
                                                    const timeOptions = generateTimeOptions(newDate);
                                                    console.log('Generated time options for new date:', timeOptions);
                                                }}
                                                required
                                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                            {availableDate ? (
                                                <EnhancedTimePicker
                                                    value={availableTime}
                                                    onChange={(e) => setAvailableTime(e.target.value)}
                                                    options={generateTimeOptions(availableDate)}
                                                    placeholder="Select Time"
                                                    disabled={!availableDate}
                                                />
                                            ) : (
                                                <div className="relative w-full">
                                                    <div className="w-full px-4 py-2 rounded-md border bg-gray-100 text-gray-500 border-gray-300 flex justify-between items-center">
                                                        <span className="text-gray-500">Select a date first</span>
                                                        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="pt-3">
                                            <button
                                                type="submit"
                                                className={`w-full px-4 py-2 text-white rounded-md shadow-sm transition-all duration-200 ${!availableDate || !availableTime ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                                disabled={!availableDate || !availableTime}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                Add Time Slot
                                            </button>
                                        </div>
                                    </form>
                                </div>

                                {/* Shelter Hours Info */}
                                <div className="bg-blue-50 rounded-lg border border-blue-100 p-5">
                                    <h3 className="text-lg font-medium text-blue-800 mb-4 flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                        </svg>
                                        Available Shelter Hours
                                    </h3>
                                    {shelterTimesLoading ? (
                                        <div className="flex justify-center items-center p-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                            <span className="ml-2 text-blue-600">Loading hours...</span>
                                        </div>
                                    ) : shelterTimes.length === 0 ? (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-red-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-red-800">No shelter hours available</p>
                                            <p className="text-red-600 text-sm mt-1">Please contact an administrator to set up shelter hours</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                            {shelterTimes.map(time => {
                                                const isSelectedDate = selectedDate && normalizeDateString(selectedDate) === time.normalizedDate;
                                                return (
                                                    <div
                                                        key={time._id}
                                                        className={`p-3 rounded-md border ${isSelectedDate ? 'bg-blue-100 border-blue-300' : 'bg-white border-gray-200'}`}
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className={`font-medium ${isSelectedDate ? 'text-blue-800' : 'text-gray-700'}`}>{time.date}</span>
                                                            {isSelectedDate && (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                    Selected
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-1 text-sm text-gray-600">
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                            </svg>
                                                            {formatTimeForDisplay(time.startTime)} to {formatTimeForDisplay(time.endTime)}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                    <div className="mt-4 p-3 bg-blue-100 rounded-md border border-blue-200">
                                        <p className="text-sm text-blue-700 flex items-start">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                            </svg>
                                            <span>You can only schedule walks during these hours. The time slots you add will be available for users to book dog walks.</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                </div>
                {user?.role === "admin" && (
                    <div className="mt-8 bg-white shadow-lg rounded-lg overflow-hidden border border-indigo-100">
                        {/* Header */}
                        <div className="bg-indigo-600 px-6 py-4">
                            <h2 className="text-xl font-bold text-white">Set Shelter Hours</h2>
                            <p className="text-indigo-100 mt-1 text-sm">Define the time windows when marshalls can schedule dog walks</p>
                        </div>

                        {/* Tabs for specific dates vs default hours */}
                        <div className="bg-gray-100 border-b border-gray-200">
                            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
                                <li className="mr-2">
                                    <button
                                        className={`inline-block p-4 rounded-t-lg ${shelterConfigTab === 'specific' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'}`}
                                        onClick={() => setShelterConfigTab('specific')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                        </svg>
                                        Specific Dates
                                    </button>
                                </li>
                                <li className="mr-2">
                                    <button
                                        className={`inline-block p-4 rounded-t-lg ${shelterConfigTab === 'default' ? 'border-b-2 border-indigo-600 text-indigo-600 bg-white' : 'border-b-2 border-transparent hover:text-gray-600 hover:border-gray-300'}`}
                                        onClick={() => setShelterConfigTab('default')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block mr-1" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                        </svg>
                                        Default Hours
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            {/* Specific Date Form */}
                            {shelterConfigTab === 'specific' && (
                                <div>
                                    {/* Custom Date Form */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Set Hours for Specific Date</h3>
                                        <form onSubmit={handleShelterTimeSubmit} className="space-y-5">
                                            {/* Closed Day Toggle */}
                                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                                                <label htmlFor="shelterIsClosed" className="font-medium text-gray-700 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${shelterIsClosed ? 'text-red-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Shelter is closed on this date
                                                </label>
                                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                                                    <input
                                                        type="checkbox"
                                                        id="shelterIsClosed"
                                                        checked={shelterIsClosed}
                                                        onChange={(e) => setShelterIsClosed(e.target.checked)}
                                                        className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                                                    />
                                                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${shelterIsClosed ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                                    <div className={`absolute left-0 top-0 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out transform ${shelterIsClosed ? 'translate-x-6 border-red-500' : 'border-gray-300'} border-2`}></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        value={shelterDate}
                                                        onChange={(e) => setShelterDate(e.target.value)}
                                                        required
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                    />
                                                </div>
                                                <div className={shelterIsClosed ? 'opacity-50' : ''}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                                    <EnhancedTimePicker
                                                        value={shelterStartTime}
                                                        onChange={(e) => setShelterStartTime(e.target.value)}
                                                        options={generate30MinTimeOptions()}
                                                        placeholder="Select start time"
                                                        disabled={shelterIsClosed}
                                                    />
                                                </div>
                                                <div className={shelterIsClosed || !shelterStartTime ? 'opacity-50' : ''}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                                    <EnhancedTimePicker
                                                        value={shelterEndTime}
                                                        onChange={(e) => setShelterEndTime(e.target.value)}
                                                        options={generate30MinTimeOptions().filter(time => time > shelterStartTime)}
                                                        placeholder="Select end time"
                                                        disabled={!shelterStartTime || shelterIsClosed}
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-3">
                                                <button
                                                    type="submit"
                                                    className={`w-full px-4 py-2 text-white rounded-md shadow-sm transition-all duration-200 ${!shelterDate || (!shelterIsClosed && (!shelterStartTime || !shelterEndTime)) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                                    disabled={!shelterDate || (!shelterIsClosed && (!shelterStartTime || !shelterEndTime))}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Save Date Settings
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Display Specific Date Hours */}
                                    <div className="mt-8">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                            </svg>
                                            Specific Date Schedule
                                        </h3>
                                        {shelterTimesLoading ? (
                                            <div className="flex justify-center items-center p-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                <span className="ml-2 text-indigo-600">Loading hours...</span>
                                            </div>
                                        ) : specificShelterTimes.length === 0 ? (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-yellow-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-yellow-800">No specific date hours have been set</p>
                                                <p className="text-yellow-600 text-sm mt-1">Use the form above to define hours for specific dates</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                                {specificShelterTimes.map(time => (
                                                    <div
                                                        key={time._id}
                                                        className={`flex justify-between items-center p-4 rounded-lg shadow-sm border ${time.isClosed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                                                    >
                                                        <div>
                                                            <span className="font-bold text-gray-800">{time.date}</span>
                                                            <div className="mt-1">
                                                                {time.isClosed ? (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                        Closed
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                        {formatTimeForDisplay(time.startTime)} - {formatTimeForDisplay(time.endTime)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleDeleteShelterTime(time._id)}
                                                            className="p-2 rounded-full hover:bg-white transition-colors duration-200"
                                                            title="Delete this schedule"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Default Hours Form */}
                            {shelterConfigTab === 'default' && (
                                <div>
                                    {/* Quick Action Button */}
                                    <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                                        <div>
                                            <h3 className="text-blue-800 font-medium">Quick Setup</h3>
                                            <p className="text-blue-600 text-sm mt-1">Set standard hours (10AM-3PM Monday-Friday, closed on weekends)</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleInitializeDefaultHours}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200 shadow-sm flex items-center"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                                            </svg>
                                            Initialize Default Hours
                                        </button>
                                    </div>

                                    {/* Custom Hours Form */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-5">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4">Custom Day Settings</h3>
                                        <form onSubmit={handleDefaultShelterTimeSubmit} className="space-y-5">
                                            {/* Closed Day Toggle */}
                                            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
                                                <label htmlFor="defaultIsClosed" className="font-medium text-gray-700 flex items-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${defaultIsClosed ? 'text-red-500' : 'text-gray-400'}`} viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                    </svg>
                                                    Shelter is closed on this day
                                                </label>
                                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out rounded-full">
                                                    <input
                                                        type="checkbox"
                                                        id="defaultIsClosed"
                                                        checked={defaultIsClosed}
                                                        onChange={(e) => setDefaultIsClosed(e.target.checked)}
                                                        className="absolute w-6 h-6 opacity-0 z-10 cursor-pointer"
                                                    />
                                                    <div className={`w-12 h-6 rounded-full transition-colors duration-200 ease-in-out ${defaultIsClosed ? 'bg-red-500' : 'bg-gray-300'}`}></div>
                                                    <div className={`absolute left-0 top-0 bg-white w-6 h-6 rounded-full transition-transform duration-200 ease-in-out transform ${defaultIsClosed ? 'translate-x-6 border-red-500' : 'border-gray-300'} border-2`}></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                                                    <select
                                                        value={defaultDayOfWeek}
                                                        onChange={(e) => setDefaultDayOfWeek(parseInt(e.target.value))}
                                                        required
                                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                                    >
                                                        <option value="">Select day</option>
                                                        <option value="0">Sunday</option>
                                                        <option value="1">Monday</option>
                                                        <option value="2">Tuesday</option>
                                                        <option value="3">Wednesday</option>
                                                        <option value="4">Thursday</option>
                                                        <option value="5">Friday</option>
                                                        <option value="6">Saturday</option>
                                                    </select>
                                                </div>
                                                <div className={defaultIsClosed ? 'opacity-50' : ''}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                                    <EnhancedTimePicker
                                                        value={defaultStartTime}
                                                        onChange={(e) => setDefaultStartTime(e.target.value)}
                                                        options={generate30MinTimeOptions()}
                                                        placeholder="Select start time"
                                                        disabled={defaultIsClosed}
                                                    />
                                                </div>
                                                <div className={defaultIsClosed || !defaultStartTime ? 'opacity-50' : ''}>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                                    <EnhancedTimePicker
                                                        value={defaultEndTime}
                                                        onChange={(e) => setDefaultEndTime(e.target.value)}
                                                        options={generate30MinTimeOptions().filter(time => time > defaultStartTime)}
                                                        placeholder="Select end time"
                                                        disabled={!defaultStartTime || defaultIsClosed}
                                                    />
                                                </div>
                                            </div>

                                            <div className="pt-3">
                                                <button
                                                    type="submit"
                                                    className={`w-full px-4 py-2 text-white rounded-md shadow-sm transition-all duration-200 ${defaultDayOfWeek === "" || (!defaultIsClosed && (!defaultStartTime || !defaultEndTime)) ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                                    disabled={defaultDayOfWeek === "" || (!defaultIsClosed && (!defaultStartTime || !defaultEndTime))}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block mr-2" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                    Save Day Settings
                                                </button>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Display Default Hours */}
                                    <div className="mt-8">
                                        <h3 className="text-lg font-medium text-gray-800 mb-4 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                            </svg>
                                            Current Schedule
                                        </h3>
                                        {shelterTimesLoading ? (
                                            <div className="flex justify-center items-center p-8">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                                <span className="ml-2 text-indigo-600">Loading hours...</span>
                                            </div>
                                        ) : defaultShelterTimes.length === 0 ? (
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-yellow-400 mb-2" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                </svg>
                                                <p className="text-yellow-800">No default hours have been set</p>
                                                <p className="text-yellow-600 text-sm mt-1">Use the form above or the quick setup button to define shelter hours</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
                                                {defaultShelterTimes.map(time => {
                                                    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                                    const dayName = dayNames[time.dayOfWeek];
                                                    return (
                                                        <div
                                                            key={time._id}
                                                            className={`flex justify-between items-center p-4 rounded-lg shadow-sm border ${time.isClosed ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}
                                                        >
                                                            <div>
                                                                <span className="font-bold text-gray-800">{dayName}</span>
                                                                <div className="mt-1">
                                                                    {time.isClosed ? (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
                                                                            </svg>
                                                                            Closed
                                                                        </span>
                                                                    ) : (
                                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                            </svg>
                                                                            {formatTimeForDisplay(time.startTime)} - {formatTimeForDisplay(time.endTime)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteShelterTime(time._id)}
                                                                className="p-2 rounded-full hover:bg-white transition-colors duration-200"
                                                                title="Delete this schedule"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500 hover:text-red-600" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {user?.totalWalks === 0 && !user?.waiverSigned && (
                    <div className="mt-4">
                        <p className="text-red-500 font-medium">You must sign the waiver before scheduling a walk.</p>
                        <button
                            onClick={() => navigate("/waiver")}
                            className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
                        >
                            Sign Waiver
                        </button>
                    </div>
                )}

                {/* If date is selected and no slots, show a message */}
                {selectedDate && filteredWalks.length === 0 && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-blue-800 text-center">
                            No available walk times for the selected date. Please select another date.
                        </p>
                    </div>
                )}

                <div className="mt-10 mb-16 px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoadingCompletedWalks ? (
                        <div className="col-span-full text-center py-8">
                            <p className="text-gray-600">Loading available walks...</p>
                        </div>
                    ) : renderTimeSlotCards()}
                </div>
        </div>
    );
};

export default Walk;
