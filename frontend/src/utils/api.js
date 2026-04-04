/**
 * API Utility Functions
 * Automatically includes authentication token in all requests
 */

/**
 * Get authentication headers with token
 * @returns {Object} Headers object with Authorization token
 */
export const getAuthHeaders = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user.token;
  
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

/**
 * Authenticated fetch wrapper
 * Automatically includes auth token in headers
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>} Fetch response
 */
export const authFetch = async (url, options = {}) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = user.token;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };
  
  // Merge options, with user options taking precedence
  const mergedOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  };
  
  return fetch(url, mergedOptions);
};

/**
 * GET request with auth
 */
export const authGet = (url) => authFetch(url, { method: 'GET' });

/**
 * POST request with auth
 */
export const authPost = (url, body) => authFetch(url, {
  method: 'POST',
  body: JSON.stringify(body)
});

/**
 * PUT request with auth
 */
export const authPut = (url, body) => authFetch(url, {
  method: 'PUT',
  body: JSON.stringify(body)
});

/**
 * DELETE request with auth
 */
export const authDelete = (url) => authFetch(url, { method: 'DELETE' });
