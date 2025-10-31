// Disable mock authentication mode
localStorage.removeItem('mock_auth');
console.log('Mock authentication mode disabled. API calls should now work normally.');

// Test API connection
fetch('http://localhost:8000/api/salesperson/overview', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('jwt') || sessionStorage.getItem('jwt')}`,
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (response.ok) {
    console.log('✅ API connection successful!');
    return response.json();
  } else {
    console.log('❌ API connection failed:', response.status, response.statusText);
  }
})
.catch(error => {
  console.log('❌ API connection error:', error.message);
});











