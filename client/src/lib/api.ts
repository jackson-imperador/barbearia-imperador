import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create central Axios instance
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://barbearia-imperador.onrender.com',
  timeout: 0, // Sem timeout — uploads de vídeo grandes podem demorar vários minutos
  withCredentials: true, // Crucial for sending/receiving secure httpOnly cookies
});

// Request Interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Generate Request ID for tracing
    config.headers['X-Request-ID'] = Math.random().toString(36).substring(2, 15);
    
    // Attach JWT token from localStorage if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for generic error handling and JWT Refresh
api.interceptors.response.use(
  (response) => {
    // Automatically unwrap NestJS TransformInterceptor { data: ... } wrapper
    if (response.data && response.data.data !== undefined) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.error('[API Error]', {
      url: originalRequest?.url,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Handle 401 Unauthorized (JWT Expired or Invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Do not attempt to refresh if the 401 came from the login route itself
      if (originalRequest.url?.includes('/auth/login')) {
        let msg = 'Invalid credentials';
        if (error.response?.data && typeof error.response.data === 'object' && (error.response.data as any).message) {
          msg = (error.response.data as any).message;
        }
        return Promise.reject(new Error(msg));
      }
      
      originalRequest._retry = true;
      try {
        const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        const refreshRes = await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          { refreshToken: storedRefreshToken },
          { withCredentials: true }
        );
        
        const newAccessToken = refreshRes.data?.data?.accessToken || refreshRes.data?.accessToken;
        const newRefreshToken = refreshRes.data?.data?.refreshToken || refreshRes.data?.refreshToken;
        if (newAccessToken) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('accessToken', newAccessToken);
            if (newRefreshToken) {
              localStorage.setItem('refreshToken', newRefreshToken);
            }
            document.cookie = `accessToken=${newAccessToken}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
          }
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
        }
        
        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('[API 403] Forbidden access to:', originalRequest?.url);
    }

    // Handle 500 Internal Server Error
    if (error.response?.status === 500) {
      console.error('[API 500] Internal Server Error:', error.message);
    }

    let extractedMessage = error.message;
    if (error.response?.data) {
      if (typeof error.response.data === 'object') {
        const d = error.response.data as any;
        extractedMessage = d.error?.message || d.message || error.message;
      } else if (typeof error.response.data === 'string') {
        extractedMessage = error.response.data;
      }
    }

    // Map error for consistent UI handling
    const mappedError = {
      message: extractedMessage || 'An unexpected error occurred',
      statusCode: error.response?.status || 500,
      response: error.response,
      requestId: error.response?.headers?.['x-request-id'] || originalRequest?.headers['X-Request-ID'],
    };

    return Promise.reject(mappedError);
  }
);
