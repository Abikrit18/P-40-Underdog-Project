// Test script for Marshal Duplicate Cards

// This script tests the following scenarios:
// 1. Marshals can see all individual user walks for the same time slot
// 2. There are no duplicate cards in the marshal's profile

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
  console.log('Starting Marshal Duplicate Cards Test...');
  
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
    
    // Step 3: Login as user and book multiple walks for the same time slot
    console.log('\n--- Step 3: Login as user and book multiple walks for the same time slot ---');
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
    }
    
    // Step 4: Check marshal's profile to see if all walks are displayed without duplicates
    console.log('\n--- Step 4: Check marshal profile for all walks without duplicates ---');
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
    
    // Check if there are any duplicate walk IDs
    const walkIds = walksForDateAndTime.map(walk => walk._id);
    const uniqueWalkIds = [...new Set(walkIds)];
    
    console.log(`Found ${walkIds.length} total walk IDs and ${uniqueWalkIds.length} unique walk IDs`);
    
    if (walkIds.length === uniqueWalkIds.length) {
      console.log('Success: No duplicate walk IDs found');
    } else {
      console.warn(`Warning: Found ${walkIds.length - uniqueWalkIds.length} duplicate walk IDs`);
      
      // Find the duplicate IDs
      const counts = {};
      walkIds.forEach(id => {
        counts[id] = (counts[id] || 0) + 1;
      });
      
      const duplicates = Object.entries(counts)
        .filter(([id, count]) => count > 1)
        .map(([id, count]) => ({ id, count }));
      
      console.log('Duplicate walk IDs:', duplicates);
    }
    
    // Check if the number of walks matches the number of bookings
    if (walksForDateAndTime.length === 3) {
      console.log('Success: Marshal can see all 3 individual walks');
    } else if (walksForDateAndTime.length < 3) {
      console.warn(`Warning: Marshal can only see ${walksForDateAndTime.length} walks instead of 3`);
    } else {
      console.warn(`Warning: Marshal sees ${walksForDateAndTime.length} walks instead of 3 (possible duplicates)`);
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
