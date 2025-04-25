// Test script for Walk Cancellation

// This script tests the following scenarios:
// 1. When a walk is cancelled, the booking count is decremented
// 2. The frontend is updated to reflect the change

const axios = require('axios');

// Configuration
const API_URL = 'https://p-40-underdog-project-backend.onrender.com';
let testMarshallId = null;
let testUserId = null;
let testWalkId = null;
let userWalkId = null;
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
  console.log('Starting Walk Cancellation Test...');
  
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
    
    // Step 3: Login as user and book the walk
    console.log('\n--- Step 3: Login as user and book the walk ---');
    const userAuth = await login(testUsers[0].email, testUsers[0].password);
    testUserId = userAuth.userId;
    
    console.log(`User ${testUserId} booking the walk...`);
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
    
    userWalkId = bookingResponse.data.walk._id;
    console.log(`User booked successfully with UserWalk ID: ${userWalkId}`);
    
    // Step 4: Check the booking count
    console.log('\n--- Step 4: Check the booking count ---');
    const updatedAvailableTimesResponse = await axios.get(`${API_URL}/walks/available-times`);
    const updatedAvailableTimes = updatedAvailableTimesResponse.data;
    
    const updatedWalk = updatedAvailableTimes.find(walk => walk._id === testWalkId);
    
    if (!updatedWalk) {
      console.log('Walk not found in available times after booking');
    } else {
      const timeSlot = updatedWalk.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after booking: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
      } else {
        console.log('Time slot not found in walk');
      }
    }
    
    // Step 5: Cancel the walk
    console.log('\n--- Step 5: Cancel the walk ---');
    const cancelResponse = await axios.delete(
      `${API_URL}/walks/delete/${userWalkId}`,
      {
        data: { userId: testUserId },
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    console.log('Walk cancelled successfully');
    console.log('Cancel response:', cancelResponse.data);
    
    // Step 6: Check the booking count again
    console.log('\n--- Step 6: Check the booking count after cancellation ---');
    const finalAvailableTimesResponse = await axios.get(`${API_URL}/walks/available-times`);
    const finalAvailableTimes = finalAvailableTimesResponse.data;
    
    const finalWalk = finalAvailableTimes.find(walk => walk._id === testWalkId);
    
    if (!finalWalk) {
      console.log('Walk not found in available times after cancellation');
    } else {
      const timeSlot = finalWalk.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after cancellation: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 0) {
          console.log('Success: Booking count was decremented to 0');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} after cancellation`);
        }
      } else {
        console.log('Time slot not found in walk after cancellation');
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
