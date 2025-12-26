export const parseCSV = (text) => {
    if (!text) return [];

    // Normalize line endings
    const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedText.split('\n').filter(l => l.trim());

    if (lines.length === 0) return [];

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
    let nameIndex = 0; // Default to 0
    let emailIndex = 1; // Default to 1

    for (let i = 0; i < Math.min(5, lines.length); i++) {
        const cols = parseLine(lines[i].toLowerCase());
        const nIdx = cols.findIndex(c => c === 'name' || c.includes('name') || c.includes('姓名') || c.includes('attendee'));
        const eIdx = cols.findIndex(c => c === 'email' || c.includes('email') || c.includes('mail') || c.includes('信箱'));

        if (nIdx !== -1 && eIdx !== -1) {
            headerIndex = i;
            nameIndex = nIdx;
            emailIndex = eIdx;
            break;
        }
    }

    // If no explicit header found, rely on defaults (0=Name, 1=Email)
    if (headerIndex === -1 && lines.length > 0) {
        const firstCols = parseLine(lines[0]);
        // Simple heuristic: If the line doesn't have an '@' symbol in either of the first two columns, assume it's a header.
        const hasData = firstCols.slice(0, 2).some(c => c.includes('@'));

        if (!hasData) {
            headerIndex = 0; // Skip 1st line
        }
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
