import { useState } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from "../api/axios.config.ts";


interface User {
    id: string;
    email: string;
    role: string;
}

interface DecodedJwtPayload {
    sub?: string;
    nameid?: string;

    'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
    email?: string;

    'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string;
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
                    id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '',
                    email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '',
                    role: decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decoded.role || '',
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
            const response = await axiosInstance.post<string>('/User/Login', {
                email,
                password
            });


            const token  = response.data;


            if (token && typeof token === 'string') {
                localStorage.setItem('token', token);

                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                try {
                    const decodedPayload = jwtDecode<DecodedJwtPayload>(token);

                    const mappedUser: User = {
                        id: decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || "defaultIdOnError",
                        email: decodedPayload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decodedPayload.email || "defaultEmailOnError",
                        role: decodedPayload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || decodedPayload.role || "defaultRoleOnError"
                    };

                    if (mappedUser.id !== "defaultIdOnError" && mappedUser.email !== "defaultEmailOnError") {
                        setUser(mappedUser);
                    } else {
                        console.error("Critical user information (ID or Email) missing in JWT claims.");
                        localStorage.removeItem('token'); // Remove invalid token
                        delete axios.defaults.headers.common['Authorization'];
                        setUser(null);
                        throw new Error("User data incomplete in token.");
                    }

                } catch (e) {
                    console.error("Failed to decode token after login:", e);
                    localStorage.removeItem('token'); // Remove bad token
                    delete axios.defaults.headers.common['Authorization'];
                    setUser(null);
                    throw new Error('Login successful, but failed to process user data from token.');
                }
            } else {
                throw new Error('Token not found or is invalid in server response.');
            }

        } catch (error: any) {
            console.error("Error in useAuth login:", error.message, error);
            if (error.response?.status === 401) {
                throw new Error('Hibás email cím vagy jelszó!');
            } else if (error.response?.status === 404) {
                throw new Error('A felhasználó nem található!');
            } else if (error instanceof Error) {
                throw error;
            }
            else {
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