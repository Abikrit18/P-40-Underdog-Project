// Test script for Available Slots Fix

// This script tests the following scenarios:
// 1. The availableSlots value is correctly calculated when booking walks
// 2. The availableSlots value is correctly updated when cancelling walks

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
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
  console.log('Starting Available Slots Fix Test...');
  
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
    
    // Step 4: Login as user and book a walk
    console.log('\n--- Step 4: Login as user and book a walk ---');
    const userAuth = await login(testUsers[0].email, testUsers[0].password);
    testUserId = userAuth.userId;
    
    console.log(`User ${testUserId} booking a walk...`);
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
    
    // Check if the available slots value is correct
    if (bookingResponse.data.availableSlots === 3) {
      console.log('Success: Available slots is 3 after first booking');
    } else {
      console.warn(`Warning: Available slots is ${bookingResponse.data.availableSlots} after first booking`);
    }
    
    // Step 5: Check the available times endpoint
    console.log('\n--- Step 5: Check the available times endpoint ---');
    const afterBookingResponse = await axios.get(`${API_URL}/walks/available-times`);
    const afterBookingTimes = afterBookingResponse.data;
    
    const walkAfterBooking = afterBookingTimes.find(walk => walk._id === testWalkId);
    
    if (!walkAfterBooking) {
      console.log('Walk not found in available times after booking');
    } else {
      const timeSlot = walkAfterBooking.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count in available times: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 1) {
          console.log('Success: Booking count is 1 in available times');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} in available times`);
        }
      } else {
        console.log('Time slot not found in walk');
      }
    }
    
    // Step 6: Cancel the walk
    console.log('\n--- Step 6: Cancel the walk ---');
    const cancelResponse = await axios.delete(
      `${API_URL}/walks/delete/${userWalkIds[0]}`,
      {
        data: { userId: testUserId },
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    console.log('Walk cancelled successfully');
    console.log('Cancel response:', cancelResponse.data);
    
    // Step 7: Check the available times endpoint after cancellation
    console.log('\n--- Step 7: Check the available times endpoint after cancellation ---');
    const afterCancellationResponse = await axios.get(`${API_URL}/walks/available-times`);
    const afterCancellationTimes = afterCancellationResponse.data;
    
    const walkAfterCancellation = afterCancellationTimes.find(walk => walk._id === testWalkId);
    
    if (!walkAfterCancellation) {
      console.log('Walk not found in available times after cancellation');
    } else {
      const timeSlot = walkAfterCancellation.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after cancellation: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 0) {
          console.log('Success: Booking count is 0 after cancellation');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} after cancellation`);
        }
      } else {
        console.log('Time slot not found in walk after cancellation');
      }
    }
    
    // Step 8: Book multiple walks and check the available slots
    console.log('\n--- Step 8: Book multiple walks and check the available slots ---');
    
    // Book 3 walks
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
      
      // Check if the available slots value is correct
      const expectedSlots = 4 - (i + 1);
      if (bookingResponse.data.availableSlots === expectedSlots) {
        console.log(`Success: Available slots is ${expectedSlots} after booking ${i+1} walks`);
      } else {
        console.warn(`Warning: Available slots is ${bookingResponse.data.availableSlots} after booking ${i+1} walks`);
      }
    }
    
    // Step 9: Check the available times endpoint after booking multiple walks
    console.log('\n--- Step 9: Check the available times endpoint after booking multiple walks ---');
    const finalResponse = await axios.get(`${API_URL}/walks/available-times`);
    const finalTimes = finalResponse.data;
    
    const finalWalk = finalTimes.find(walk => walk._id === testWalkId);
    
    if (!finalWalk) {
      console.log('Walk not found in available times after booking multiple walks');
    } else {
      const timeSlot = finalWalk.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Final booking count: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 3) {
          console.log('Success: Final booking count is 3');
        } else {
          console.warn(`Warning: Final booking count is ${timeSlot.bookedCount}`);
        }
      } else {
        console.log('Time slot not found in walk after booking multiple walks');
      }
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
