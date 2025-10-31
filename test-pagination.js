#!/usr/bin/env node

/**
 * Test script for Salesperson Management Pagination
 * This script tests the pagination functionality by making API calls
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:8000/api';

// Test configuration
const TEST_CONFIG = {
  // You'll need to replace this with a valid JWT token from your system
  authToken: 'YOUR_JWT_TOKEN_HERE',
  testEndpoint: '/salesperson/registrations'
};

async function testPagination() {
  console.log('🧪 Testing Salesperson Management Pagination...\n');

  try {
    // Test 1: Default pagination (10 records)
    console.log('📄 Test 1: Default pagination (10 records per page)');
    const response1 = await axios.get(`${API_BASE_URL}${TEST_CONFIG.testEndpoint}`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response1.status}`);
    console.log(`📊 Total records: ${response1.data.total || 'N/A'}`);
    console.log(`📄 Current page: ${response1.data.current_page || 'N/A'}`);
    console.log(`📄 Last page: ${response1.data.last_page || 'N/A'}`);
    console.log(`📄 Per page: ${response1.data.per_page || 'N/A'}`);
    console.log(`📄 Records returned: ${response1.data.data?.length || 0}\n`);

    // Test 2: Custom per_page parameter
    console.log('📄 Test 2: Custom per_page parameter (25 records)');
    const response2 = await axios.get(`${API_BASE_URL}${TEST_CONFIG.testEndpoint}?per_page=25`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response2.status}`);
    console.log(`📄 Per page: ${response2.data.per_page || 'N/A'}`);
    console.log(`📄 Records returned: ${response2.data.data?.length || 0}\n`);

    // Test 3: Page navigation
    console.log('📄 Test 3: Page navigation (page 2)');
    const response3 = await axios.get(`${API_BASE_URL}${TEST_CONFIG.testEndpoint}?page=2&per_page=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response3.status}`);
    console.log(`📄 Current page: ${response3.data.current_page || 'N/A'}`);
    console.log(`📄 Records returned: ${response3.data.data?.length || 0}\n`);

    // Test 4: Search functionality
    console.log('🔍 Test 4: Search functionality');
    const response4 = await axios.get(`${API_BASE_URL}${TEST_CONFIG.testEndpoint}?search=test&per_page=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response4.status}`);
    console.log(`📄 Records returned: ${response4.data.data?.length || 0}\n`);

    // Test 5: Status filtering
    console.log('🔍 Test 5: Status filtering');
    const response5 = await axios.get(`${API_BASE_URL}${TEST_CONFIG.testEndpoint}?status=pending&per_page=10`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response5.status}`);
    console.log(`📄 Records returned: ${response5.data.data?.length || 0}\n`);

    // Test 6: Combined filters
    console.log('🔍 Test 6: Combined filters (search + status + pagination)');
    const response6 = await axios.get(`${API_BASE_URL}${TEST_CONFIG.testEndpoint}?search=test&status=pending&page=1&per_page=5`, {
      headers: {
        'Authorization': `Bearer ${TEST_CONFIG.authToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Status: ${response6.status}`);
    console.log(`📄 Current page: ${response6.data.current_page || 'N/A'}`);
    console.log(`📄 Per page: ${response6.data.per_page || 'N/A'}`);
    console.log(`📄 Records returned: ${response6.data.data?.length || 0}\n`);

    console.log('🎉 All pagination tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n💡 Note: You need to update the authToken in this script with a valid JWT token.');
      console.log('   You can get a token by logging into the admin panel and checking the network requests.');
    }
  }
}

// Run the tests
if (require.main === module) {
  testPagination();
}

module.exports = { testPagination };
