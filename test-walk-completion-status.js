// Test script for Walk Completion Status

// This script tests the following scenarios:
// 1. A walk is only marked as "Already Walked" after a marshal explicitly marks it as completed
// 2. A walk is marked as "Not Walked" if a marshal marks it as incomplete

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
  console.log('Starting Walk Completion Status Test...');
  
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
      console.warn('Warning: User already has completed walks');
      console.log('Completed walks:', userProfileResponse.data.completedWalks.length);
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
    
    // Step 8: Create another walk for testing incomplete status
    console.log('\n--- Step 8: Create another walk for testing incomplete status ---');
    
    // Use a different time slot
    const testTimeSlot2 = '11:00';
    
    await axios.post(
      `${API_URL}/walks/add-time`,
      {
        marshall: testMarshallId,
        date: testDateStr,
        time: testTimeSlot2
      },
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    // Get the new walk ID
    const newAvailableTimesResponse = await axios.get(`${API_URL}/walks/available-times`);
    const newWalk = newAvailableTimesResponse.data.find(walk => 
      walk.marshall._id === testMarshallId && 
      walk.date === testDateStr && 
      walk.availableTimes.includes(testTimeSlot2)
    );
    
    const newWalkId = newWalk._id;
    
    // Book the walk
    const newBookingResponse = await axios.post(
      `${API_URL}/walks/select-walk/${newWalkId}`,
      {
        userId: testUserId,
        timeSlot: testTimeSlot2
      },
      {
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    const newUserWalkId = newBookingResponse.data.walk._id;
    console.log(`User booked second walk with UserWalk ID: ${newUserWalkId}`);
    
    // Step 9: Marshal marks the second walk as incomplete
    console.log('\n--- Step 9: Marshal marks the second walk as incomplete ---');
    await axios.post(
      `${API_URL}/walks/incomplete/${newUserWalkId}`,
      { userId: testMarshallId },
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    console.log('Second walk marked as incomplete');
    
    // Step 10: Check user's profile to see both walks
    console.log('\n--- Step 10: Check user profile for both walks ---');
    const finalUserProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testUserId}`,
      {
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    const incompleteWalk = finalUserProfileResponse.data.completedWalks.find(walk => 
      walk.date === testDateStr && walk.time === testTimeSlot2
    );
    
    if (incompleteWalk) {
      console.log('Success: Found incomplete walk on user profile');
      console.log(`Walk status: ${incompleteWalk.status}`);
      
      if (incompleteWalk.status === 'incomplete') {
        console.log('Success: Walk is correctly marked as incomplete');
      } else {
        console.warn(`Warning: Walk status is ${incompleteWalk.status} instead of 'incomplete'`);
      }
    } else {
      throw new Error('Could not find incomplete walk on user profile');
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
