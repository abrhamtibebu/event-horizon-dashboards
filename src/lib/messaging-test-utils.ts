import { Message } from '../types/message'

// Mock data for testing
export const mockMessages: Message[] = [
  {
    id: 1,
    event_id: 1,
    sender_id: 1,
    recipient_id: 2,
    content: 'Hello! This is a **bold** message with *italic* text and a [link](https://example.com)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    sender: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      profile_image: null
    },
    recipient: {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      profile_image: null
    },
    event: {
      id: 1,
      title: 'Test Event',
      image_url: null
    }
  },
  {
    id: 2,
    sender_id: 2,
    recipient_id: 1,
    content: 'Here\'s a code example: `const message = "Hello World"` and some ~~strikethrough~~ text',
    created_at: new Date(Date.now() - 60000).toISOString(),
    updated_at: new Date(Date.now() - 60000).toISOString(),
    sender: {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      profile_image: null
    },
    recipient: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      profile_image: null
    }
  },
  {
    id: 3,
    event_id: 1,
    sender_id: 1,
    recipient_id: 2,
    content: 'Check out this URL: https://github.com and mention @jane',
    file_path: '/uploads/test-image.jpg',
    file_name: 'test-image.jpg',
    file_type: 'image/jpeg',
    file_size: 1024000,
    created_at: new Date(Date.now() - 120000).toISOString(),
    updated_at: new Date(Date.now() - 120000).toISOString(),
    sender: {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      profile_image: null
    },
    recipient: {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      profile_image: null
    },
    event: {
      id: 1,
      title: 'Test Event',
      image_url: null
    }
  }
]

export const mockOptimisticMessage = {
  id: 'temp-1',
  sender_id: 1,
  recipient_id: 2,
  content: 'This is an optimistic message that should appear immediately',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  sender: {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    profile_image: null
  },
  recipient: {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    profile_image: null
  },
  isOptimistic: true,
  status: 'sending' as const,
  tempId: 'temp-1'
}

// Test cases for message formatting
export const formattingTestCases = [
  {
    input: 'Hello **world**!',
    expected: 'Hello <strong class="font-semibold">world</strong>!',
    description: 'Bold text formatting'
  },
  {
    input: 'This is *italic* text',
    expected: 'This is <em class="italic">italic</em> text',
    description: 'Italic text formatting'
  },
  {
    input: '~~Strikethrough~~ text',
    expected: '<del class="line-through">Strikethrough</del> text',
    description: 'Strikethrough text formatting'
  },
  {
    input: 'Code: `const x = 1`',
    expected: 'Code: <code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">const x = 1</code>',
    description: 'Inline code formatting'
  },
  {
    input: 'Visit https://example.com for more info',
    expected: 'Visit <a href="https://example.com" target="_blank" rel="noopener noreferrer" class="text-blue-500 hover:text-blue-700 underline">https://example.com</a> for more info',
    description: 'URL linkification'
  },
  {
    input: 'Mention @john and hashtag #event',
    expected: 'Mention <span class="text-blue-600 font-medium bg-blue-50 px-1 rounded">@john</span> and hashtag <span class="text-purple-600 font-medium bg-purple-50 px-1 rounded">#event</span>',
    description: 'Mention and hashtag formatting'
  }
]

// Performance test data
export const generateLargeMessageList = (count: number): Message[] => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    sender_id: (index % 2) + 1,
    recipient_id: ((index + 1) % 2) + 1,
    content: `Message ${index + 1}: This is a test message with some content to simulate real usage patterns.`,
    created_at: new Date(Date.now() - index * 60000).toISOString(),
    updated_at: new Date(Date.now() - index * 60000).toISOString(),
    sender: {
      id: (index % 2) + 1,
      name: index % 2 === 0 ? 'John Doe' : 'Jane Smith',
      email: index % 2 === 0 ? 'john@example.com' : 'jane@example.com',
      profile_image: null
    },
    recipient: {
      id: ((index + 1) % 2) + 1,
      name: (index + 1) % 2 === 0 ? 'John Doe' : 'Jane Smith',
      email: (index + 1) % 2 === 0 ? 'john@example.com' : 'jane@example.com',
      profile_image: null
    }
  }))
}

// Test utilities
export const testUtils = {
  // Simulate network delay
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock API response
  mockApiResponse: <T>(data: T, delay: number = 100) => 
    testUtils.delay(delay).then(() => ({ data })),
  
  // Generate test conversation ID
  generateConversationId: (type: 'event' | 'direct', id: number) => 
    `${type}_${id}`,
  
  // Create test user
  createTestUser: (id: number, name: string, email: string) => ({
    id,
    name,
    email,
    profile_image: null
  }),
  
  // Create test event
  createTestEvent: (id: number, title: string) => ({
    id,
    title,
    image_url: null
  })
}

export default {
  mockMessages,
  mockOptimisticMessage,
  formattingTestCases,
  generateLargeMessageList,
  testUtils
}



