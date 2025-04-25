// Test script for Walk Status Fix

// This script tests the following scenarios:
// 1. Walks are not marked as "Already Walked" before they're completed by a marshal
// 2. Walks are correctly marked as "Already Walked" after they're completed by a marshal

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
  console.log('Starting Walk Status Fix Test...');
  
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
    
    // Step 4: Check user's profile to see the scheduled walk
    console.log('\n--- Step 4: Check user profile for scheduled walk ---');
    const userProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testUserId}`,
      {
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    const scheduledWalk = userProfileResponse.data.walks.find(walk => 
      walk._id === userWalkId
    );
    
    if (scheduledWalk) {
      console.log('Success: Found scheduled walk on user profile');
      console.log('Walk status:', scheduledWalk.status);
    } else {
      throw new Error('Could not find scheduled walk on user profile');
    }
    
    // Step 5: Check if the user has any completed walks (should be none)
    console.log('\n--- Step 5: Check if user has any completed walks (should be none) ---');
    
    if (userProfileResponse.data.completedWalks && userProfileResponse.data.completedWalks.length > 0) {
      const completedWalksForThisDate = userProfileResponse.data.completedWalks.filter(walk => 
        walk.date === testDateStr && walk.time === testTimeSlot
      );
      
      if (completedWalksForThisDate.length > 0) {
        console.warn('Warning: User already has completed walks for this date and time');
        console.log('Completed walks:', completedWalksForThisDate);
      } else {
        console.log('Success: User has no completed walks for this date and time');
      }
    } else {
      console.log('Success: User has no completed walks yet');
    }
    
    // Step 6: Marshal marks the walk as completed
    console.log('\n--- Step 6: Marshal marks the walk as completed ---');
    await axios.post(
      `${API_URL}/walks/complete/${userWalkId}`,
      { userId: testMarshallId },
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    console.log('Walk marked as completed');
    
    // Step 7: Check user's profile to see the completed walk
    console.log('\n--- Step 7: Check user profile for completed walk ---');
    const updatedUserProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testUserId}`,
      {
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    const completedWalk = updatedUserProfileResponse.data.completedWalks.find(walk => 
      walk.date === testDateStr && walk.time === testTimeSlot
    );
    
    if (completedWalk) {
      console.log('Success: Found completed walk on user profile');
      console.log(`Walk status: ${completedWalk.status}`);
      
      if (completedWalk.status === 'completed') {
        console.log('Success: Walk is correctly marked as completed');
      } else {
        console.warn(`Warning: Walk status is ${completedWalk.status} instead of 'completed'`);
      }
    } else {
      throw new Error('Could not find completed walk on user profile');
    }
    
    // Step 8: Check if the scheduled walk was removed from the user's profile
    const stillHasScheduledWalk = updatedUserProfileResponse.data.walks.some(walk => 
      walk._id === userWalkId
    );
    
    if (!stillHasScheduledWalk) {
      console.log('Success: Scheduled walk was removed from user profile');
    } else {
      console.warn('Warning: Scheduled walk is still on user profile after completion');
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
