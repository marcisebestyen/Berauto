import Login from "../pages/LoginPage.tsx";
import ForgotPassword from "../pages/ForgotPassword.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import Cars from "../pages/Cars.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";
import RegisterPage from "../pages/Register.tsx";
import PendingRentPage from "../pages/PendingRentPage.tsx";
import CarHandoverPage from "../pages/CarHandoverPage.tsx";
import RunningRents from "../pages/RunningRents.tsx";
import AddCar from "../pages/AddCar.tsx";
import {CompletedRents} from "../pages/CompletedRents.tsx";
import UpdateCar from "../pages/UpdateCar.tsx";
import ReceiptListPage from "../pages/ReceiptListPage";
import MyReceiptsPage from "../pages/MyReceiptsPage";
import DeleteCarPage from "../pages/DeleteCarPage.tsx";


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
        roles: [ROLES.STAFF, ROLES.ADMIN, ROLES.RENTER],
    },
    {
        path: "staff/pending-rents",
        component: <PendingRentPage />,
        isPrivate: true,
        roles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
        path: "staff/handovers",
        component: <CarHandoverPage />,
        isPrivate: true,
        roles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
        path: "staff/running-rents",
        component: <RunningRents />,
        isPrivate: true,
        roles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
        path: "staff/completed-rents",
        component: <CompletedRents />,
        isPrivate: true,
        roles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
        path: "staff/receipts",
        component: <ReceiptListPage />,
        isPrivate: true,
        roles: [ROLES.STAFF, ROLES.ADMIN],
    },
    {
        path: "admin/add-car",
        component: <AddCar/>,
        isPrivate: true,
        roles: [ROLES.ADMIN],
    },
    {
        path: "admin/update",
        component: <UpdateCar/>,
        isPrivate: true,
        roles: [ROLES.ADMIN],
    },
    {
        path: "admin/delete",
        component: <DeleteCarPage/>,
        isPrivate: true,
        roles: [ROLES.ADMIN],
    },
    {
        path: "receipts/my",
        component: <MyReceiptsPage />,
        isPrivate: true,
        roles: [ROLES.RENTER, ROLES.STAFF, ROLES.ADMIN],
    },
];
