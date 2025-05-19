import Login from "../pages/LoginPage.tsx";
import ForgotPassword from "../pages/ForgotPassword.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import Cars from "../pages/Cars.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";
import Register from "../pages/Register.tsx";

export const routes = [
    {
        path: "login",
        component: <Login/>,
        isPrivate: false
    },
    {
        path: "forgot",
        component: <ForgotPassword/>,
        isPrivate: false
    },
    {
        path: "dashboard",
        component: <Dashboard/>,
        isPrivate: false
    },
    {
        path: "cars",
        component: <Cars/>,
        isPrivate: false
    },
    {
        path: "profile",
        component: <ProfilePage />,
        isPrivate: true
    },
    {
        path: "register",
        component: <Register/>,
        isPrivate: false
    }
]