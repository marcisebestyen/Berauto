import { createContext, useContext, useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import axiosInstance from '../api/axios.config.ts';

interface User {
    id: string;
    email: string;
    role: string;
    username?: string;
    firstName?: string;
    lastName?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');

        if (token && storedUser) {
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (email: string, password: string) => {
        const response = await axiosInstance.post<{ token: string; user: any }>('/users/login', {
            identifier: email,
            password,
        });

        const token = response.data.token;
        const userDto = response.data.user;

        const decoded: any = jwtDecode(token);

        const mappedUser: User = {
            id: decoded.nameid || '',
            email: decoded.email || '',
            role: decoded.role || '',
            username: decoded.unique_name || '',
            firstName: userDto.firstName || '',
            lastName: userDto.lastName || '',
        };

        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(mappedUser);
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axiosInstance.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
