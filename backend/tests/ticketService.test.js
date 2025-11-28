const ticketService = require('../services/ticketService');
const { db } = require('../firebase');

jest.mock('../firebase', () => {
    const mockUpdate = jest.fn();
    const mockSet = jest.fn();
    const mockDelete = jest.fn();
    const mockGet = jest.fn();
    const mockDoc = jest.fn(() => ({
        collection: jest.fn(() => ({
            doc: mockDoc
        })),
        get: mockGet,
        set: mockSet,
        update: mockUpdate,
        delete: mockDelete
    }));
    const mockCollection = jest.fn(() => ({
        doc: mockDoc
    }));

    return {
        db: {
            collection: mockCollection
        },
        // Helper to reset mocks or access them in tests
        mocks: {
            mockUpdate,
            mockSet,
            mockDelete,
            mockGet,
            mockDoc,
            mockCollection
        }
    };
});

describe('TicketService', () => {
    const eventId = 'event-123';
    const ticketId = 'ticket-123';
    const { mocks } = require('../firebase');

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createTicket', () => {
        it('should create a ticket successfully', async () => {
            // Mock metadata check
            mocks.mockGet.mockResolvedValue({ exists: true });

            const ticketData = {
                attendeeName: 'John Doe',
                attendeeEmail: 'john@example.com'
            };

            const result = await ticketService.createTicket(eventId, ticketData);

            expect(result).toHaveProperty('id');
            expect(result.attendeeName).toBe('John Doe');
            expect(result.status).toBe('valid');
            // mockSet is called once for the ticket (metadata exists)
            expect(mocks.mockSet).toHaveBeenCalledTimes(1);
        });
    });

    describe('updateTicketStatus', () => {
        it('should check in a valid ticket', async () => {
            mocks.mockGet.mockResolvedValue({
                exists: true,
                data: () => ({
                    status: 'valid',
                    attendeeName: 'John Doe',
                    checkInHistory: []
                })
            });

            const result = await ticketService.updateTicketStatus(eventId, ticketId, 'check-in', 'admin');

            expect(result.status).toBe('checked-in');
            expect(mocks.mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                status: 'checked-in'
            }));
        });

        it('should not check in an already checked-in ticket', async () => {
            mocks.mockGet.mockResolvedValue({
                exists: true,
                data: () => ({
                    status: 'checked-in',
                    attendeeName: 'John Doe',
                    checkInHistory: []
                })
            });

            await expect(ticketService.updateTicketStatus(eventId, ticketId, 'check-in', 'admin'))
                .rejects.toThrow('Ticket already checked in.');
        });

        it('should check out a checked-in ticket', async () => {
             mocks.mockGet.mockResolvedValue({
                exists: true,
                data: () => ({
                    status: 'checked-in',
                    attendeeName: 'John Doe',
                    checkInHistory: []
                })
            });

            const result = await ticketService.updateTicketStatus(eventId, ticketId, 'check-out', 'admin');

            expect(result.status).toBe('on-leave');
            expect(mocks.mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
                status: 'on-leave'
            }));
        });
    });
});
