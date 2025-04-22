// Test script for Walk Display Fixes

// This script tests the following scenarios:
// 1. Marshals don't see duplicate walk cards for the same date and time
// 2. Walks are not marked as "Already Walked" before they're completed

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
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
  console.log('Starting Walk Display Fixes Test...');
  
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
    
    // Step 4: Book another user for the same walk
    console.log('\n--- Step 4: Book another user for the same walk ---');
    
    // Create a second user walk for the same time slot
    const secondUserWalkResponse = await axios.post(
      `${API_URL}/walks/select-walk/${testWalkId}`,
      {
        userId: testUserId, // Using the same user for simplicity
        timeSlot: testTimeSlot
      },
      {
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    console.log('Second user walk created');
    
    // Step 5: Check marshal's profile to ensure there are no duplicate walk cards
    console.log('\n--- Step 5: Check marshal profile for duplicate walk cards ---');
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
    
    if (walksForDateAndTime.length === 1) {
      console.log('Success: No duplicate walk cards for the same date and time');
    } else {
      console.warn(`Warning: Found ${walksForDateAndTime.length} walk cards for the same date and time`);
    }
    
    // Step 6: Check if the walk is marked as "Already Walked" before completion
    console.log('\n--- Step 6: Check if the walk is marked as "Already Walked" before completion ---');
    
    // Get available times again to check the status
    const updatedAvailableTimesResponse = await axios.get(`${API_URL}/walks/available-times`);
    const updatedAvailableTimes = updatedAvailableTimesResponse.data;
    
    const ourUpdatedWalk = updatedAvailableTimes.find(walk => 
      walk._id === testWalkId
    );
    
    if (ourUpdatedWalk) {
      console.log('Found our walk in available times');
      
      // Check if the walk is in the completedWalks array
      const userProfileResponse = await axios.get(
        `${API_URL}/users/profile/${testUserId}`,
        {
          headers: { Authorization: `Bearer ${userAuth.token}` }
        }
      );
      
      const completedWalksForDateAndTime = userProfileResponse.data.completedWalks.filter(walk => 
        walk.date === testDateStr && walk.time === testTimeSlot
      );
      
      if (completedWalksForDateAndTime.length === 0) {
        console.log('Success: Walk is not in the completedWalks array before completion');
      } else {
        console.warn(`Warning: Found ${completedWalksForDateAndTime.length} completed walks for the same date and time before completion`);
      }
    } else {
      console.warn('Could not find our walk in available times');
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
