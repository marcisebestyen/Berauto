import { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BasicLayout from '../components/Layout/BasicLayout';
import { routes } from './Routes';
import useAuth from '../hooks/useAuth';

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
    return (
        <Routes>
            {/* === Publikus kezdőoldal: Dashboard === */}
            <Route
                path="/"
                element={<BasicLayout />}
            >
                {/* Default nyitó oldal a dashboard */}
                <Route
                    index
                    element={routes.find(r => r.path === 'dashboard')?.component || <div>Dashboard not found</div>}
                />

                {/* Privát route-ok aláágazásban maradhatnak, pl. /app/cars stb. */}
                {routes
                    .filter((route) => route.isPrivate && route.path !== 'dashboard')
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={<PrivateRoute element={route.component} />}
                        />
                    ))}
            </Route>

            {/* === Bejelentkezés és egyéb publikus route-ok === */}
            {routes
                .filter((route) => !route.isPrivate) // pl. /login, /forgot
                .map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={<AuthenticatedRedirect element={route.component} />}
                    />
                ))}

            {/* === 404 fallback === */}
            <Route path="*" element={<div>404 – Az oldal nem található</div>} />
        </Routes>
    );
};

export default Routing;
