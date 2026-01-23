import { API_URL } from './core';

export const authApi = {
    login: async (credentials: { email: string; password: string }) => {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

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
    }
};
