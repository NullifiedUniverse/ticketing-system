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

export const deleteEvent = async (eventId) => {
    const result = await callApi(`/api/admin/delete-event/${eventId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    return result;
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
    // Backend returns the array directly
    return result;
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

export const importAttendees = async (eventId, attendees) => {
    const result = await callApi(`/api/admin/import/${eventId}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(attendees),
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

// --- EMAIL ---
export const uploadBackground = async (file) => {
    const formData = new FormData();
    formData.append('background', file);
    const result = await callApi('/api/admin/email/upload-bg', {
        method: 'POST',
        // headers: getAuthHeaders(), // Do NOT set Content-Type for FormData, browser does it
        body: formData,
    });
    return result.filename;
};

export const getEmailPreview = async (eventId, ticketId, bgFilename, config) => {
    // Note: Config already contains messageBefore/After in the updated UI logic, 
    // but if passed separately, we should merge them or ensure backend handles it.
    // The backend expects { ... config, messageBefore, messageAfter }
    // For preview, we just pass config as is, assuming it has everything.
    const result = await callApi('/api/admin/email/preview', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ eventId, ticketId, bgFilename, config }),
    });
    return result.image;
};

export const sendTicketEmail = async (eventId, ticketId, bgFilename, config, messageBefore, messageAfter) => {
    const result = await callApi('/api/admin/email/send-one', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ eventId, ticketId, bgFilename, config, messageBefore, messageAfter }),
    });
    return result;
};

export const sendBatchEmails = async (eventId, bgFilename, config, messageBefore, messageAfter) => {
    // messageBefore/After might be inside config if called from UI state directly, 
    // but we support explicit passing too.
    const result = await callApi('/api/admin/email/send-batch', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ eventId, bgFilename, config, messageBefore, messageAfter }),
    });
    return result;
};
