import type { User, UserRole, Announcement, SchoolClass } from '../types';

const API_URL = 'https://localhost:7252/api';

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("API Error:", response.status, errorBody);
    throw new Error(errorBody || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) return null;
  return await response.json();
};

export const api = {
    users: {
        getAll: async (params?: { search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean }) => {
            const query = new URLSearchParams();
            if (params?.search) query.append('search', params.search);
            if (params?.sortBy) query.append('sortBy', params.sortBy);
            if (params?.sortDesc) query.append('sortDesc', 'true');
            if (params?.showInactive) query.append('showInactive', 'true');

            const response = await fetch(`${API_URL}/user?${query.toString()}`);
            return handleResponse(response);
        },

        create: async (data: Partial<User>) => {
            const response = await fetch(`${API_URL}/user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },

        update: async (id: number, data: Partial<User>) => {
            const response = await fetch(`${API_URL}/user/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },

        delete: async (id: number) => {
            const response = await fetch(`${API_URL}/user/${id}`, {
                method: 'DELETE'
            });
            return handleResponse(response);
        },
    },

    roles: {
        getAll: async () => {
            const response = await fetch(`${API_URL}/role`);
            return handleResponse(response);
        },
    },

    userRoles: {
        create: async (data: Partial<UserRole>) => {
            const response = await fetch(`${API_URL}/userrole`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return handleResponse(response);
        },

        delete: async (id: number) => {
            const response = await fetch(`${API_URL}/userrole/${id}`, {
                method: 'DELETE'
            });
            return handleResponse(response);
        },
    },

    classes: {
        getAll: async (): Promise<SchoolClass[]> => {
            const response = await fetch(`${API_URL}/class`);
            return handleResponse(response);
        }
    },

    announcements: {
        getAll: async (): Promise<Announcement[]> => {
            const response = await fetch(`${API_URL}/announcement`);
            return handleResponse(response);
        }
    }
};