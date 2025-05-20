import Login from "../pages/LoginPage.tsx";
import ForgotPassword from "../pages/ForgotPassword.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import Cars from "../pages/Cars.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";
import RegisterPage from "../pages/Register.tsx";
import PendingRentPage from "../pages/PendingRentPage.tsx";
import CarHandoverPage from "../pages/CarHandoverPage.tsx"; // Feltételezve, hogy van ilyen
import RunningRents from "../pages/RunningRents.tsx";
import AddCar from "../pages/AddCar.tsx";
import {CompletedRents} from "../pages/CompletedRents.tsx";
import UpdateCar from "../pages/UpdateCar.tsx";



export const ROLES = {
    ADMIN: 'Admin',
    STAFF: 'Staff',
    RENTER: 'Renter',
};

export const routes = [
    {
        path: "login",
        component: <Login/>,
        isPrivate: false,
    },
    {
        path: "forgot",
        component: <ForgotPassword/>,
        isPrivate: false,
    },
    {
        path: "register",
        component: <RegisterPage/>,
        isPrivate: false,
    },
    {
        path: "dashboard",
        component: <Dashboard/>,
        isPrivate: false,
    },
    {
        path: "cars",
        component: <Cars/>,
        isPrivate: false,
    },
    {
        path: "profile",
        component: <ProfilePage />,
        isPrivate: true,
    },
    {
        path: "staff/pending-rents",
        component: <PendingRentPage />,
        isPrivate: true,
    },
    {
        path: "staff/handovers",
        component: <CarHandoverPage />,
        isPrivate: true,
    },
    {
        path: "staff/running-rents",
        component: <RunningRents />,
        isPrivate: true,
    },
    {
        path: "staff/completed-rents",
        component: <CompletedRents />,
        isPrivate: true,
    },
    {
        path: "admin/add-car",
        component: <AddCar/>,
        isPrivate: true,
    },
    {
        path: "admin/update",
        component: <UpdateCar/>,
        isPrivate: true,
    }
];
