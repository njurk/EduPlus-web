export interface Ticket {
    id: number;
    userId: number;
    userFullName: string;
    userEmail: string;
    subject: string;
    isClosed: boolean;
    closedAt?: string;
    adminResponse?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTicketDto {
    subject: string;
}

export interface CloseTicketDto {
    adminResponse: string;
}
