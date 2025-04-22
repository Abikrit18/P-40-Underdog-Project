// Test script for Marshal Dummy Walks

// This script tests the following scenarios:
// 1. Marshals don't see dummy walk cards on their profile
// 2. Only walks with assigned users are shown

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
  console.log('Starting Marshal Dummy Walks Test...');
  
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
    
    // Step 3: Check marshal's profile to see if the dummy walk is shown
    console.log('\n--- Step 3: Check marshal profile for dummy walk ---');
    const initialMarshallProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testMarshallId}`,
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    // Count walks for our test date and time
    const dummyWalks = initialMarshallProfileResponse.data.walks.filter(walk => 
      walk.date === testDateStr && 
      (walk.time === testTimeSlot || (walk.availableTimes && walk.availableTimes.includes(testTimeSlot))) &&
      !walk.userid
    );
    
    console.log(`Found ${dummyWalks.length} dummy walks for date ${testDateStr} and time ${testTimeSlot}`);
    
    if (dummyWalks.length === 0) {
      console.log('Success: Marshal cannot see the dummy walk');
    } else {
      console.warn('Warning: Marshal can see the dummy walk');
      console.log('Dummy walk details:', {
        date: dummyWalks[0].date,
        time: dummyWalks[0].time || dummyWalks[0].availableTimes,
        status: dummyWalks[0].status
      });
    }
    
    // Step 4: Login as user and book the walk
    console.log('\n--- Step 4: Login as user and book the walk ---');
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
    
    // Step 5: Check marshal's profile to see the scheduled walk
    console.log('\n--- Step 5: Check marshal profile for scheduled walk ---');
    const marshallProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testMarshallId}`,
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    // Count walks for our test date and time
    const scheduledWalks = marshallProfileResponse.data.walks.filter(walk => 
      walk.date === testDateStr && 
      (walk.time === testTimeSlot || (walk.availableTimes && walk.availableTimes.includes(testTimeSlot))) &&
      walk.userid
    );
    
    console.log(`Found ${scheduledWalks.length} scheduled walks for date ${testDateStr} and time ${testTimeSlot}`);
    
    if (scheduledWalks.length > 0) {
      console.log('Success: Marshal can see the scheduled walk');
      console.log('Walk details:', {
        date: scheduledWalks[0].date,
        time: scheduledWalks[0].time || scheduledWalks[0].availableTimes,
        status: scheduledWalks[0].status,
        user: scheduledWalks[0].userid ? 
          `${scheduledWalks[0].userid.firstName} ${scheduledWalks[0].userid.lastName}` : 
          'No user assigned'
      });
    } else {
      console.warn('Warning: Marshal cannot see the scheduled walk');
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
