export const parseCSV = (text) => {
    if (!text) return [];
    
    // Normalize line endings
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n').filter(l => l.trim());

    if (lines.length < 2) return [];

    // Helper to parse a single CSV line correctly (handling quotes)
    const parseLine = (line) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                // Handle escaped quotes ("") inside quoted string
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        // Clean up quotes from edges if they exist
        return result.map(val => val.replace(/^"|"$/g, ''));
    };

    // Detect Header
    // Look for 'name' and 'email' in the first few lines to determine start
    let headerIndex = -1;
    let nameIndex = -1;
    let emailIndex = -1;

    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const cols = parseLine(lines[i].toLowerCase());
        const nIdx = cols.findIndex(c => c.includes('name') || c.includes('姓名') || c.includes('attendee'));
        const eIdx = cols.findIndex(c => c.includes('email') || c.includes('mail') || c.includes('信箱'));
        
        if (nIdx !== -1 && eIdx !== -1) {
            headerIndex = i;
            nameIndex = nIdx;
            emailIndex = eIdx;
            break;
        }
    }

    // If no explicit header found, assume Col 0 = Name, Col 1 = Email (standard export)
    // But skip first line if it looks like a header
    if (headerIndex === -1) {
        // Basic heuristic: Check if first line contains "@" -> likely data. If not -> likely header.
        if (!lines[0].includes('@')) {
            headerIndex = 0; // Skip first line
        } else {
            headerIndex = -1; // No header
        }
        nameIndex = 0;
        emailIndex = 1;
    }

    const attendees = [];
    const startIndex = headerIndex + 1; // Start after header

    for (let i = startIndex; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        if (cols.length >= 2) {
            const name = cols[nameIndex];
            const email = cols[emailIndex];
            
            // Simple validation
            if (name && email && email.includes('@')) {
                attendees.push({ attendeeName: name, attendeeEmail: email });
            }
        }
    }

    return attendees;
};
