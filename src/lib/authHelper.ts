// Authentication helper for development/testing
// This file should be removed in production

// import { paymentApi } from './paymentApi';

export const setupTestAuth = () => {
  console.log('🔧 Setting up test authentication...');
  
  // Set up JWT token for testing
  localStorage.setItem('jwt', 'test-jwt-token-for-development');
  localStorage.setItem('user_role', 'organizer');
  localStorage.setItem('user_id', '6'); // Test Organizer user ID
  localStorage.setItem('organizer_id', '1');
  
  // Set up user data for the auth context
  const testUser = {
    id: '6',
    email: 'test.o@validity.et',
    role: 'organizer' as const,
    organizer_id: 1,
    organizer: {
      id: 1,
      name: 'Validity Event & Marketing',
      status: 'active'
    }
  };
  
  // Store user data in localStorage for the auth context
  localStorage.setItem('user', JSON.stringify(testUser));
  
  console.log('✅ Test authentication set up successfully');
  console.log('User:', testUser);
  
  return testUser;
};

export const clearTestAuth = () => {
  console.log('🧹 Clearing test authentication...');
  
  localStorage.removeItem('jwt');
  localStorage.removeItem('user_role');
  localStorage.removeItem('user_id');
  localStorage.removeItem('organizer_id');
  localStorage.removeItem('user');
  
  console.log('✅ Test authentication cleared');
};

// Auto-setup test auth if no token is present
export const autoSetupTestAuth = () => {
  const token = localStorage.getItem('jwt');
  if (!token) {
    console.log('🔧 No authentication token found, setting up test auth...');
    setupTestAuth();
  } else {
    console.log('✅ Authentication token found');
  }
};

// Make it available globally for easy access in browser console
if (typeof window !== 'undefined') {
  (window as any).setupTestAuth = setupTestAuth;
  (window as any).clearTestAuth = clearTestAuth;
  (window as any).autoSetupTestAuth = autoSetupTestAuth;
}
