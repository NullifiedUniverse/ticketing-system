
import { API_BASE_URL, API_KEY } from '../config';

export const createTicket = async (eventId, attendeeName, attendeeEmail) => {
    const response = await fetch(`${API_BASE_URL}/create-ticket/${eventId}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
        },
        body: JSON.stringify({ attendeeName, attendeeEmail }),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || 'Failed to create ticket.');
    }

    return result;
};
