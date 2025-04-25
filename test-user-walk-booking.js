// Test script for User Walk Booking

// This script tests the following scenarios:
// 1. Multiple users can book the same walk slot
// 2. Once a slot is fully booked with 4 users, it should be permanently removed from availability

const axios = require('axios');

// Configuration
const API_URL = 'https://p-40-underdog-project-backend.onrender.com';
let testMarshallId = null;
let testWalkId = null;
let testTimeSlot = '10:00';
let testDate = new Date();
testDate.setDate(testDate.getDate() + 1); // Tomorrow
const testDateStr = testDate.toISOString().split('T')[0];

// Test users (these should exist in your database)
const testUsers = [
  { email: 'user1@example.com', password: 'password123' },
  { email: 'user2@example.com', password: 'password123' },
  { email: 'user3@example.com', password: 'password123' },
  { email: 'user4@example.com', password: 'password123' },
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
  console.log('Starting User Walk Booking Test...');
  
  try {
    // Step 1: Login as marshall and create a time slot
    console.log('\n--- Step 1: Login as marshall and create a time slot ---');
    const marshallAuth = await login(testUsers[4].email, testUsers[4].password);
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
    
    // Step 3: Book the walk with 4 different users
    console.log('\n--- Step 3: Book the walk with 4 different users ---');
    
    for (let i = 0; i < 4; i++) {
      const userAuth = await login(testUsers[i].email, testUsers[i].password);
      
      console.log(`User ${i+1} (${userAuth.userId}) booking the walk...`);
      const bookingResponse = await axios.post(
        `${API_URL}/walks/select-walk/${testWalkId}`,
        {
          userId: userAuth.userId,
          timeSlot: testTimeSlot
        },
        {
          headers: { Authorization: `Bearer ${userAuth.token}` }
        }
      );
      
      console.log(`User ${i+1} booked successfully`);
      console.log(`Available slots remaining: ${bookingResponse.data.availableSlots}`);
      
      // Check if the time slot is still available after each booking
      const checkAvailableTimesResponse = await axios.get(`${API_URL}/walks/available-times`);
      const checkAvailableTimes = checkAvailableTimesResponse.data;
      
      const walkAfterBooking = checkAvailableTimes.find(walk => 
        walk.marshall._id === testMarshallId && 
        walk.date === testDateStr
      );
      
      if (!walkAfterBooking) {
        console.log(`Walk is no longer in available times after ${i+1} bookings - this is expected if it's fully booked`);
        if (i < 3) {
          throw new Error(`Walk disappeared after only ${i+1} bookings!`);
        }
      } else if (!walkAfterBooking.availableTimes.includes(testTimeSlot)) {
        console.log(`Time slot is no longer available after ${i+1} bookings - this is expected if it's fully booked`);
        if (i < 3) {
          throw new Error(`Time slot disappeared after only ${i+1} bookings!`);
        }
      } else {
        console.log(`Time slot is still available after ${i+1} bookings - correct!`);
      }
    }
    
    // Step 4: Verify the time slot is now permanently removed
    console.log('\n--- Step 4: Verify the time slot is permanently removed ---');
    const finalCheckResponse = await axios.get(`${API_URL}/walks/available-times`);
    const finalAvailableTimes = finalCheckResponse.data;
    
    const finalWalk = finalAvailableTimes.find(walk => 
      walk.marshall._id === testMarshallId && 
      walk.date === testDateStr
    );
    
    if (!finalWalk) {
      console.log('Walk is no longer in available times - this is expected if it\'s fully booked');
    } else if (finalWalk.availableTimes.includes(testTimeSlot)) {
      throw new Error('Time slot is still available after being fully booked!');
    } else {
      console.log('Time slot is no longer available - correct!');
    }
    
    console.log('\nTest completed successfully! The user walk booking system is working correctly.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
runTest();
