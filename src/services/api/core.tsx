export const API_URL = 'http://localhost:5107/api';

export const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
};

export const handleResponse = async <T = any>(response: Response): Promise<T> => {
    if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error("Sesja wygasła. Zaloguj się ponownie.");
    }

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `HTTP error! status: ${response.status}`);
    }

    if (response.status === 204) return null as T;

    const text = await response.text();
    return text ? JSON.parse(text) : {} as T;
};

export function createCrudResource<T>(endpoint: string) {
    return {
        getAll: async (params?: Record<string, any>): Promise<T[]> => {
            const url = new URL(`${API_URL}/${endpoint}`);
            if (params) {
                Object.keys(params).forEach(key => {
                    const value = params[key];
                    if (value !== undefined && value !== null && value !== '') {
                        url.searchParams.append(key, value.toString());
                    }
                });
            }
            const response = await fetch(url.toString(), {
                headers: getHeaders()
            });
            return handleResponse<T[]>(response);
        },
        get: async (id: number): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                headers: getHeaders()
            });
            return handleResponse<T>(response);
        },
        create: async (data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse<T>(response);
        },
        update: async (id: number, data: Partial<T>): Promise<T> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(data)
            });
            return handleResponse<T>(response);
        },
        delete: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });
            return handleResponse<void>(response);
        },
        restore: async (id: number): Promise<void> => {
            const response = await fetch(`${API_URL}/${endpoint}/${id}/restore`, {
                method: 'PATCH',
                headers: getHeaders()
            });
            return handleResponse<void>(response);
        }
    };
}
