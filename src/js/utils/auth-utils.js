import { RateLimit } from "./rate-limit-utils.js";
import { createToast } from './toast-utils.js';

export function fetchWithAuth(url, options = {}) {
  const token = localStorage.getItem("access_token");
  
  if (!token) {
    redirectToLogin();
    return Promise.reject("No auth token");
  }
  
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`
  };
  
  return fetch(url, options)
    .then(response => {
      if (response.status === 401) {
        return refreshToken()
          .then(success => {
            if (success) {
              const newToken = localStorage.getItem("access_token");
              options.headers.Authorization = `Bearer ${newToken}`;
              return fetch(url, options);
            } else {
              localStorage.removeItem("access_token");
              redirectToLogin();
              return response;
            }
          })
          .catch(() => {
            localStorage.removeItem("access_token");
            redirectToLogin();
            return response;
          });
      }
      return response;
    });
}

async function refreshToken() {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return false;
    
    const response = await fetch('/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("access_token", data.access_token);
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
}

export async function getUserId() {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    throw new Error('No access token found. User must be logged in.');
  }
  
  try {
    const response = await fetchWithAuth('/auth/get_user_id');
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch user ID: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Authentication expired. Please log in again.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. The server might have restarted.';
      }
      
      createToast(errorMessage, 'error');
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data.user_id;
  } catch (error) {
    console.error('Error fetching user ID:', error);
    throw error;
  }
}

export function getAuthToken() {
  return localStorage.getItem('access_token');
}

export function isAuthenticated() {
  return !!localStorage.getItem('access_token');
}

export function redirectToLogin() {
  window.location.href = '/auth/login';
}

const serverCheckRateLimit = new RateLimit(5000);

export async function checkServerConnection() {
  if (!serverCheckRateLimit.check()) return;
  
  try {
    const response = await fetch('/api/health-check', { 
      method: 'GET',
      cache: 'no-store'
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export function setupServerReconnection() {
  let serverAvailable = true;
  
  setInterval(async () => {
    const isAvailable = await checkServerConnection();
    
    if (!isAvailable && serverAvailable) {
      serverAvailable = false;
      createToast("Server connection lost. Waiting for reconnection...", "warning", {
        duration: 0,
        id: "server-connection-toast"
      });
    } else if (isAvailable && !serverAvailable) {
      serverAvailable = true;
      
      const connectionToast = document.getElementById("server-connection-toast");
      if (connectionToast) {
        dismissToast(connectionToast);
      }
      
      const success = await refreshToken();
      if (!success && isAuthenticated()) {
        createToast("Server restarted. Please log in again.", "error", {
          duration: 5000,
          action: {
            text: "Login",
            callback: redirectToLogin
          }
        });
      } else {
        createToast("Server connection restored!", "success");
      }
    }
  }, 5000);
}

export async function getUserData() {
  try {
    const response = await fetchWithAuth('/auth/get_user_data');
    
    if (!response.ok) {
      let errorMessage = `Failed to fetch user data: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Authentication expired. Please log in again.';
      } else if (response.status === 500) {
        errorMessage = 'Server error. The server might have restarted.';
      }
      
      createToast(errorMessage, 'error');
      throw new Error(errorMessage);
    }
    
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}