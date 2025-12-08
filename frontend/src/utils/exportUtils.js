export const exportToCSV = (data, filename = 'export.csv') => {
    if (!data || !data.length) return;

    const csvContent = "data:text/csv;charset=utf-8," + data.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const formatTicketsForCSV = (tickets) => {
    const headers = "ID,Name,Email,Status,LastActionTime,LastActionBy";
    const rows = tickets.map(t => {
        const lastAction = t.checkInHistory && t.checkInHistory.length > 0 ? t.checkInHistory[t.checkInHistory.length - 1] : null;
        return [
            t.id, 
            `"${t.attendeeName}"`, 
            t.attendeeEmail, 
            t.status, 
            lastAction ? new Date(lastAction.timestamp._seconds * 1000 || lastAction.timestamp).toLocaleString() : '',
            lastAction ? lastAction.scannedBy : ''
        ].join(',');
    });
    return [headers, ...rows];
};
