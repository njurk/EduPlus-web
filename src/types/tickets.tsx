export interface Ticket {
    id: number;
    email: string;
    reasonId: number;
    reasonName: string;
    content: string;
    isClosed: boolean;
    closedAt?: string;
    adminResponse?: string;
    createdAt: string;
    updatedAt: string;
    modifiedByName?: string;
}

export interface TicketReason {
    id: number;
    name: string;
}

export interface CreateTicketDto {
    email: string;
    reasonId: number;
    content: string;
}

export interface CloseTicketDto {
    adminResponse: string;
}

