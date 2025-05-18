import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axios.config.ts';

interface User {
    id: string;
    email: string;
    role: string;
    username?: string;
}

interface DecodedJwtPayload {
    nameid?: string;
    unique_name?: string;
    email?: string;
    role?: string;
    [key: string]: any;
}

const useAuth = () => {
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode<DecodedJwtPayload>(token);

                const mappedUser: User = {
                    id: decoded.nameid || '',
                    email: decoded.email || '',
                    role: decoded.role || '',
                    username: decoded.unique_name || ''
                };

                if (mappedUser.id && mappedUser.email) {
                    return mappedUser;
                }

                localStorage.removeItem('token');
                return null;
            } catch (error) {
                console.error("Initial token decode failed:", error);
                localStorage.removeItem('token');
                return null;
            }
        }

        return null;
    });

    const login = async (email: string, password: string): Promise<void> => {
        try {
            const response = await axiosInstance.post<{ token: string; user: any }>('/api/users/login', {
                identifier: email,
                password
            });

            const token = response.data.token;

            if (token && typeof token === 'string') {
                localStorage.setItem('token', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    const decodedPayload = jwtDecode<DecodedJwtPayload>(token);

                    const mappedUser: User = {
                        id: decodedPayload.nameid || 'defaultIdOnError',
                        email: decodedPayload.email || 'defaultEmailOnError',
                        role: decodedPayload.role || 'defaultRoleOnError',
                        username: decodedPayload.unique_name || 'defaultUsernameOnError'
                    };

                    if (mappedUser.id !== 'defaultIdOnError' && mappedUser.email !== 'defaultEmailOnError') {
                        setUser(mappedUser);
                    } else {
                        throw new Error('User data incomplete in token.');
                    }
                } catch (e) {
                    console.error('Failed to decode token after login:', e);
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                    throw new Error('Login successful, but failed to process user data from token.');
                }
            } else {
                throw new Error('Token not found or is invalid in server response.');
            }
        } catch (error: any) {
            console.error('Error in useAuth login:', error.message, error);
            if (error.response?.status === 401) {
                throw new Error('Hibás email cím vagy jelszó!');
            } else if (error.response?.status === 404) {
                throw new Error('A felhasználó nem található!');
            } else if (error instanceof Error) {
                throw error;
            } else {
                throw new Error('Hiba történt a bejelentkezés során. Kérjük próbálja újra később!');
            }
        }
    };

    const logout = (onLogout?: () => void) => {
        localStorage.removeItem('token');
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];

        if (onLogout) {
            onLogout();
        }
    };


    return {
        user,
        login,
        logout,
        isAuthenticated: !!user
    };
};

export default useAuth;
