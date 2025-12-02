const ticketService = require('../services/ticketService');
const { db } = require('../firebase');

// Mock Logger
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));

// Mock Firebase
jest.mock('../firebase', () => {
    const mockUpdate = jest.fn().mockResolvedValue({});
    const mockSet = jest.fn().mockResolvedValue({});
    const mockDelete = jest.fn().mockResolvedValue({});
    
    // Mock Snapshot behavior for onSnapshot
    const mockOnSnapshot = jest.fn((cb) => {
        // Simulate empty init
        cb({ docChanges: () => [] });
        return jest.fn(); // unsubscribe
    });

    const mockDocObj = {
        collection: jest.fn(), 
        get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        set: mockSet,
        update: mockUpdate,
        delete: mockDelete,
        onSnapshot: mockOnSnapshot
    };
    
    const mockCollectionObj = {
        doc: jest.fn(() => mockDocObj),
        get: jest.fn().mockResolvedValue({ forEach: () => {}, size: 0 }),
        onSnapshot: mockOnSnapshot
    };
    
    mockDocObj.collection.mockReturnValue(mockCollectionObj);

    return {
        db: {
            collection: jest.fn(() => mockCollectionObj),
            batch: jest.fn(() => ({
                delete: jest.fn(),
                commit: jest.fn()
            }))
        },
        admin: {
            firestore: {
                FieldValue: {
                    arrayUnion: jest.fn(val => val)
                }
            }
        },
        mocks: {
            mockUpdate,
            mockSet,
            mockDelete,
            mockOnSnapshot
        }
    };
});

describe('TicketService', () => {
    const eventId = 'event-123';
    const ticketId = 'ticket-123';
    const { mocks } = require('../firebase');

    beforeEach(() => {
        jest.clearAllMocks();
        ticketService.cache.clear();
        ticketService.listeners.clear();
        ticketService.metrics = { hits: 0, misses: 0, writes: 0, latencies: [] };
    });

    describe('createTicket', () => {
        it('should create a ticket and update cache', async () => {
            const ticketData = {
                attendeeName: 'John Doe',
                attendeeEmail: 'john@example.com'
            };

            const result = await ticketService.createTicket(eventId, ticketData);

            expect(result).toHaveProperty('id');
            expect(ticketService.cache.get(eventId).has(result.id)).toBe(true);
            expect(mocks.mockSet).toHaveBeenCalled();
        });
    });

    describe('updateTicketStatus', () => {
        it('should check in a valid ticket', async () => {
            // Pre-populate cache manually to simulate sync
            const mockTicket = {
                id: ticketId,
                status: 'valid',
                attendeeName: 'John Doe',
                checkInHistory: []
            };
            
            ticketService.cache.set(eventId, new Map([[ticketId, mockTicket]]));

            const result = await ticketService.updateTicketStatus(eventId, ticketId, 'check-in', 'admin');

            expect(result.status).toBe('checked-in');
            expect(ticketService.cache.get(eventId).get(ticketId).status).toBe('checked-in');
            expect(mocks.mockUpdate).toHaveBeenCalled();
        });
    });
    
    describe('Metrics', () => {
        it('should record hits and writes', async () => {
             const mockTicket = { id: 't1', status: 'valid' };
             ticketService.cache.set(eventId, new Map([['t1', mockTicket]]));
             
             // Hit
             ticketService.getCachedTicket(eventId, 't1');
             // Miss
             ticketService.getCachedTicket(eventId, 't2');
             
             const m = ticketService.getMetrics();
             expect(m.totalOps).toBe(2);
             expect(m.hitRatio).toBe("50.00%");
        });
    });
});