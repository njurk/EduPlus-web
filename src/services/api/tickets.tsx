import type { Ticket, CreateTicketDto, CloseTicketDto, TicketReason, PaginatedResponse } from '../../types';
import { API_URL, getHeaders, handleResponse } from './core';

export const ticketsApi = {
    getAll: async (pageNumber: number = 1, pageSize: number = 10, showClosed?: boolean, search?: string, sortBy?: string, sortDesc?: boolean, reasonId?: number): Promise<PaginatedResponse<Ticket>> => {
        const url = new URL(`${API_URL}/Ticket`);
        url.searchParams.append('pageNumber', pageNumber.toString());
        url.searchParams.append('pageSize', pageSize.toString());
        if (showClosed !== undefined) url.searchParams.append('showClosed', showClosed.toString());
        if (search) url.searchParams.append('search', search);
        if (sortBy) url.searchParams.append('sortBy', sortBy);
        if (sortDesc !== undefined) url.searchParams.append('sortDesc', sortDesc.toString());
        if (reasonId !== undefined) url.searchParams.append('reasonId', reasonId.toString());

        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<PaginatedResponse<Ticket>>(response);
    },
    create: async (data: CreateTicketDto): Promise<Ticket> => {
        const response = await fetch(`${API_URL}/Ticket`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return handleResponse<Ticket>(response);
    },
    close: async (id: number, data: CloseTicketDto): Promise<void> => {
        const response = await fetch(`${API_URL}/Ticket/${id}/close`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<void>(response);
    }
};

export const ticketReasonsApi = {
    getAll: async (filters?: { search?: string; sortBy?: string; sortDesc?: boolean; showInactive?: boolean }): Promise<TicketReason[]> => {
        const url = new URL(`${API_URL}/TicketReason`);
        if (filters?.search) url.searchParams.append('search', filters.search);
        if (filters?.sortBy) url.searchParams.append('sortBy', filters.sortBy);
        if (filters?.sortDesc !== undefined) url.searchParams.append('sortDesc', filters.sortDesc.toString());
        if (filters?.showInactive !== undefined) url.searchParams.append('showInactive', filters.showInactive.toString());
        const response = await fetch(url.toString(), { headers: getHeaders() });
        return handleResponse<TicketReason[]>(response);
    },
    getActive: async (): Promise<TicketReason[]> => {
        const response = await fetch(`${API_URL}/TicketReason/active`);
        return handleResponse<TicketReason[]>(response);
    },
    create: async (data: Partial<TicketReason>): Promise<TicketReason> => {
        const response = await fetch(`${API_URL}/TicketReason`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<TicketReason>(response);
    },
    update: async (id: number, data: Partial<TicketReason>): Promise<TicketReason> => {
        const response = await fetch(`${API_URL}/TicketReason/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<TicketReason>(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/TicketReason/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    }
};
