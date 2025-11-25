import axios from 'axios';

// Enhanced API service with offline support and fallback data
class VendorApiService {
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  private isOnline = navigator.onLine;
  private cache = new Map();

  constructor() {
    // Load mock vendors from localStorage if available
    this.loadMockVendorsFromStorage();
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Back online - syncing data...');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Gone offline - using cached data');
    });
  }

  // Load mock vendors from localStorage
  private loadMockVendorsFromStorage() {
    try {
      const stored = localStorage.getItem('mockVendors');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.mockVendors = parsed;
          console.log('Loaded mock vendors from localStorage:', this.mockVendors.length);
        }
      }
    } catch (error) {
      console.warn('Failed to load mock vendors from localStorage:', error);
    }
  }

  // Save mock vendors to localStorage
  private saveMockVendorsToStorage() {
    try {
      localStorage.setItem('mockVendors', JSON.stringify(this.mockVendors));
      console.log('Saved mock vendors to localStorage:', this.mockVendors.length);
    } catch (error) {
      console.warn('Failed to save mock vendors to localStorage:', error);
    }
  }

  // Mock data for offline functionality
  private mockVendors = [
    {
      id: 17,
      name: 'Test Vendor 1',
      email: 'test1@vendor.com',
      phone: '+251-911-234-567',
      website: 'https://testvendor1.com',
      address: 'Bole, Addis Ababa',
      status: 'active',
      services_provided: ['Catering', 'Event Planning'],
      average_rating: 4.8,
      total_quotations: 3,
      pending_quotations: 2,
      total_payments: 135000,
      pending_payments: 100000,
      last_activity: '2 hours ago',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2025-01-15T14:30:00Z',
      organizer: {
        id: 1,
        name: 'Validity Event & Marketing',
      },
    },
    {
      id: 18,
      name: 'Test Vendor 2',
      email: 'test2@vendor.com',
      phone: '+251-922-345-678',
      website: 'https://testvendor2.com',
      address: 'Kazanchis, Addis Ababa',
      status: 'active',
      services_provided: ['Photography', 'Videography'],
      average_rating: 4.9,
      total_quotations: 2,
      pending_quotations: 0,
      total_payments: 43000,
      pending_payments: 0,
      last_activity: '1 day ago',
      created_at: '2024-02-20T09:00:00Z',
      updated_at: '2025-01-14T16:45:00Z',
      organizer: {
        id: 1,
        name: 'Validity Event & Marketing',
      },
    },
  ];

  private mockQuotations = [
    {
      id: 1,
      vendor_id: 17,
      vendor_name: 'Test Vendor 1',
      quotation_number: 'QUO-2025-000001',
      amount: 45000,
      status: 'pending',
      event_name: 'Corporate Annual Meeting',
      description: 'Full catering service for 200 guests',
      created_at: '2025-01-15T10:00:00Z',
      due_date: '2025-01-20T18:00:00Z',
      event_date: '2025-01-25T09:00:00Z',
    },
    {
      id: 2,
      vendor_id: 18,
      vendor_name: 'Test Vendor 2',
      quotation_number: 'QUO-2025-000002',
      amount: 25000,
      status: 'approved',
      event_name: 'Wedding Ceremony',
      description: 'Full day photography and videography',
      created_at: '2025-01-14T14:30:00Z',
      due_date: '2025-01-18T17:00:00Z',
      event_date: '2025-01-22T08:00:00Z',
    },
    {
      id: 3,
      vendor_id: 17,
      vendor_name: 'Test Vendor 1',
      quotation_number: 'QUO-2025-000003',
      amount: 35000,
      status: 'pending',
      event_name: 'Tech Conference 2025',
      description: 'Audio equipment and sound system rental',
      created_at: '2025-01-13T09:15:00Z',
      due_date: '2025-01-17T16:00:00Z',
      event_date: '2025-01-20T10:00:00Z',
    },
    {
      id: 4,
      vendor_id: 18,
      vendor_name: 'Test Vendor 2',
      quotation_number: 'QUO-2025-000004',
      amount: 18000,
      status: 'rejected',
      event_name: 'Product Launch Event',
      description: 'Event photography and social media coverage',
      created_at: '2025-01-12T11:45:00Z',
      due_date: '2025-01-16T15:00:00Z',
      event_date: '2025-01-18T14:00:00Z',
    },
    {
      id: 5,
      vendor_id: 17,
      vendor_name: 'Test Vendor 1',
      quotation_number: 'QUO-2025-000005',
      amount: 55000,
      status: 'pending',
      event_name: 'Annual Gala Dinner',
      description: 'Premium catering and bar service for 300 guests',
      created_at: '2025-01-11T16:20:00Z',
      due_date: '2025-01-15T18:00:00Z',
      event_date: '2025-01-17T19:00:00Z',
    },
  ];

  private mockStatistics = {
    total_vendors: 2,
    active_vendors: 2,
    inactive_vendors: 0,
    pending_approval: 0,
    suspended_vendors: 0,
    total_quotations: 5,
    pending_quotations: 3,
    approved_quotations: 1,
    rejected_quotations: 1,
    total_payments: 178000,
    pending_payments: 135000,
    average_rating: 4.7,
    vendors_by_service: {
      'Catering': 3,
      'Photography': 2,
      'Audio Equipment': 2,
      'Floral Arrangements': 2,
      'Transportation': 1,
      'Event Planning': 2,
    },
    vendors_by_rating: {
      '5.0': 1,
      '4.5-4.9': 4,
      '4.0-4.4': 3,
      '3.5-3.9': 2,
      '3.0-3.4': 1,
      'Below 3.0': 1,
    },
    recent_activity: [
      {
        id: 1,
        type: 'quotation_approved',
        vendor_name: 'Premium Photography Studio',
        message: 'Quotation QUO-2025-000002 approved',
        timestamp: '2025-01-15T14:30:00Z',
      },
      {
        id: 2,
        type: 'vendor_added',
        vendor_name: 'New Catering Company',
        message: 'New vendor added to system',
        timestamp: '2025-01-15T10:15:00Z',
      },
      {
        id: 3,
        type: 'payment_received',
        vendor_name: 'Elite Catering Services',
        message: 'Payment of ETB 25,000 received',
        timestamp: '2025-01-14T16:45:00Z',
      },
    ],
  };

  // Get authentication headers
  private getAuthHeaders(isFormData = false) {
    // Get token from localStorage or sessionStorage (same as main API)
    const token = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
    
    // Don't auto-set test token - user must be properly authenticated
    // If no token, the request will fail with 401, which is expected behavior
    
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
    
    // Only set Content-Type for non-FormData requests
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  // Helper method for FormData requests
  getAuthHeadersForFormData() {
    return this.getAuthHeaders(true);
  }

  // Set a test token for development (remove in production)
  setTestToken(): void {
    localStorage.setItem('jwt', 'test-jwt-token-for-development');
    localStorage.setItem('user_role', 'organizer');
    localStorage.setItem('user_id', '6'); // Test Organizer user ID
    localStorage.setItem('organizer_id', '1');
  }

  // Generic API call with fallback
  private async apiCall<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackData: T
  ): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const cacheKey = `${endpoint}-${JSON.stringify(options)}`;
    
    // Return cached data if offline
    if (!this.isOnline && this.cache.has(cacheKey)) {
      console.log(`Using cached data for ${endpoint}`);
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(isFormData),
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.data?.data || data.data || data;
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      return result;
    } catch (error) {
      console.warn(`API call failed for ${endpoint}, using fallback data:`, error);
      
      // Return cached data if available, otherwise fallback data
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
      
      return fallbackData;
    }
  }

  // Utility function to ensure services_provided is always an array
  private normalizeServicesProvided(vendors: any[]): any[] {
    return vendors.map(vendor => ({
      ...vendor,
      services_provided: this.parseServicesProvided(vendor.services_provided)
    }));
  }

  private parseServicesProvided(services: any): string[] {
    if (typeof services === 'string') {
      try {
        const parsed = JSON.parse(services);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }
    return Array.isArray(services) ? services : [];
  }

  // Clear cached vendor data to ensure fresh data
  clearVendorCache(): void {
    localStorage.removeItem('mockVendors');
    localStorage.removeItem('mockQuotations');
    localStorage.removeItem('mockStatistics');
    this.cache.clear();
  }

  // Vendor methods
  async getVendors(params: any = {}): Promise<any[]> {
    // Clean up params - remove undefined, null, or 'all' values
    const cleanParams: any = {};
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null && value !== 'all' && value !== '') {
        cleanParams[key] = value;
      }
    });
    
    const queryString = new URLSearchParams(cleanParams).toString();
    const endpoint = `/vendors${queryString ? `?${queryString}` : ''}`;
    console.log('Fetching vendors from:', endpoint, 'with clean params:', cleanParams);
    
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // If 401, throw error instead of falling back to mock data
        // This allows the error to propagate and be handled by React Query
        if (response.status === 401) {
          throw new Error(`HTTP ${response.status}: Unauthorized - Please log in again`);
        }
        // For other errors, fall back to mock data if available
        console.warn(`API request failed (${response.status}), falling back to mock data`);
        return this.getVendorsFromMock(params);
      }

      const data = await response.json();
      console.log('Vendors API response:', {
        success: data.success,
        total: data.data?.total,
        count: data.data?.data?.length,
        filters: data.filters,
        firstVendor: data.data?.data?.[0]
      });
      
      // Handle paginated response from Laravel
      if (data.success && data.data && data.data.data) {
        // Laravel paginated response: { success: true, data: { data: [...], current_page: 1, ... } }
        const apiVendors = data.data.data;
        console.log(`Returning ${apiVendors.length} vendors from API`);
        return this.normalizeServicesProvided(apiVendors);
      } else if (data.success && Array.isArray(data.data)) {
        // Direct array response: { success: true, data: [...] }
        const apiVendors = data.data;
        console.log(`Returning ${apiVendors.length} vendors from API (direct array)`);
        return this.normalizeServicesProvided(apiVendors);
      } else if (Array.isArray(data)) {
        // Direct array response: [...]
        const apiVendors = data;
        console.log(`Returning ${apiVendors.length} vendors from API (root array)`);
        return this.normalizeServicesProvided(apiVendors);
      }
      
      // If we get here, the response format is unexpected
      console.warn('Unexpected response format from vendors API:', data);
      return this.getVendorsFromMock(params);
    } catch (error) {
      // Network error or other failure - fall back to mock data
      console.warn(`Failed to fetch vendors from API, using mock data:`, error);
      return this.getVendorsFromMock(params);
    }
  }

  // Get vendors from mock data with filtering
  private getVendorsFromMock(params: any = {}): any[] {
    let filteredVendors = [...this.mockVendors];

    // Apply search filter
    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filteredVendors = filteredVendors.filter(v => 
        v.name?.toLowerCase().includes(searchLower) ||
        v.email?.toLowerCase().includes(searchLower) ||
        v.phone?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (params.status && params.status !== 'all') {
      filteredVendors = filteredVendors.filter(v => v.status === params.status);
    }

    return this.normalizeServicesProvided(filteredVendors);
  }

  async getVendor(id: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(`HTTP ${response.status}: Unauthorized - Please log in again`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle API response format
      if (data.success && data.data) {
        return this.normalizeServicesProvided([data.data])[0];
      } else if (data.data) {
        return this.normalizeServicesProvided([data.data])[0];
      }
      
      // Fallback to mock data
      const vendor = this.mockVendors.find(v => v.id === id);
      if (vendor) {
        return this.normalizeServicesProvided([vendor])[0];
      }
      
      throw new Error('Vendor not found');
    } catch (error) {
      console.warn(`Failed to fetch vendor ${id} from API, using mock data:`, error);
      
      // Fallback to mock data
      const vendor = this.mockVendors.find(v => v.id === id);
      if (vendor) {
        return this.normalizeServicesProvided([vendor])[0];
      }
      
      throw error;
    }
  }

  async createVendor(data: any): Promise<any> {
    // Process data: convert services_provided array to JSON string
    let processedData = data;
    if (!(data instanceof FormData)) {
      processedData = { ...data };
      if (Array.isArray(processedData.services_provided)) {
        processedData.services_provided = JSON.stringify(processedData.services_provided);
      }
    }

    // Handle FormData vs regular data
    const requestOptions: RequestInit = {
      method: 'POST',
    };

    if (processedData instanceof FormData) {
      requestOptions.body = processedData;
      // Don't set Content-Type for FormData, let browser set it with boundary
    } else {
      requestOptions.body = JSON.stringify(processedData);
      requestOptions.headers = {
        'Content-Type': 'application/json',
      };
    }

    try {
      console.log('Creating vendor with data:', processedData instanceof FormData ? 'FormData' : processedData);
      
      const response = await fetch(`${this.baseURL}/vendors`, {
        ...requestOptions,
        headers: {
          ...this.getAuthHeaders(processedData instanceof FormData),
          ...requestOptions.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Vendor creation API error:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          errors: errorData.errors,
          sentData: data instanceof FormData ? 'FormData' : processedData
        });
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      console.log('Vendor creation API response:', result);
      
      // If successful, add to mock data for offline fallback
      if (result.success && result.data) {
        const newVendor = {
          ...result.data,
          total_quotations: 0,
          pending_quotations: 0,
          total_payments: 0,
          pending_payments: 0,
          last_activity: 'Just now',
        };
        this.mockVendors.push(newVendor);
        // Save to localStorage and clear cache to force refresh
        this.saveMockVendorsToStorage();
        this.cache.clear();
        console.log('Vendor added to mock data and cache cleared');
        return result.data;
      }
      
      console.warn('Unexpected vendor creation response format:', result);
      return result;
    } catch (error) {
      // Don't create mock data on validation errors (422) - these are real errors
      // Only create mock data for network/server errors where we can't reach the API
      const errorResponse = (error as any)?.response;
      const isValidationError = errorResponse?.status === 422;
      
      if (isValidationError) {
        // For validation errors, re-throw so the UI can show the error properly
        // Don't create mock data as the vendor wasn't actually created
        throw error;
      }
      
      console.warn('Failed to create vendor via API, using mock data:', error);
      
      // Extract data from FormData if needed
      let vendorData = {};
      if (data instanceof FormData) {
        // Convert FormData to object for mock creation
        for (const [key, value] of data.entries()) {
          if (key === 'services_provided') {
            try {
              vendorData[key] = JSON.parse(value as string);
            } catch {
              vendorData[key] = [value as string];
            }
          } else {
            vendorData[key] = value;
          }
        }
      } else {
        vendorData = data;
      }
      
      // Fallback to mock data only for non-validation errors
      const newVendor = {
        id: this.mockVendors.length + 1,
        ...vendorData,
        status: 'pending_approval',
        average_rating: 0,
        total_quotations: 0,
        pending_quotations: 0,
        total_payments: 0,
        pending_payments: 0,
        last_activity: 'Just now',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      this.mockVendors.push(newVendor);
      // Save to localStorage and clear cache to force refresh
      this.saveMockVendorsToStorage();
      this.cache.clear();
      return newVendor;
    }
  }

  // Method to clear cache and force refresh
  clearCache() {
    this.cache.clear();
  }

  // Method to clear all mock data (for testing)
  clearMockData() {
    this.mockVendors = [];
    localStorage.removeItem('mockVendors');
    this.cache.clear();
  }

  // Update vendor method
  async updateVendor(id: number, data: any): Promise<any> {
    // Process data: convert services_provided array to JSON string if it's an array
    const processedData = { ...data };
    if (Array.isArray(processedData.services_provided)) {
      processedData.services_provided = JSON.stringify(processedData.services_provided);
    }

    try {
      const response = await fetch(`${this.baseURL}/vendors/${id}`, {
        method: 'PUT',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processedData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update mock data if successful
      if (result.success && result.data) {
        const vendorIndex = this.mockVendors.findIndex(v => v.id === id);
        if (vendorIndex !== -1) {
          this.mockVendors[vendorIndex] = {
            ...this.mockVendors[vendorIndex],
            ...result.data,
            updated_at: new Date().toISOString(),
          };
          this.saveMockVendorsToStorage();
        }
        return result.data;
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to update vendor via API, updating mock data:', error);
      
      // Fallback: Update mock data
      const vendorIndex = this.mockVendors.findIndex(v => v.id === id);
      if (vendorIndex !== -1) {
        this.mockVendors[vendorIndex] = {
          ...this.mockVendors[vendorIndex],
          ...data,
          updated_at: new Date().toISOString(),
        };
        this.saveMockVendorsToStorage();
        return this.mockVendors[vendorIndex];
      }
      
      throw error;
    }
  }

  // Create quotation method
  async createQuotation(data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/quotations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.warn('Failed to create quotation via API:', error);
      
      // Fallback: Create mock quotation and add to mock data
      // For organizers, quotations are automatically approved
      const userRole = localStorage.getItem('user_role') || 'organizer';
      const mockQuotation = {
        id: Date.now(),
        ...data,
        status: 'pending', // All quotations now require manual approval
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        approved_at: null,
        approved_by: null,
      };
      
      // Add to mock quotations array so it appears in the list
      this.mockQuotations.push(mockQuotation);
      
      // Update vendor's quotation counts
      const vendorIndex = this.mockVendors.findIndex(v => v.id === data.vendor_id);
      if (vendorIndex !== -1) {
        this.mockVendors[vendorIndex].total_quotations = (this.mockVendors[vendorIndex].total_quotations || 0) + 1;
        // All quotations are now pending approval
        this.mockVendors[vendorIndex].pending_quotations = (this.mockVendors[vendorIndex].pending_quotations || 0) + 1;
        this.saveMockVendorsToStorage();
      }
      
      // Update global statistics
      this.mockStatistics.total_quotations = (this.mockStatistics.total_quotations || 0) + 1;
      this.mockStatistics.pending_quotations = (this.mockStatistics.pending_quotations || 0) + 1;
      
      return mockQuotation;
    }
  }

  // Get quotations method
  async getQuotations(params: any = {}): Promise<any[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `/vendors/quotations${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        // If 401, throw error instead of falling back to mock data
        if (response.status === 401) {
          throw new Error(`HTTP ${response.status}: Unauthorized - Please log in again`);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      let quotations = [];
      if (data.success && Array.isArray(data.data)) {
        quotations = data.data;
      } else if (Array.isArray(data)) {
        quotations = data;
      }
      
      // Sort quotations by creation date (newest first)
      return quotations.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } catch (error) {
      // Re-throw the error so React Query can handle it properly
      console.error('Failed to fetch quotations from API:', error);
      throw error;
    }
  }



  async deleteVendor(id: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      
      // If successful, remove from mock data
      if (result.success) {
        const vendorIndex = this.mockVendors.findIndex(v => v.id === id);
        if (vendorIndex !== -1) {
          this.mockVendors.splice(vendorIndex, 1);
          this.saveMockVendorsToStorage();
        }
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to delete vendor via API:', error);
      
      // Fallback: Remove from mock data
      const vendorIndex = this.mockVendors.findIndex(v => v.id === id);
      if (vendorIndex !== -1) {
        this.mockVendors.splice(vendorIndex, 1);
        this.saveMockVendorsToStorage();
      }
      
      throw error;
    }
  }

  // Hard delete vendor (superadmin, admin, and organizer - with access control)
  async hardDeleteVendor(id: number): Promise<any> {
    // First check if vendor exists in our current data
    const existingVendors = await this.getVendors();
    const vendorExists = existingVendors.some(v => v.id === id);
    
    if (!vendorExists) {
      throw new Error(`Vendor with ID ${id} not found. Please refresh the page and try again.`);
    }

    try {
      const response = await fetch(`${this.baseURL}/vendors/${id}/hard-delete`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      
      // If successful, remove from mock data
      if (result.success) {
        const vendorIndex = this.mockVendors.findIndex(v => v.id === id);
        if (vendorIndex !== -1) {
          this.mockVendors.splice(vendorIndex, 1);
          this.saveMockVendorsToStorage();
        }
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to hard delete vendor via API:', error);
      
      // Fallback: Remove from mock data
      const vendorIndex = this.mockVendors.findIndex(v => v.id === id);
      if (vendorIndex !== -1) {
        this.mockVendors.splice(vendorIndex, 1);
        this.saveMockVendorsToStorage();
      }
      
      throw error;
    }
  }


  async getQuotation(id: number): Promise<any> {
    const quotation = this.mockQuotations.find(q => q.id === id);
    return this.apiCall(`/vendors/quotations/${id}`, { method: 'GET' }, quotation);
  }


  async approveQuotation(id: number): Promise<any> {
    const quotationIndex = this.mockQuotations.findIndex(q => q.id === id);
    if (quotationIndex !== -1) {
      const quotation = this.mockQuotations[quotationIndex];
      quotation.status = 'approved';
      
      // Update vendor's quotation counts
      const vendorIndex = this.mockVendors.findIndex(v => v.id === quotation.vendor_id);
      if (vendorIndex !== -1) {
        this.mockVendors[vendorIndex].pending_quotations = Math.max(0, (this.mockVendors[vendorIndex].pending_quotations || 0) - 1);
        this.mockVendors[vendorIndex].approved_quotations = (this.mockVendors[vendorIndex].approved_quotations || 0) + 1;
        this.saveMockVendorsToStorage();
      }
      
      // Update global statistics
      this.mockStatistics.pending_quotations = Math.max(0, (this.mockStatistics.pending_quotations || 0) - 1);
      this.mockStatistics.approved_quotations = (this.mockStatistics.approved_quotations || 0) + 1;
    }

    return this.apiCall(`/vendors/quotations/${id}/approve`, {
      method: 'POST',
    }, { success: true });
  }

  async rejectQuotation(id: number): Promise<any> {
    const quotationIndex = this.mockQuotations.findIndex(q => q.id === id);
    if (quotationIndex !== -1) {
      const quotation = this.mockQuotations[quotationIndex];
      quotation.status = 'rejected';
      
      // Update vendor's quotation counts
      const vendorIndex = this.mockVendors.findIndex(v => v.id === quotation.vendor_id);
      if (vendorIndex !== -1) {
        this.mockVendors[vendorIndex].pending_quotations = Math.max(0, (this.mockVendors[vendorIndex].pending_quotations || 0) - 1);
        this.mockVendors[vendorIndex].rejected_quotations = (this.mockVendors[vendorIndex].rejected_quotations || 0) + 1;
        this.saveMockVendorsToStorage();
      }
      
      // Update global statistics
      this.mockStatistics.pending_quotations = Math.max(0, (this.mockStatistics.pending_quotations || 0) - 1);
      this.mockStatistics.rejected_quotations = (this.mockStatistics.rejected_quotations || 0) + 1;
    }

    return this.apiCall(`/vendors/quotations/${id}/reject`, {
      method: 'POST',
    }, { success: true });
  }

  // Statistics
  async getStatistics(): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/statistics`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle API response structure
      if (data.success && data.data) {
        return data.data;
      } else if (data.success) {
        return data;
      }
      
      // If we get here, the response format is unexpected
      console.warn('Unexpected response format from statistics API:', data);
      return {};
    } catch (error) {
      // Re-throw the error so React Query can handle it properly
      console.error('Failed to fetch statistics from API:', error);
      throw error;
    }
  }

  // Bulk operations
  async bulkOperations(operation: string, vendorIds: number[]): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/bulk-operations`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ operation, vendor_ids: vendorIds }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const result = await response.json();
      
      // If successful, update mock data
      if (result.success && result.data) {
        vendorIds.forEach(id => {
          const vendor = this.mockVendors.find(v => v.id === id);
          if (vendor) {
            switch (operation) {
              case 'activate':
                vendor.status = 'active';
                break;
              case 'deactivate':
                vendor.status = 'inactive';
                break;
              case 'delete':
                const index = this.mockVendors.findIndex(v => v.id === id);
                if (index !== -1) this.mockVendors.splice(index, 1);
                break;
            }
          }
        });
        this.saveMockVendorsToStorage();
      }
      
      return result;
    } catch (error) {
      console.warn('Failed to perform bulk operation via API:', error);
      
      // Fallback: Update mock data
      const results = vendorIds.map(id => {
        const vendor = this.mockVendors.find(v => v.id === id);
        if (vendor) {
          switch (operation) {
            case 'activate':
              vendor.status = 'active';
              break;
            case 'deactivate':
              vendor.status = 'inactive';
              break;
            case 'delete':
              const index = this.mockVendors.findIndex(v => v.id === id);
              if (index !== -1) this.mockVendors.splice(index, 1);
              break;
          }
        }
        return { id, success: true };
      });
      
      this.saveMockVendorsToStorage();
      return { results };
    }
  }


  // Get cache status
  getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  // Get organizer events for dropdown
  async getOrganizerEvents(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/organizer-events`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.warn('Failed to fetch organizer events via API:', error);
      
      // Fallback: Return mock events
      return [
        {
          id: 1,
          title: 'Annual Conference 2025',
          start_date: '2025-03-15',
          end_date: '2025-03-17',
          location: 'Addis Ababa, Ethiopia'
        },
        {
          id: 2,
          title: 'Tech Summit 2025',
          start_date: '2025-04-20',
          end_date: '2025-04-22',
          location: 'Nairobi, Kenya'
        }
      ];
    }
  }

  // Get approved quotations for a vendor
  async getApprovedQuotations(vendorId: number): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/${vendorId}/approved-quotations`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : [];
    } catch (error) {
      console.warn('Failed to fetch approved quotations via API:', error);
      
      // Fallback: Return mock approved quotations
      return [
        {
          id: 1,
          quotation_number: 'Q-001',
          amount: 25000,
          description: 'Full catering service for 100 guests',
          event_id: 1,
          valid_until: '2025-02-15',
          event: {
            id: 1,
            title: 'Annual Conference 2025',
            start_date: '2025-03-15'
          }
        },
        {
          id: 2,
          quotation_number: 'Q-002',
          amount: 15000,
          description: 'Event photography package',
          event_id: 2,
          valid_until: '2025-02-20',
          event: {
            id: 2,
            title: 'Tech Summit 2025',
            start_date: '2025-04-20'
          }
        }
      ];
    }
  }

  // RFQ Invites
  async getRfqInvites(params: any = {}): Promise<any[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${this.baseURL}/vendors/rfq-invites${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? (data.data?.data || data.data || []) : [];
    } catch (error) {
      console.error('Failed to fetch RFQ invites:', error);
      throw error;
    }
  }

  async updateRfqInvite(id: number, data: any): Promise<any> {
    try {
      const headers = this.getAuthHeaders();
      headers['Content-Type'] = 'application/json';
      
      const response = await fetch(`${this.baseURL}/vendors/rfq-invites/${id}`, {
        method: 'PUT',
        headers: headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to update RFQ invite:', error);
      throw error;
    }
  }

  // Vendor Reviews
  async getReviews(params: any = {}): Promise<any[]> {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${this.baseURL}/vendors/reviews${queryString ? `?${queryString}` : ''}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? (data.data?.data || data.data || []) : [];
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      throw error;
    }
  }

  async createReview(data: any): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/reviews`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to create review:', error);
      throw error;
    }
  }

  async getVendorReliabilityScore(vendorId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/vendors/${vendorId}/reliability-score`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : {};
    } catch (error) {
      console.error('Failed to fetch reliability score:', error);
      throw error;
    }
  }

  // Deliverable Updates
  async addDeliverableUpdate(deliverableId: number, data: FormData): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/deliverables/${deliverableId}/updates`, {
        method: 'POST',
        headers: this.getAuthHeaders(true),
        body: data,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data || result;
    } catch (error) {
      console.error('Failed to add deliverable update:', error);
      throw error;
    }
  }

  async getDeliverableUpdates(deliverableId: number): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseURL}/deliverables/${deliverableId}/updates`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? (data.data || []) : [];
    } catch (error) {
      console.error('Failed to fetch deliverable updates:', error);
      throw error;
    }
  }

  // Compare quotations
  async compareQuotations(quotationId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/quotations/${quotationId}/compare`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.success ? data.data : {};
    } catch (error) {
      console.error('Failed to compare quotations:', error);
      throw error;
    }
  }

  // Lookup business information by TIN number
  async lookupByTin(tinNumber: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseURL}/vendors/lookup-by-tin/${tinNumber}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = { data: errorData, status: response.status };
        throw error;
      }

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Failed to lookup business info by TIN:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vendorApi = new VendorApiService();
export default vendorApi;
