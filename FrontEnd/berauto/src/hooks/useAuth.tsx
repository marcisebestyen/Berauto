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
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return null;
            }
        }
        return null;
    });

    const handleLoginSuccess = (token: string, userDto: any) => {
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
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['Authorization'];
                setUser(null);
                throw new Error('Sikeres bejelentkezés, de a token feldolgozása nem sikerült.');
            }
        } else {
            throw new Error('Hiányzik vagy hibás a token a válaszban.');
        }
    };

    const login = async (email: string, password: string): Promise<void> => {
        try {
            const response = await axiosInstance.post<{ token: string; user: any }>('/users/login', {
                identifier: email,
                password
            });
            handleLoginSuccess(response.data.token, response.data.user);
        } catch (error: any) {
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

    const loginWithGoogle = async (supabaseToken: string): Promise<void> => {
        try {
            const response = await axiosInstance.post<{ token: string; user: any }>('/users/google-login', {
                accessToken: supabaseToken
            });
            handleLoginSuccess(response.data.token, response.data.user);
        } catch (error: any) {
            const msg = error.response?.data?.Message || error.message || 'Sikertelen Google bejelentkezés.';
            throw new Error(msg);
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

    const isProfileComplete = (): boolean => {
        if (!user) return false;
        return (
            !!user.licenceId && user.licenceId.trim() !== '' &&
            !!user.phoneNumber && user.phoneNumber.trim() !== ''
        );
    };

    return {
        user,
        login,
        loginWithGoogle,
        logout,
        isAuthenticated: !!user,
        isProfileComplete
    };
};

export default useAuth;