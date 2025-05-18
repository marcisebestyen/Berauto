import { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BasicLayout from '../components/Layout/BasicLayout'; // Ellenőrizd az útvonalat
import { routes } from './Routes'; // Ellenőrizd az útvonalat
import useAuth from '../hooks/useAuth'; // Ellenőrizd az útvonalat
import Dashboard from "../pages/Dashboard"; // Importáld a Dashboardot az index route-hoz

// Csak kijelentkezett felhasználók számára elérhető (pl. login, forgot)
const AuthenticatedRedirect = ({ element }: { element: ReactElement }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/" replace /> : element;
};

// PrivateRoute: teljes jogosultságot igénylő útvonalakhoz (ha szükséges)
const PrivateRoute = ({ element }: { element: ReactElement }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? element : <Navigate to="/login" replace />;
};

const Routing = () => {
    // Definiáljuk azokat az útvonalakat, amelyek NEM használják a BasicLayout-ot
    const standalonePaths = ['login', 'forgot']; // Ide vehetsz fel másokat is, pl. 'register'

    return (
        <Routes>
            {/* === Útvonalak, amelyek a BasicLayout-ot használják === */}
            <Route path="/" element={<BasicLayout />}>
                {/* Alapértelmezett oldal a '/' útvonalon belül (index) */}
                {/* Közvetlenül megadhatod a Dashboard komponenst itt */}
                <Route index element={<Dashboard />} />

                {/* Az összes többi útvonal, ami NEM standalone */}
                {routes
                    .filter(route => !standalonePaths.includes(route.path))
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path} // Ez létrehozza pl. a /dashboard, /cars útvonalakat a '/' alatt
                            element={route.isPrivate ? <PrivateRoute element={route.component} /> : route.component}
                        />
                    ))}
            </Route>

            {/* === Standalone útvonalak (BasicLayout NÉLKÜL) === */}
            {routes
                .filter(route => standalonePaths.includes(route.path))
                .map((route) => (
                    <Route
                        key={route.path}
                        path={route.path} // Ezek felső szintű útvonalak lesznek, pl. /login
                        element={<AuthenticatedRedirect element={route.component} />}
                    />
                ))}

            {/* === 404 fallback === */}
            <Route path="*" element={<div>404 – Az oldal nem található</div>} />
        </Routes>
    );
};

export default Routing;