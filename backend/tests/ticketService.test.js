const ticketService = require('../services/ticketService');
const AppError = require('../utils/AppError');

// Mock Logger
jest.mock('../utils/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
}));

// Mock Firebase
jest.mock('../firebase', () => {
    const mockUpdate = jest.fn().mockResolvedValue({}); // Fix: Return Promise
    const mockSet = jest.fn().mockResolvedValue({});
    const mockDelete = jest.fn().mockResolvedValue({});
    
    const mockDocGet = jest.fn(); // For doc().get()
    const mockCollectionGet = jest.fn(); // For collection().get()

    const mockDocObj = {
        collection: jest.fn(), // Will be defined below
        get: mockDocGet,
        set: mockSet,
        update: mockUpdate,
        delete: mockDelete
    };
    
    const mockCollectionObj = {
        doc: jest.fn(() => mockDocObj),
        get: mockCollectionGet,
        listDocuments: jest.fn(() => [])
    };
    
    // Circular reference setup
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
            mockDocGet,
            mockCollectionGet
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
        
        // Default successful behavior for cache loading (Empty cache)
        mocks.mockCollectionGet.mockResolvedValue({
            forEach: jest.fn(),
            empty: true,
            docs: []
        });
    });

    describe('createTicket', () => {
        it('should create a ticket successfully', async () => {
            const ticketData = {
                attendeeName: 'John Doe',
                attendeeEmail: 'john@example.com'
            };

            const result = await ticketService.createTicket(eventId, ticketData);

            expect(result).toHaveProperty('id');
            expect(result.attendeeName).toBe('John Doe');
            expect(mocks.mockSet).toHaveBeenCalled();
        });
    });

    describe('updateTicketStatus', () => {
        it('should check in a valid ticket', async () => {
            const mockTicket = {
                id: ticketId,
                status: 'valid',
                attendeeName: 'John Doe',
                checkInHistory: []
            };
            
            ticketService.cache.set(eventId, new Map([[ticketId, mockTicket]]));

            const result = await ticketService.updateTicketStatus(eventId, ticketId, 'check-in', 'admin');

            expect(result.status).toBe('checked-in');
            expect(mocks.mockUpdate).toHaveBeenCalled();
        });

        it('should fail to check in if ticket not in cache (and not in DB)', async () => {
             // 1. Cache Load (Default is empty from beforeEach)
             
             // 2. DB Fallback: Ticket lookup
             mocks.mockDocGet.mockResolvedValue({ exists: false });
             
             await expect(ticketService.updateTicketStatus(eventId, ticketId, 'check-in', 'admin'))
                .rejects.toThrow('Ticket not found');
        });
        
        it('should fallback to DB if not in cache', async () => {
             const mockTicket = {
                status: 'valid',
                attendeeName: 'Jane Doe',
                checkInHistory: []
            };
             
             // DB Fallback: Ticket lookup
             mocks.mockDocGet.mockResolvedValue({ 
                 exists: true,
                 data: () => mockTicket
             });
             
             const result = await ticketService.updateTicketStatus(eventId, ticketId, 'check-in', 'admin');
             expect(result.status).toBe('checked-in');
             expect(result.attendeeName).toBe('Jane Doe');
        });
    });
});
