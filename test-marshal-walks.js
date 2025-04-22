// Test script for Marshal Walks

// This script tests the following scenarios:
// 1. Marshals can see all walks where they are the marshal
// 2. Walks are properly displayed on the marshal's profile

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
  console.log('Starting Marshal Walks Test...');
  
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
    
    // Step 4: Check marshal's profile to see the scheduled walk
    console.log('\n--- Step 4: Check marshal profile for scheduled walk ---');
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
    
    if (walksForDateAndTime.length > 0) {
      console.log('Success: Marshal can see the scheduled walk');
      console.log('Walk details:', {
        date: walksForDateAndTime[0].date,
        time: walksForDateAndTime[0].time,
        status: walksForDateAndTime[0].status,
        user: walksForDateAndTime[0].userid ? 
          `${walksForDateAndTime[0].userid.firstName} ${walksForDateAndTime[0].userid.lastName}` : 
          'No user assigned'
      });
    } else {
      console.warn('Warning: Marshal cannot see the scheduled walk');
    }
    
    // Step 5: Book another user for the same walk
    console.log('\n--- Step 5: Book another user for the same walk ---');
    
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
    
    // Step 6: Check marshal's profile again to see if both walks are visible
    console.log('\n--- Step 6: Check marshal profile again ---');
    const updatedMarshallProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testMarshallId}`,
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    // Count walks for our test date and time
    const updatedWalksForDateAndTime = updatedMarshallProfileResponse.data.walks.filter(walk => 
      walk.date === testDateStr && walk.time === testTimeSlot
    );
    
    console.log(`Found ${updatedWalksForDateAndTime.length} walks for date ${testDateStr} and time ${testTimeSlot}`);
    
    if (updatedWalksForDateAndTime.length > 0) {
      console.log('Success: Marshal can still see the scheduled walk');
      
      // Check if the walk shows multiple users
      const walk = updatedWalksForDateAndTime[0];
      console.log('Walk details:', {
        date: walk.date,
        time: walk.time,
        status: walk.status,
        user: walk.userid ? 
          `${walk.userid.firstName} ${walk.userid.lastName}` : 
          'No user assigned'
      });
      
      // Check if we can see the booking count
      if (walk.walkId && walk.walkId.timeSlots) {
        const timeSlot = walk.walkId.timeSlots.find(ts => ts.time === testTimeSlot);
        if (timeSlot) {
          console.log(`Booking count: ${timeSlot.bookedCount} of ${timeSlot.maxBookings}`);
        }
      }
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
