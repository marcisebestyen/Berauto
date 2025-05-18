import Login from "../pages/LoginPage.tsx";
import ForgotPassword from "../pages/ForgotPassword.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import Cars from "../pages/Cars.tsx";
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
]