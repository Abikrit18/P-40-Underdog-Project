// Test script for Walk Cancellation Fix

// This script tests the following scenarios:
// 1. When a walk is cancelled, the booking count is decremented correctly
// 2. The time slot is added back to available times if it wasn't fully booked

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
  console.log('Starting Walk Cancellation Fix Test...');
  
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
    
    // Step 4: Check the booking count
    console.log('\n--- Step 4: Check the booking count after booking 3 walks ---');
    const afterBookingResponse = await axios.get(`${API_URL}/walks/available-times`);
    const afterBookingTimes = afterBookingResponse.data;
    
    const walkAfterBooking = afterBookingTimes.find(walk => walk._id === testWalkId);
    
    if (!walkAfterBooking) {
      console.log('Walk not found in available times after booking');
    } else {
      const timeSlot = walkAfterBooking.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after booking 3 walks: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 3) {
          console.log('Success: Booking count is 3 after booking 3 walks');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} after booking 3 walks`);
        }
      } else {
        console.log('Time slot not found in walk');
      }
    }
    
    // Step 5: Cancel one walk
    console.log('\n--- Step 5: Cancel one walk ---');
    const cancelResponse = await axios.delete(
      `${API_URL}/walks/delete/${userWalkIds[0]}`,
      {
        data: { userId: testUserId },
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    console.log('Walk cancelled successfully');
    console.log('Cancel response:', cancelResponse.data);
    
    // Step 6: Check the booking count after cancellation
    console.log('\n--- Step 6: Check the booking count after cancellation ---');
    const afterCancellationResponse = await axios.get(`${API_URL}/walks/available-times`);
    const afterCancellationTimes = afterCancellationResponse.data;
    
    const walkAfterCancellation = afterCancellationTimes.find(walk => walk._id === testWalkId);
    
    if (!walkAfterCancellation) {
      console.log('Walk not found in available times after cancellation');
    } else {
      const timeSlot = walkAfterCancellation.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after cancellation: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 2) {
          console.log('Success: Booking count was decremented to 2');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} after cancellation`);
        }
      } else {
        console.log('Time slot not found in walk after cancellation');
      }
      
      // Check if the time slot is still in available times
      if (walkAfterCancellation.availableTimes.includes(testTimeSlot)) {
        console.log('Success: Time slot is still in available times');
      } else {
        console.warn('Warning: Time slot is not in available times after cancellation');
      }
    }
    
    // Step 7: Book the 4th walk to reach max capacity
    console.log('\n--- Step 7: Book the 4th walk to reach max capacity ---');
    const finalBookingResponse = await axios.post(
      `${API_URL}/walks/select-walk/${testWalkId}`,
      {
        userId: testUserId,
        timeSlot: testTimeSlot
      },
      {
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    userWalkIds.push(finalBookingResponse.data.walk._id);
    console.log(`User booked successfully with UserWalk ID: ${finalBookingResponse.data.walk._id}`);
    
    // Step 8: Check if the time slot is fully booked
    console.log('\n--- Step 8: Check if the time slot is fully booked ---');
    const afterFullBookingResponse = await axios.get(`${API_URL}/walks/available-times`);
    const afterFullBookingTimes = afterFullBookingResponse.data;
    
    const walkAfterFullBooking = afterFullBookingTimes.find(walk => walk._id === testWalkId);
    
    if (!walkAfterFullBooking) {
      console.log('Walk not found in available times after full booking');
    } else {
      const timeSlot = walkAfterFullBooking.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Booking count after full booking: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 3) {
          console.log('Success: Booking count is 3 after booking 4 walks (3 + 1 cancelled + 1 new)');
        } else {
          console.warn(`Warning: Booking count is ${timeSlot.bookedCount} after full booking`);
        }
      } else {
        console.log('Time slot not found in walk after full booking');
      }
      
      // Check if the time slot is removed from available times
      if (!walkAfterFullBooking.availableTimes.includes(testTimeSlot)) {
        console.log('Success: Time slot is removed from available times after full booking');
      } else {
        console.warn('Warning: Time slot is still in available times after full booking');
      }
    }
    
    // Step 9: Cancel one walk after full booking
    console.log('\n--- Step 9: Cancel one walk after full booking ---');
    const finalCancelResponse = await axios.delete(
      `${API_URL}/walks/delete/${userWalkIds[1]}`,
      {
        data: { userId: testUserId },
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    console.log('Walk cancelled successfully');
    console.log('Cancel response:', finalCancelResponse.data);
    
    // Step 10: Check if the time slot is added back to available times
    console.log('\n--- Step 10: Check if the time slot is added back to available times ---');
    const finalResponse = await axios.get(`${API_URL}/walks/available-times`);
    const finalTimes = finalResponse.data;
    
    const finalWalk = finalTimes.find(walk => walk._id === testWalkId);
    
    if (!finalWalk) {
      console.log('Walk not found in available times after final cancellation');
    } else {
      const timeSlot = finalWalk.timeSlots.find(ts => ts.time === testTimeSlot);
      if (timeSlot) {
        console.log(`Final booking count: ${timeSlot.bookedCount}/${timeSlot.maxBookings}`);
        
        if (timeSlot.bookedCount === 2) {
          console.log('Success: Final booking count is 2');
        } else {
          console.warn(`Warning: Final booking count is ${timeSlot.bookedCount}`);
        }
      } else {
        console.log('Time slot not found in walk after final cancellation');
      }
      
      // Check if the time slot is added back to available times
      if (finalWalk.availableTimes.includes(testTimeSlot)) {
        console.log('Success: Time slot is added back to available times after cancellation from full booking');
      } else {
        console.warn('Warning: Time slot is not added back to available times after cancellation from full booking');
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
