import axios from 'axios';

/**
 * Shared axios instance for all client-side API calls.
 * Automatically sets Content-Type and handles base URL.
 */
export const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});
