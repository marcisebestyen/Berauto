import {ReactElement} from 'react';
import {Routes, Route, Navigate} from 'react-router-dom';
import BasicLayout from '../components/Layout/BasicLayout';
import {routes} from './Routes';
import useAuth from '../hooks/useAuth';
import Dashboard from "../pages/Dashboard";

const AuthenticatedRedirect = ({element}: { element: ReactElement }) => {
    const {isAuthenticated} = useAuth();
    return isAuthenticated ? <Navigate to="/" replace/> : element;
};

const PrivateRoute = ({element}: { element: ReactElement }) => {
    const {isAuthenticated} = useAuth();
    return isAuthenticated ? element : <Navigate to="/login" replace/>;
};

const Routing = () => {
    const standalonePaths = ['login', 'forgot'];

    return (
        <Routes>
            <Route path="/" element={<BasicLayout/>}>
                <Route index element={<Dashboard/>}/>

                {routes
                    .filter(route => !standalonePaths.includes(route.path))
                    .map((route) => (
                        <Route
                            key={route.path}
                            path={route.path}
                            element={route.isPrivate ? <PrivateRoute element={route.component}/> : route.component}
                        />
                    ))}
            </Route>

            {routes
                .filter(route => standalonePaths.includes(route.path))
                .map((route) => (
                    <Route
                        key={route.path}
                        path={route.path}
                        element={<AuthenticatedRedirect element={route.component}/>}
                    />
                ))}

            <Route path="*" element={<div>404 – Az oldal nem található</div>}/>
        </Routes>
    );
};

export default Routing;