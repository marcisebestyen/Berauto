import {useEffect, useState} from "react";
import {rem, Button, useMantineTheme, DefaultMantineColor, Stack} from "@mantine/core";
import {
    IconUserCircle,
    IconHome,
    IconCar,
    IconListCheck,
    IconTransferOut,
    IconRun,
    IconLockCheck,
    IconPlus,
    IconCircleMinus,
    IconList
} from "@tabler/icons-react";
import classes from "./NavbarMinimalColored.module.css";
import {useNavigate, useLocation} from "react-router-dom";
import {useMediaQuery} from "@mantine/hooks";
import useAuth from "../../hooks/useAuth.tsx";


interface NavbarLinkProps {
    icon: typeof IconHome;
    label: string;
    color: DefaultMantineColor;
    active?: boolean;

    onClick?(): void;
}

function NavbarLink({icon: Icon, label, color, active, onClick}: NavbarLinkProps) {
    const theme = useMantineTheme();
    return (
        <div
            role="button"
            className={`${classes.link} ${active ? classes.activeLink : ''}`}
            onClick={onClick}
            data-active={active || undefined}
        >
            <Button
                variant="light"
                color={active ? color : theme.primaryColor}
                className={classes.iconButton}
                style={{width: rem(40), height: rem(40), flexGrow: 0, flexShrink: 0, flexBasis: rem(40)}}
            >
                <Icon
                    className={classes.linkIcon}
                    style={{width: rem(25), height: rem(25), flexGrow: 0, flexShrink: 0, flexBasis: rem(25)}}
                    stroke={1.8}
                />
            </Button>
            <span className={classes.label}>{label}</span>
        </div>
    );
}

const ROLES = {
    ADMIN: 'Admin',
    STAFF: 'Staff',
    RENTER: 'Renter',
};

export function NavbarMinimal({toggle}: { toggle: () => void }) {
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const [activeLink, setActiveLink] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const {logout, isAuthenticated, user} = useAuth();

    const getMenuItems = () => {
        const basePublicItems = [
            { icon: IconHome, label: "Kezdőlap", url: "/dashboard", color: "blue" },
            { icon: IconCar, label: "Autó bérlése", url: "/cars", color: "teal" },
        ];

        const staffSpecificItems = [
            { icon: IconListCheck, label: "Igények Kezelése", url: "/staff/pending-rents", color: "violet" },
            { icon: IconTransferOut, label: "Autóátadások", url: "/staff/handovers", color: "grape" },
            { icon: IconRun, label: "Futó Kölcsönzések", url: "/staff/running-rents", color: "orange" },
            { icon: IconLockCheck, label: "Lezárt Kölcsönzések", url: "/staff/completed-rents", color: "lime" },
            { icon: IconUserCircle, label: "Számlák", url: "/staff/receipts", color: "blue" },
        ];
        const userSpecificItems = [
            { icon: IconUserCircle, label: "Saját számláim", url: "/receipts/my", color: "blue" },
        ];
        const adminSpecificItems = [
            { icon: IconPlus, label: "Autó hozzáadása", url: "/admin/add-car", color: "green" },
            { icon: IconCar, label: "Autó adatok szerkesztése", url: "/admin/update", color: "green" },
            {
                icon: IconCircleMinus, label: "Autó eltávolítása", url: "/admin/delete", color: "red"
            },
            { icon: IconList, label: "Autók" , url: "/admin/list-cars", color: "blue" },
        ];


        let visibleItems = [...basePublicItems];

        if (isAuthenticated && user?.role === ROLES.STAFF) {
            visibleItems = [...visibleItems, ...staffSpecificItems];
        }

        if (isAuthenticated && user?.role === ROLES.ADMIN) {
            visibleItems = [...visibleItems, ...staffSpecificItems, ...adminSpecificItems];
        }
        if (isAuthenticated && (user?.role === ROLES.RENTER || user?.role === ROLES.ADMIN || user?.role === ROLES.STAFF)) {
            visibleItems = [...visibleItems, ...userSpecificItems];
        }

        return visibleItems;
    };


    const menuItems = getMenuItems();


    useEffect(() => {
        const currentPath = location.pathname;
        const activeItem = menuItems.find(item => currentPath.startsWith(item.url) && item.url !== "/");

        if (activeItem) {
            setActiveLink(activeItem.url);
        } else if (currentPath.startsWith("/profile") && isAuthenticated) {
            setActiveLink("/profile");
        } else if (currentPath === "/" || currentPath === "/dashboard") {
            const dashboardItem = menuItems.find(item => item.url === "/dashboard");
            if (dashboardItem) setActiveLink(dashboardItem.url);
        } else {
            setActiveLink(null);
        }
    }, [location.pathname, isAuthenticated, menuItems]);

    const links = menuItems
        .map((link) => (
            <NavbarLink
                {...link}
                key={link.label}
                active={activeLink === link.url}
                onClick={() => {
                    navigate(link.url);
                    if (isMobile) toggle();
                }}
            />
        ));

    return (
        <nav className={classes.navbar}>
            <div className={classes.navbarWrapper}>
                <Stack gap="xs" className={classes.navbarMain}>
                    {links}
                </Stack>
            </div>
        </nav>
    );
}
