// Authentication helper for development/testing
// This file should be removed in production

// import { paymentApi } from './paymentApi';

export const setupTestAuth = async () => {
  console.log('🔧 Setting up test authentication...');
  
  // Instead of setting a fake token, try to login with test credentials
  // This will get a real JWT token from the backend
  try {
    const response = await fetch('http://localhost:8000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        email: 'test.o@validity.et',
        password: 'password' // You may need to adjust this password
      })
    });

    if (response.ok) {
      const data = await response.json();
      const { token, user, expires_in } = data;
      
      // Store real JWT token
      localStorage.setItem('jwt', token);
      localStorage.setItem('user_role', user.role || 'organizer');
      localStorage.setItem('user_id', user.id?.toString() || '6');
      localStorage.setItem('organizer_id', user.organizer_id?.toString() || '1');
      
      // Store token expiration
      if (expires_in) {
        const expiresAt = Date.now() + expires_in * 1000;
        localStorage.setItem('token_expires_at', expiresAt.toString());
        localStorage.setItem('token_created_at', Date.now().toString());
      }
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Test authentication set up successfully with real token');
      console.log('User:', user);
      
      return user;
    } else {
      console.warn('⚠️ Test login failed, falling back to fake token (requests will fail)');
      // Fallback to fake token (will cause 401 errors)
      localStorage.setItem('jwt', 'test-jwt-token-for-development');
      localStorage.setItem('user_role', 'organizer');
      localStorage.setItem('user_id', '6');
      localStorage.setItem('organizer_id', '1');
    }
  } catch (error) {
    console.error('❌ Failed to setup test auth:', error);
    console.warn('⚠️ Falling back to fake token (requests will fail)');
    // Fallback to fake token (will cause 401 errors)
    localStorage.setItem('jwt', 'test-jwt-token-for-development');
    localStorage.setItem('user_role', 'organizer');
    localStorage.setItem('user_id', '6');
    localStorage.setItem('organizer_id', '1');
  }
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
export const autoSetupTestAuth = async () => {
  const token = localStorage.getItem('jwt');
  if (!token) {
    console.log('🔧 No authentication token found, setting up test auth...');
    await setupTestAuth();
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
