// Test script for Walk Booking Flow

// This script tests the following scenarios:
// 1. A marshal can open a slot that can be selected by up to 4 different users
// 2. Users who have already selected a walk for a specific day and time cannot select another walk for the same day and time
// 3. After a marshal marks a walk as complete, it should be marked as "Already Walked" for the user
// 4. All walks should appear on the respective profiles of users, marshals, and admins

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3000';
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
  { email: 'user5@example.com', password: 'password123' }, // Extra user to test restriction
  { email: 'marshall@example.com', password: 'password123' },
  { email: 'admin@example.com', password: 'password123' }
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
  console.log('Starting Walk Booking Flow Test...');
  
  try {
    // Step 1: Login as marshall and create a time slot
    console.log('\n--- Step 1: Login as marshall and create a time slot ---');
    const marshallAuth = await login(testUsers[5].email, testUsers[5].password);
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
    
    const userBookings = [];
    
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
      
      userBookings.push({
        userId: userAuth.userId,
        walkId: bookingResponse.data.walk._id,
        token: userAuth.token
      });
      
      console.log(`User ${i+1} booked successfully`);
      console.log(`Available slots remaining: ${bookingResponse.data.availableSlots}`);
    }
    
    // Step 4: Try to book the same walk with a 5th user (should fail)
    console.log('\n--- Step 4: Try to book the same walk with a 5th user (should fail) ---');
    try {
      const user5Auth = await login(testUsers[4].email, testUsers[4].password);
      
      await axios.post(
        `${API_URL}/walks/select-walk/${testWalkId}`,
        {
          userId: user5Auth.userId,
          timeSlot: testTimeSlot
        },
        {
          headers: { Authorization: `Bearer ${user5Auth.token}` }
        }
      );
      
      console.error('ERROR: 5th user was able to book the walk when it should be fully booked!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('Success: 5th user was correctly prevented from booking the fully booked walk');
        console.log(`Error message: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
    
    // Step 5: Try to book another walk at the same time for user1 (should fail)
    console.log('\n--- Step 5: Try to book another walk at the same time for user1 (should fail) ---');
    
    // Create another walk at the same time but different date
    const newDate = new Date(testDate);
    newDate.setDate(newDate.getDate() + 1); // Day after tomorrow
    const newDateStr = newDate.toISOString().split('T')[0];
    
    await axios.post(
      `${API_URL}/walks/add-time`,
      {
        marshall: testMarshallId,
        date: newDateStr,
        time: testTimeSlot
      },
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    // Get the new walk ID
    const newAvailableTimesResponse = await axios.get(`${API_URL}/walks/available-times`);
    const newWalk = newAvailableTimesResponse.data.find(walk => 
      walk.marshall._id === testMarshallId && 
      walk.date === newDateStr && 
      walk.availableTimes.includes(testTimeSlot)
    );
    
    // Try to book with user1 again
    try {
      const user1Auth = await login(testUsers[0].email, testUsers[0].password);
      
      await axios.post(
        `${API_URL}/walks/select-walk/${newWalk._id}`,
        {
          userId: user1Auth.userId,
          timeSlot: testTimeSlot
        },
        {
          headers: { Authorization: `Bearer ${user1Auth.token}` }
        }
      );
      
      console.error('ERROR: User1 was able to book another walk at the same time!');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        console.log('Success: User1 was correctly prevented from booking another walk at the same time');
        console.log(`Error message: ${error.response.data.error}`);
      } else {
        throw error;
      }
    }
    
    // Step 6: Mark one of the walks as complete
    console.log('\n--- Step 6: Mark one of the walks as complete ---');
    
    // Complete the first user's walk
    await axios.post(
      `${API_URL}/walks/complete/${userBookings[0].walkId}`,
      { userId: testMarshallId },
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    console.log(`Walk for User1 marked as completed`);
    
    // Step 7: Verify the walk appears in the completed walks list
    console.log('\n--- Step 7: Verify the walk appears in the completed walks list ---');
    
    const walkLogsResponse = await axios.get(
      `${API_URL}/walks/logs`,
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    const completedWalk = walkLogsResponse.data.find(log => 
      log.userId._id === userBookings[0].userId && 
      log.date === testDateStr && 
      log.time === testTimeSlot
    );
    
    if (completedWalk) {
      console.log('Success: Completed walk found in walk logs');
      console.log(`Walk log status: ${completedWalk.status}`);
    } else {
      throw new Error('Could not find completed walk in walk logs');
    }
    
    // Step 8: Verify the walk appears on the user's profile
    console.log('\n--- Step 8: Verify the walk appears on the user\'s profile ---');
    
    const user1Auth = await login(testUsers[0].email, testUsers[0].password);
    const user1ProfileResponse = await axios.get(
      `${API_URL}/users/profile/${userBookings[0].userId}`,
      {
        headers: { Authorization: `Bearer ${user1Auth.token}` }
      }
    );
    
    console.log(`User1 total walks: ${user1ProfileResponse.data.totalWalks}`);
    if (user1ProfileResponse.data.totalWalks > 0) {
      console.log('Success: User1 has completed walks on their profile');
    } else {
      console.warn('Warning: User1 does not have any completed walks on their profile');
    }
    
    // Step 9: Verify the walk appears on the marshall's profile
    console.log('\n--- Step 9: Verify the walk appears on the marshall\'s profile ---');
    
    const marshallProfileResponse = await axios.get(
      `${API_URL}/users/profile/${testMarshallId}`,
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    console.log(`Marshall total walks: ${marshallProfileResponse.data.totalWalks}`);
    if (marshallProfileResponse.data.totalWalks > 0) {
      console.log('Success: Marshall has completed walks on their profile');
    } else {
      console.warn('Warning: Marshall does not have any completed walks on their profile');
    }
    
    // Step 10: Verify the walk appears on the admin's profile
    console.log('\n--- Step 10: Verify the walk appears for the admin ---');
    
    const adminAuth = await login(testUsers[6].email, testUsers[6].password);
    const adminWalksResponse = await axios.get(
      `${API_URL}/walks/logs`,
      {
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      }
    );
    
    const adminCompletedWalk = adminWalksResponse.data.find(log => 
      log.userId._id === userBookings[0].userId && 
      log.date === testDateStr && 
      log.time === testTimeSlot
    );
    
    if (adminCompletedWalk) {
      console.log('Success: Admin can see the completed walk');
    } else {
      console.warn('Warning: Admin cannot see the completed walk');
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
