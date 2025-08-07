import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axios.config.ts';

interface User {
    id: string;
    email: string;
    role: string;
    username: string;
    firstName?: string;
    lastName?: string;
    licenceId?: string;
    phoneNumber?: string;
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
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            try {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return JSON.parse(storedUser);
            } catch (error) {
                console.error("Token vagy user parse hiba:", error);
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return null;
            }
        }

        return null;
    });

    const login = async (email: string, password: string): Promise<void> => {
        try {
            const response = await axiosInstance.post<{ token: string; user: any }>('/users/login', {
                identifier: email,
                password
            });

            const token = response.data.token;
            const userDto = response.data.user;

            if (token && typeof token === 'string') {
                localStorage.setItem('token', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    const decodedPayload = jwtDecode<DecodedJwtPayload>(token);

                    const mappedUser: User = {
                        id: decodedPayload.nameid || 'defaultIdOnError',
                        email: decodedPayload.email || 'defaultEmailOnError',
                        role: decodedPayload.role || 'defaultRoleOnError',
                        username: decodedPayload.unique_name || 'defaultUsernameOnError',
                        firstName: userDto.firstName || '',
                        lastName: userDto.lastName || '',
                        licenceId: userDto.licenceId || '',
                        phoneNumber: userDto.phoneNumber || ''
                    };

                    if (mappedUser.id !== 'defaultIdOnError' && mappedUser.email !== 'defaultEmailOnError') {
                        localStorage.setItem('user', JSON.stringify(mappedUser));
                        setUser(mappedUser);
                    } else {
                        throw new Error('User data incomplete in token.');
                    }
                } catch (e) {
                    console.error('Token decode hiba:', e);
                    localStorage.removeItem('token');
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                    throw new Error('Sikeres bejelentkezés, de a token feldolgozása nem sikerült.');
                }
            } else {
                throw new Error('Hiányzik vagy hibás a token a válaszban.');
            }
        } catch (error: any) {
            console.error('Login hiba:', error.message, error);
            if (error.response?.status === 401) {
                throw new Error('Hibás email cím vagy jelszó!');
            } else if (error.response?.status === 404) {
                throw new Error('A felhasználó nem található!');
            } else if (error.response?.status === 400) {
                throw new Error('Hibás adatok – ellenőrizd a mezőket!');
            } else if (error instanceof Error) {
                throw error;
            } else {
                throw new Error('Ismeretlen hiba a bejelentkezés során.');
            }
        }
    };

    const logout = (onLogout?: () => void) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);

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