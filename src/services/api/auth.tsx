import { API_URL } from './core';

type LoginCredentials = { email: string; password: string };

const handleLoginResponse = async (response: Response) => {
    if (!response.ok) {
        const errorBody = await response.text();
        try {
            const errorJson = JSON.parse(errorBody);
            throw new Error(errorJson.message || errorJson.title || errorBody);
        } catch {
            throw new Error(errorBody || "Wystąpił błąd serwera");
        }
    }
    return await response.json();
};

export const authApi = {
    loginAdmin: async (credentials: LoginCredentials) => {
        const response = await fetch(`${API_URL}/auth/login/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return handleLoginResponse(response);
    },

    loginTeacher: async (credentials: LoginCredentials) => {
        const response = await fetch(`${API_URL}/auth/login/teacher`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return handleLoginResponse(response);
    },

    loginMobile: async (credentials: LoginCredentials) => {
        const response = await fetch(`${API_URL}/auth/login/mobile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });
        return handleLoginResponse(response);
    },

    logout: async () => {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
        }
    }
};
