// Test script for Profile Walks Display

// This script tests the following scenarios:
// 1. User profile shows scheduled walks
// 2. User profile shows completed walks
// 3. Marshal profile shows scheduled walks
// 4. Marshal profile shows completed walks
// 5. Admin profile shows all walks

const axios = require('axios');

// Configuration
const API_URL = 'https://p-40-underdog-project-backend.onrender.com';

// Test users (these should exist in your database)
const testUsers = [
  { email: 'user@example.com', password: 'password123' },
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
  console.log('Starting Profile Walks Display Test...');
  
  try {
    // Step 1: Login as user and check profile
    console.log('\n--- Step 1: Login as user and check profile ---');
    const userAuth = await login(testUsers[0].email, testUsers[0].password);
    
    const userProfileResponse = await axios.get(
      `${API_URL}/users/profile/${userAuth.userId}`,
      {
        headers: { Authorization: `Bearer ${userAuth.token}` }
      }
    );
    
    console.log(`User has ${userProfileResponse.data.walks?.length || 0} scheduled walks`);
    console.log(`User has ${userProfileResponse.data.completedWalks?.length || 0} completed walks`);
    
    if (userProfileResponse.data.walks?.length > 0) {
      console.log('Sample scheduled walk:', {
        date: userProfileResponse.data.walks[0].date,
        time: userProfileResponse.data.walks[0].time,
        marshall: userProfileResponse.data.walks[0].marshall?.firstName
      });
    }
    
    if (userProfileResponse.data.completedWalks?.length > 0) {
      console.log('Sample completed walk:', {
        date: userProfileResponse.data.completedWalks[0].date,
        time: userProfileResponse.data.completedWalks[0].time,
        marshall: userProfileResponse.data.completedWalks[0].marshallId?.firstName
      });
    }
    
    // Step 2: Login as marshall and check profile
    console.log('\n--- Step 2: Login as marshall and check profile ---');
    const marshallAuth = await login(testUsers[1].email, testUsers[1].password);
    
    const marshallProfileResponse = await axios.get(
      `${API_URL}/users/profile/${marshallAuth.userId}`,
      {
        headers: { Authorization: `Bearer ${marshallAuth.token}` }
      }
    );
    
    console.log(`Marshall has ${marshallProfileResponse.data.walks?.length || 0} scheduled walks`);
    console.log(`Marshall has ${marshallProfileResponse.data.completedWalks?.length || 0} completed walks`);
    
    if (marshallProfileResponse.data.walks?.length > 0) {
      console.log('Sample scheduled walk:', {
        date: marshallProfileResponse.data.walks[0].date,
        time: marshallProfileResponse.data.walks[0].time,
        user: marshallProfileResponse.data.walks[0].userid?.firstName
      });
    }
    
    if (marshallProfileResponse.data.completedWalks?.length > 0) {
      console.log('Sample completed walk:', {
        date: marshallProfileResponse.data.completedWalks[0].date,
        time: marshallProfileResponse.data.completedWalks[0].time,
        user: marshallProfileResponse.data.completedWalks[0].userId?.firstName
      });
    }
    
    // Step 3: Login as admin and check profile
    console.log('\n--- Step 3: Login as admin and check profile ---');
    const adminAuth = await login(testUsers[2].email, testUsers[2].password);
    
    const adminProfileResponse = await axios.get(
      `${API_URL}/users/profile/${adminAuth.userId}`,
      {
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      }
    );
    
    console.log(`Admin has access to ${adminProfileResponse.data.walks?.length || 0} scheduled walks`);
    console.log(`Admin has access to ${adminProfileResponse.data.completedWalks?.length || 0} completed walks`);
    
    if (adminProfileResponse.data.walks?.length > 0) {
      console.log('Sample scheduled walk:', {
        date: adminProfileResponse.data.walks[0].date,
        time: adminProfileResponse.data.walks[0].time,
        user: adminProfileResponse.data.walks[0].userid?.firstName,
        marshall: adminProfileResponse.data.walks[0].marshall?.firstName
      });
    }
    
    if (adminProfileResponse.data.completedWalks?.length > 0) {
      console.log('Sample completed walk:', {
        date: adminProfileResponse.data.completedWalks[0].date,
        time: adminProfileResponse.data.completedWalks[0].time,
        user: adminProfileResponse.data.completedWalks[0].userId?.firstName,
        marshall: adminProfileResponse.data.completedWalks[0].marshallId?.firstName
      });
    }
    
    // Step 4: Check active walks endpoint
    console.log('\n--- Step 4: Check active walks endpoint ---');
    const activeWalksResponse = await axios.get(
      `${API_URL}/walks/active`,
      {
        headers: { Authorization: `Bearer ${adminAuth.token}` }
      }
    );
    
    console.log(`Active walks endpoint returned ${activeWalksResponse.data.length} walks`);
    
    if (activeWalksResponse.data.length > 0) {
      console.log('Sample active walk:', {
        date: activeWalksResponse.data[0].date,
        time: activeWalksResponse.data[0].time,
        user: activeWalksResponse.data[0].userid?.firstName || activeWalksResponse.data[0].userId?.firstName,
        marshall: activeWalksResponse.data[0].marshall?.firstName || activeWalksResponse.data[0].marshallId?.firstName
      });
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
