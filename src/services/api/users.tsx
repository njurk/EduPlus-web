import type { User, UserRole, ParentStudents, Role, ChangePasswordDto, PaginatedResponse } from '../../types';
import { API_URL, getHeaders, handleResponse, createCrudResource } from './core';

export const usersApi = {
    ...createCrudResource<User>('user'),
    getAll: async (params?: { pageNumber?: number, pageSize?: number, search?: string, sortBy?: string, sortDesc?: boolean, showInactive?: boolean, onlyUnassignedParents?: boolean, roleLevel?: number }): Promise<PaginatedResponse<User>> => {
        const query = new URLSearchParams();
        if (params?.pageNumber) query.append('pageNumber', params.pageNumber.toString());
        if (params?.pageSize) query.append('pageSize', params.pageSize.toString());
        if (params?.search) query.append('search', params.search);
        if (params?.sortBy) query.append('sortBy', params.sortBy);
        if (params?.sortDesc) query.append('sortDesc', 'true');
        if (params?.showInactive) query.append('showInactive', 'true');
        if (params?.onlyUnassignedParents) query.append('onlyUnassignedParents', 'true');
        if (params?.roleLevel) query.append('roleLevel', params.roleLevel.toString());

        const response = await fetch(`${API_URL}/user?${query.toString()}`, {
            headers: getHeaders()
        });
        return handleResponse<PaginatedResponse<User>>(response);
    },
    restore: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/user/${id}/restore`, {
            method: 'PATCH',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    },
    changePassword: async (id: number, data: ChangePasswordDto) => {
        const response = await fetch(`${API_URL}/user/${id}/change-password`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            let errorMessage = errorBody;
            try {
                const json = JSON.parse(errorBody);
                errorMessage = json.message || json.title || errorMessage;
            } catch { }
            throw new Error(errorMessage || "Błąd zmiany hasła");
        }

        return await response.json();
    }
};

export const rolesApi = {
    getAll: async (params?: { search?: string, sortBy?: string, sortDesc?: boolean }): Promise<Role[]> => {
        const query = new URLSearchParams();
        if (params?.search) query.append('search', params.search);
        if (params?.sortBy) query.append('sortBy', params.sortBy);
        if (params?.sortDesc !== undefined) query.append('sortDesc', String(params.sortDesc));

        const response = await fetch(`${API_URL}/role?${query.toString()}`, { headers: getHeaders() });
        return handleResponse<Role[]>(response);
    },
    update: async (id: number, data: { name: string; description?: string }): Promise<void> => {
        const response = await fetch(`${API_URL}/role/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<void>(response);
    }
};

export const userRolesApi = createCrudResource<UserRole>('userrole');

export const parentStudentsApi = {
    getAll: async (search: string = '', sortBy?: string, sortDesc?: boolean): Promise<ParentStudents[]> => {
        const query = new URLSearchParams();
        if (search) query.append('search', search);
        if (sortBy) query.append('sortBy', sortBy);
        if (sortDesc !== undefined) query.append('sortDesc', sortDesc.toString());

        const response = await fetch(`${API_URL}/ParentStudent?${query.toString()}`, { headers: getHeaders() });
        return handleResponse<ParentStudents[]>(response);
    },
    delete: async (id: number): Promise<void> => {
        const response = await fetch(`${API_URL}/ParentStudent/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        return handleResponse<void>(response);
    },
    create: async (data: Partial<ParentStudents>): Promise<ParentStudents> => {
        const response = await fetch(`${API_URL}/ParentStudent`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
        });
        return handleResponse<ParentStudents>(response);
    }
};
