import { API_BASE_URL as DEFAULT_API_BASE_URL } from '../config';

let API_BASE_URL = DEFAULT_API_BASE_URL;

export const setApiBaseUrl = (url) => {
    API_BASE_URL = url;
    console.log(`API Base URL updated to: ${API_BASE_URL}`);
};

export const getApiBaseUrl = () => API_BASE_URL;

const getAuthHeaders = () => {
    return {
        'Content-Type': 'application/json',
    };
};

// Generic fetch wrapper for better error handling and logging
async function callApi(endpoint, options, baseUrlOverride = null) {
    const url = `${baseUrlOverride || API_BASE_URL}${endpoint}`;
    try {
        const response = await fetch(url, options);

        if (response.headers.get('content-type')?.includes('application/json')) {
            const result = await response.json();
            if (!response.ok) {
                console.error(`API Error for ${endpoint}:`, result);
                throw new Error(result.message || `API call failed for ${endpoint} with status ${response.status}.`);
            }
            return result;
        } else {
            // If not JSON, it's likely an HTML error page
            const text = await response.text();
            console.error(`API Error for ${endpoint}: Expected JSON, but received HTML/Text.`, text);
            throw new Error(`API call for ${endpoint} returned non-JSON response. Status: ${response.status}. Content: ${text.substring(0, 200)}...`);
        }
    } catch (error) {
        console.error(`Network or unexpected error for ${endpoint}:`, error);
        throw error; // Re-throw to be caught by component
    }
}

// --- EVENTS ---
export const getEvents = async () => {
    const result = await callApi('/api/admin/events', { headers: getAuthHeaders() });
    return result.events;
};

export const createEvent = async (eventId) => {
    const result = await callApi('/api/admin/create-event', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ eventId }),
    });
    return result.event;
};

// --- AUTH (login function kept for completeness, though UI is removed) ---
export const login = async (username, password) => {
    const result = await callApi('/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });
    return result;
};

// --- TICKETS ---
export const getTickets = async (eventId) => {
    const result = await callApi(`/api/admin/tickets/${eventId}`, { headers: getAuthHeaders() });
    return result.tickets;
};

export const updateTicket = async (eventId, ticketId, ticket) => {
    const result = await callApi(`/api/admin/update-ticket/${eventId}/${ticketId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticket),
    });
    return result;
};

export const deleteTicket = async (eventId, ticketId) => {
    const result = await callApi(`/api/admin/delete-ticket/${eventId}/${ticketId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    return result;
};

export const createTicket = async (eventId, attendeeName, attendeeEmail) => {
    const result = await callApi(`/api/admin/create-ticket/${eventId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ attendeeName, attendeeEmail }),
    });
    return result;
};

export const updateTicketStatus = async (eventId, ticketId, action) => {
    const result = await callApi(`/api/admin/update-ticket-status/${eventId}/${ticketId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ action }),
    });
    return result;
};

// --- SYSTEM ---
export const getScannerToken = async () => {
    const result = await callApi('/auth/scanner-token', {
        method: 'POST',
        headers: getAuthHeaders(),
    });
    return result.token;
};

export const getNgrokUrl = async () => {
    const result = await callApi('/api/ngrok-url', {
        headers: getAuthHeaders(),
    });
    return result; // Return full object { url, type }
};
