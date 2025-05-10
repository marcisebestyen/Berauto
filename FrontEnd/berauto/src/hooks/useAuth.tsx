import {useContext, useEffect} from "react";
import {AuthContext} from "../context/AuthContext.tsx";
import {emailKeyName, emailTokenKey, tokenKeyName} from "../constants/constants.ts";
import {jwtDecode, JwtPayload} from "jwt-decode";

interface CustomJwtPayload extends JwtPayload {
    [key: string]: any; // Allowing dynamic keys if necessary
}

const useAuth = () => {
    const { token, setToken, email, setEmail  } = useContext(AuthContext);
    const isLoggedIn = !!token;

    const login = (email: string, password: string) => {
        console.log({email, password});
        const tokenFromBE = 'yourDotnetToken';
        setToken(tokenFromBE); localStorage.setItem(tokenKeyName, tokenFromBE);
        setEmail(email); localStorage.setItem(emailKeyName, email);
    }

    const logout = () => {
        localStorage.clear();
        setToken(null);
    }

    const loginKata = (token: string) => {
        setToken(token); localStorage.setItem(tokenKeyName, token);
        const decodedToken = jwtDecode<CustomJwtPayload>(token);
        const tempEmail = decodedToken[emailTokenKey];
        localStorage.setItem(emailKeyName, tempEmail); setEmail(tempEmail);
    }

    useEffect(() => {

    }, []);

    return {login, logout, loginKata, token, email, isLoggedIn};
}

export default useAuth;