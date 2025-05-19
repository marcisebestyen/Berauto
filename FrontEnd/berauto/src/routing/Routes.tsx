import Login from "../pages/LoginPage.tsx";
import ForgotPassword from "../pages/ForgotPassword.tsx";
import Dashboard from "../pages/Dashboard.tsx";
import Cars from "../pages/Cars.tsx";
import ProfilePage from "../pages/ProfilePage.tsx";
import RegisterPage from "../pages/Register.tsx"; // Visszaállítva/Hozzáadva
import PendingRentPage from "../pages/PendingRentPage.tsx";
import CarHandoverPage from "../pages/CarHandoverPage.tsx"; // Feltételezve, hogy van ilyen


// Definiáld a ROLES konstanst itt, vagy importáld egy közös helyről, pl. constants.ts
// Példa:
export const ROLES = {
    ADMIN: 'Admin',
    STAFF: 'Staff', // Vagy 'Clerk', 'Operator', ahogy a rendszeredben van
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
        path: "register", // Visszaállított register útvonal
        component: <RegisterPage/>,
        isPrivate: false, // A regisztráció általában publikus
    },
    {
        path: "dashboard",
        component: <Dashboard/>,
        isPrivate: true, // Legyen privát, ha csak bejelentkezés után elérhető
    },
    {
        path: "cars",
        component: <Cars/>,
        isPrivate: false, 
    },
    {
        path: "profile",
        component: <ProfilePage />,
        isPrivate: true, // A profil oldal tipikusan privát
    },
    {
        path: "staff/pending-rents",
        component: <PendingRentPage />,
        isPrivate: true,
    },
    {
        path: "staff/handovers",
        component: <CarHandoverPage />, // Használja a korábban generált CarHandoverPage-et
        isPrivate: true,
    },

    // Ide jöhetnek további útvonal definíciók
];
