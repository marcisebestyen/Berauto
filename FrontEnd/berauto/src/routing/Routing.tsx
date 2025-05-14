import { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import BasicLayout from '../components/Layout/BasicLayout'; // Ensure this path is correct
import { routes } from './Routes'; // Ensure this path is correct (contains login, forgot, dashboard, cars)
import useAuth from '../hooks/useAuth'; // Ensure this path is correct

// Helper component to protect routes - redirects to login if not authenticated
const PrivateRoute = ({ element }: { element: ReactElement }) => {
    const {isAuthenticated: isAuthenticated} = useAuth();
    // console.log("PrivateRoute check:", isAuthenticated); // Keep for debugging if needed
    return isAuthenticated ? element : <Navigate to="/login" replace />;
};

// Helper component to redirect authenticated users away from public pages like login
// Redirects logged-in users trying to access '/' or public routes to '/app'
const AuthenticatedRedirect = ({ element }: { element: ReactElement }) => {
    const { isAuthenticated } = useAuth();
    // If logged in, redirect to /app (which defaults to /app/dashboard), otherwise show the element (e.g., Login page)
    return isAuthenticated ? <Navigate to="/app" replace /> : element;
};

const Routing = () => {
    // Note: We don't need to get isLoggedIn here directly, the helper components handle it.

    return (
        <Routes>
            {/* Root path: Redirect to /app if logged in, otherwise to /login */}
            <Route
                path="/"
                element={<AuthenticatedRedirect element={<Navigate to="/login" replace />} />}
            />

            {/* Public Routes: Accessible only when logged out */}
            {routes
                .filter((route) => !route.isPrivate) // e.g., /login, /forgot
                .map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        // Use AuthenticatedRedirect to push logged-in users away from login/forgot pages
                        element={<AuthenticatedRedirect element={route.component} />}
                    />
                ))}

            {/* --- Main Private Route Section --- */}
            <Route
                path="app" // All private routes will be nested under /app
                element={
                    // Protect the layout itself. If not logged in, redirects to /login
                    <PrivateRoute element={<BasicLayout />} />
                }
            >
                {/* Default route for /app: Redirects immediately to dashboard */}
                <Route
                    index // Use index for the default child route when path is exactly "/app"
                    element={<Navigate to="dashboard" replace />} // Redirect to relative path "dashboard" -> "/app/dashboard"
                />

                {/* Map ALL private routes from Routes.tsx as children */}
                {routes
                    .filter((route) => route.isPrivate) // Gets dashboard, cars, etc.
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path} // Relative path, e.g., "cars" becomes "/app/cars"
                            // Render the component directly. The parent <PrivateRoute> already protects it.
                            element={route.component}
                            // Optional: Teacher's code had another PrivateRoute wrapper here,
                            // you can add it back if needed, but it's slightly redundant:
                            // element={<PrivateRoute element={route.component} />}
                        />
                    ))}
            </Route>

            {/* Catch-all 404 Not Found route (Good practice to keep) */}
            <Route path="*" element={<div>404 - Page Not Found (Updated)</div>} />
        </Routes>
    );
};

export default Routing;
