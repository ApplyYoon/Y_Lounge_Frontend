// Centralized Configuration
// In production (CloudType), set VITE_API_URL environment variable.
// In development, it defaults to the local backend.

const hostname = window.location.hostname;
const startUrl = import.meta.env.VITE_API_URL || `http://${hostname}:8080`;

// Ensure no trailing slash for consistency
export const API_BASE_URL = startUrl.endsWith('/') ? startUrl.slice(0, -1) : startUrl;
export const WS_BASE_URL = `${API_BASE_URL}/ws`; // WebSocket endpoint
