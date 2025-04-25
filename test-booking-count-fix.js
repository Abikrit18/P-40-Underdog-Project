// Test script for Booking Count Fix

// This script tests the following scenarios:
// 1. The booking count is correctly calculated when booking walks
// 2. The available slots count is correctly displayed
// 3. The booking count is correctly updated when cancelling walks

const axios = require('axios');

// Configuration
const API_URL = 'https://p-40-underdog-project-backend.onrender.com';
let testMarshallId = null;
let testUserId = null;
let testWalkId = null;
let userWalkIds = [];
let testTimeSlot = '10:00';
let testDate = new Date();
testDate.setDate(testDate.getDate() + 1); // Tomorrow
const testDateStr = testDate.toISOString().split('T')[0];

// Test users (these should exist in your database)
const testUsers = [
  { email: 'user@example.com', password: 'password123' },
  { email: 'marshall@example.com', password: 'password123' }
];

// Helper function to login and get token
async function login(email, password) {
  try {
    const response = await axios.post(`${API_URL}/users/login`, { email, password });
    return {
      token: response.data.token,
      userId: response.data.user._id
    };
  } catch (error) {
    console.error(`Login failed for ${email}:`, error.message);
    throw error;
  }
}

// Test scenario
async function runTest() {
  console.log('Starting Booking Count Fix Test...');
  
  try {
    // Step 1: Login as marshall and create a time slot
    console.log('\n--- Step 1: Login as marshall and create a time slot ---');
    const marshallAuth = await login(testUsers[1].email, testUsers[1].password);
    testMarshallId = marshallAuth.userId;
    
    console.log(`Creating walk time slot for marshall ${testMarshallId} on ${testDateStr} at ${testTimeSlot}`);
    const createWalkResponse = await axios.post(
      `${API_URL}/walks/add-time`,
      {
        marshall: testMarshallId,
        date: testDateStr,
        time: testTimeSlot
      },
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    console.log('Walk time slot created successfully');
    
    // Step 2: Get the available times to find our walk
    console.log('\n--- Step 2: Get available times ---');
    const availableTimesResponse = await axios.get(`${API_URL}/walks/available-times`);
    const availableTimes = availableTimesResponse.data;
    
    const ourWalk = availableTimes.find(walk => 
      walk.marshall._id === testMarshallId && 
      walk.date === testDateStr && 
      walk.availableTimes.includes(testTimeSlot)
    );
    
    if (!ourWalk) {
      throw new Error('Could not find our created walk in available times');
    }
    
    testWalkId = ourWalk._id;
    console.log(`Found our walk with ID: ${testWalkId}`);
    
    // Step 3: Recalculate booking counts to ensure they're accurate
    console.log('\n--- Step 3: Recalculate booking counts ---');
    const recalculateResponse = await axios.post(
      `${API_URL}/walks/recalculate-booking-counts`,
      {},
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    console.log('Booking counts recalculated successfully');
    console.log(`Recalculated ${recalculateResponse.data.results.length} walks`);
    
    // Step 4: Login as user and book multiple walks for the same time slot
    console.log('\n--- Step 4: Login as user and book multiple walks for the same time slot ---');
    const userAuth = await login(testUsers[0].email, testUsers[0].password);
    testUserId = userAuth.userId;
    
    // Book 3 walks for the same time slot
    for (let i = 0; i < 3; i++) {
      console.log(`User ${testUserId} booking walk ${i+1}...`);
      const bookingResponse = await axios.post(
        `${API_URL}/walks/select-walk/${testWalkId}`,
        {
          userId: testUserId,
          timeSlot: testTimeSlot
        },
        {
          headers: { Authorization: `Bearer ${userAuth.token}` }
        }
      );
      
      userWalkIds.push(bookingResponse.data.walk._id);
      console.log(`User booked successfully with UserWalk ID: ${bookingResponse.data.walk._id}`);
      console.log(`Available slots: ${bookingResponse.data.availableSlots}`);
      
      if (i === 0) {
        console.log('Available slots after first booking should be 3');
        if (bookingResponse.data.availableSlots === 3) {
          console.log('Success: Available slots is 3 after first booking');
        } else {
          console.warn(`Warning: Available slots is ${bookingResponse.data.availableSlots} after first booking`);
        }
      } else if (i === 1) {
        console.log('Available slots after second booking should be 2');
        if (bookingResponse.data.availableSlots === 2) {
          console.log('Success: Available slots is 2 after second booking');
        } else {
          console.warn(`Warning: Available slots is ${bookingResponse.data.availableSlots} after second booking`);
        }
      } else if (i === 2) {
        console.log('Available slots after third booking should be 1');
        if (bookingResponse.data.availableSlots === 1) {
          console.log('Success: Available slots is 1 after third booking');
        } else {
          console.warn(`Warning: Available slots is ${bookingResponse.data.availableSlots} after third booking`);
        }
      }
    }
    
    // Step 5: Check the booking count
    console.log('\n--- Step 5: Check the booking count after booking 3 walks ---');
    const afterBookingResponse = await axios.get(`${API_URL}/walks/available-times`);
    const afterBookingTimes = afterBookingResponse.data;
    
    const walkAfterBooking = afterBookingTimes.find(walk => walk._id === testWalkId);
    
    if (!walkAfterBooking) {
      console.log('Walk not found in available times after booking');
    } else {
      const timeSlot = walkAfterBooking.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after booking 3 walks: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 3) {
          console.log('Success: Booking count is 3 after booking 3 walks');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} after booking 3 walks`);
        }
      } else {
        console.log('Time slot not found in walk');
      }
    }
    
    // Step 6: Cancel one walk
    console.log('\n--- Step 6: Cancel one walk ---');
    const cancelResponse = await axios.delete(
      `${API_URL}/walks/delete/${userWalkIds[0]}`,
      {
        data: { userId: testUserId },
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    console.log('Walk cancelled successfully');
    console.log('Cancel response:', cancelResponse.data);
    
    // Step 7: Check the booking count after cancellation
    console.log('\n--- Step 7: Check the booking count after cancellation ---');
    const afterCancellationResponse = await axios.get(`${API_URL}/walks/available-times`);
    const afterCancellationTimes = afterCancellationResponse.data;
    
    const walkAfterCancellation = afterCancellationTimes.find(walk => walk._id === testWalkId);
    
    if (!walkAfterCancellation) {
      console.log('Walk not found in available times after cancellation');
    } else {
      const timeSlot = walkAfterCancellation.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after cancellation: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 2) {
          console.log('Success: Booking count was decremented to 2');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} after cancellation`);
        }
      } else {
        console.log('Time slot not found in walk after cancellation');
      }
    }
    
    // Step 8: Check marshal's profile to see all scheduled walks
    console.log('\n--- Step 8: Check marshal profile for all scheduled walks ---');
    const marshallProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testMarshallId}`,
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    // Count walks for our test date and time
    const walksForDateAndTime = marshallProfileResponse.data.walks.filter(walk => 
      walk.date === testDateStr && walk.time === testTimeSlot
    );
    
    console.log(`Found ${walksForDateAndTime.length} walks for date ${testDateStr} and time ${testTimeSlot}`);
    
    if (walksForDateAndTime.length === 2) {
      console.log('Success: Marshal can see all 2 individual walks');
    } else {
      console.warn(`Warning: Marshal sees ${walksForDateAndTime.length} walks instead of 2`);
    }
    
    console.log('\nTest completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
runTest();
