import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

console.log('🔧 API Service initialized with URL:', API_URL)

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
})

// Request interceptor to add auth token and log requests
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data)
    return config
  },
  (error) => {
    console.error('📤 API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.config.url}`, response.status)
    return response
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('📥 API Error Response:', {
        status: error.response.status,
        data: error.response.data,
        url: error.config?.url,
      })
    } else if (error.request) {
      // Request made but no response received (network error)
      console.error('📥 API Network Error:', {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      })
    } else {
      // Error in setting up request
      console.error('📥 API Setup Error:', error.message)
    }

    // Provide user-friendly error message
    let userMessage = 'An error occurred'

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      userMessage = `Network Error: Cannot connect to backend at ${API_URL}. Please check that the backend service is running.`
    } else if (error.code === 'ECONNREFUSED') {
      userMessage = `Connection Refused: Backend at ${API_URL} is not accessible. Is the backend service running?`
    } else if (error.response) {
      userMessage = error.response.data?.error || `Server error: ${error.response.status}`
    } else if (error.message) {
      userMessage = error.message
    }

    // Add user-friendly message to error object
    error.userMessage = userMessage

    return Promise.reject(error)
  }
)

// ==================== COLUMN API ====================

 export const columnApi = {
  getAll: () => api.get('/board/columns'),
  getOne: (id: string) => api.get(`/board/columns/${id}`),
  create: (data: { name: string; board_id?: string; position?: number }) =>
    api.post('/board/columns', data),
  update: (id: string, data: { name?: string; position?: number }) =>
    api.put(`/board/columns/${id}`, data),
  delete: (id: string) => api.delete(`/board/columns/${id}`),
  reorder: (columns: Array<{ id: string; position: number }>) =>
    api.put('/board/columns/reorder', { columns }),
}

// ==================== CARD API ====================

 export const cardApi = {
  getAll: (columnId?: string) => api.get('/board/cards', { params: { column_id: columnId } }),
  getOne: (id: string) => api.get(`/board/cards/${id}`),
  create: (data: { column_id: string; title: string; description?: string; position?: number; metadata?: any }) =>
    api.post('/board/cards', data),
  update: (id: string, data: { title?: string; description?: string; column_id?: string; position?: number; metadata?: any }) =>
    api.put(`/board/cards/${id}`, data),
  delete: (id: string) => api.delete(`/board/cards/${id}`),
  move: (id: string, data: { column_id: string; position?: number }) =>
    api.patch(`/board/cards/${id}/move`, data),
}

export default api
