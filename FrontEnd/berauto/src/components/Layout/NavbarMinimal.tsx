import {useEffect, useState} from "react";
import {rem, Button, useMantineTheme, MantineColor, Stack} from "@mantine/core";
import {
    IconUserCircle,
    IconLogout,
    IconHome,
    IconCar,
    IconListCheck,     // Kölcsönzési Igények (Pending Rents)
    IconTransferOut,   // Átadandó Autók (Handovers)
    IconRun,           // Futó Kölcsönzések (Running Rents)
    IconLockCheck,     // Lezárt Kölcsönzések (Completed Rents)
    // IconGauge // Opcionális: Autók Állapota
} from "@tabler/icons-react";
import classes from "./NavbarMinimalColored.module.css"; // Győződj meg róla, hogy ez a CSS fájl létezik és helyes
import {useNavigate, useLocation} from "react-router-dom";
import {useMediaQuery} from "@mantine/hooks";
import useAuth from "../../hooks/useAuth.tsx"; // Ellenőrizd az útvonalat

interface NavbarLinkProps {
    icon: typeof IconHome; // Vagy egy általánosabb Icon típus
    label: string;
    color: MantineColor;
    active?: boolean;
    onClick?(): void;
}

// NavbarLink alkomponens
function NavbarLink({icon: Icon, label, color, active, onClick}: NavbarLinkProps) {
    const theme = useMantineTheme();
    return (
        <div
            role="button"
            className={`${classes.link} ${active ? classes.activeLink : ''}`} // CSS osztály az aktív állapothoz
            onClick={onClick}
            data-active={active || undefined}
        >
            <Button
                variant="light"
                color={active ? color : theme.primaryColor} // Dinamikus szín
                className={classes.iconButton}
                style={{width: rem(40), height: rem(40), flexGrow: 0, flexShrink:0, flexBasis: rem(40)}}
            >
                <Icon
                    className={classes.linkIcon}
                    style={{width: rem(25), height: rem(25), flexGrow: 0, flexShrink:0, flexBasis: rem(25)}}
                    stroke={1.8}
                />
            </Button>
            <span className={classes.label}>{label}</span>
        </div>
    );
}

// Definiáljuk a szerepköröket konstansként a könnyebb hivatkozás érdekében
// Fontos: Ezeknek a stringeknek pontosan meg kell egyezniük azokkal,
// amiket a backend a JWT tokenben küld, és amiket a useAuth hook a user.role-ban visszaad.
const ROLES = {
    ADMIN: 'Admin',
    STAFF: 'Staff', // Vagy 'Clerk', 'Operator', stb. – igazítsd a te rendszeredhez!
    RENTER: 'Renter',
    // GUEST: 'Guest' // Ha lenne explicit vendég szerepkör
};

export function NavbarMinimal({toggle}: {toggle: () => void}) {
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const [activeLink, setActiveLink] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();
    const {logout, isAuthenticated, user } = useAuth(); // user.role-t fogjuk használni

    // Dinamikusan összeállított menüpontok a user szerepköre alapján
    const getMenuItems = () => {
        const allPossibleItems = [
            {
                icon: IconHome,
                label: "Kezdőlap",
                url: "/dashboard",
                color: "blue" as MantineColor,
                allowedRoles: [ROLES.RENTER, ROLES.STAFF, ROLES.ADMIN] // Minden bejelentkezett felhasználó
            },
            {
                icon: IconCar,
                label: "Autó bérlése",
                url: "/cars",
                color: "teal" as MantineColor,
                allowedRoles: [ROLES.RENTER, ROLES.STAFF, ROLES.ADMIN] // Minden bejelentkezett felhasználó
            },
            // Ügyintézői (Staff) menüpontok
            {
                icon: IconListCheck,
                label: "Igények Kezelése",
                url: "/staff/pending-rents",
                color: "violet" as MantineColor,
                allowedRoles: [ROLES.STAFF, ROLES.ADMIN] // Csak Staff és Admin
            },
            {
                icon: IconTransferOut,
                label: "Autóátadások",
                url: "/staff/handovers",
                color: "grape" as MantineColor,
                allowedRoles: [ROLES.STAFF, ROLES.ADMIN]
            },
            {
                icon: IconRun,
                label: "Futó Kölcsönzések",
                url: "/staff/running-rents",
                color: "orange" as MantineColor,
                allowedRoles: [ROLES.STAFF, ROLES.ADMIN]
            },
            {
                icon: IconLockCheck,
                label: "Lezárt Kölcsönzések",
                url: "/staff/completed-rents",
                color: "lime" as MantineColor,
                allowedRoles: [ROLES.STAFF, ROLES.ADMIN]
            },
        ];

        if (!isAuthenticated || !user?.role) {
            // Ha nincs bejelentkezve, vagy nincs szerepköre, üres menüt adunk vissza
            // Vagy itt lehetnének publikus linkek, ha lennének.
            return [];
        }

        return allPossibleItems.filter(item => item.allowedRoles.includes(user.role!));
    };

    const menuItems = getMenuItems();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const currentPath = location.pathname;
        // Az útvonalak most már abszolútak a menuItems-ben
        const activeItem = menuItems.find(item => currentPath.startsWith(item.url) && item.url !== "/");

        if (activeItem) {
            setActiveLink(activeItem.url);
        } else if (currentPath.startsWith("/profile") && isAuthenticated) {
            setActiveLink("/profile");
        } else if (currentPath === "/" || currentPath === "/dashboard") {
            const dashboardItem = menuItems.find(item => item.url === "/dashboard");
            if(dashboardItem) setActiveLink(dashboardItem.url);
        } else {
            setActiveLink(null);
        }
        // menuItems-t hozzáadtam a függőségekhez, mert a tartalma most már függ a user.role-tól
    }, [location.pathname, isAuthenticated, menuItems]);

    const links = menuItems
        .map((link) => (
            <NavbarLink
                {...link} // A color prop a link objektumból jön
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
                {/* A footer (Profil és Kijelentkezés) csak akkor jelenik meg, ha a felhasználó be van jelentkezve */}
                {isAuthenticated && (
                    <div className={classes.footer} style={{width: !isMobile ? 'calc(100% - 16px)' : '90%'}}>
                        <NavbarLink
                            active={activeLink === "/profile"}
                            icon={IconUserCircle}
                            label="Profil"
                            onClick={() => {
                                navigate("/profile");
                                if (isMobile) toggle();
                            }}
                            color="grape"
                        />
                        <NavbarLink
                            icon={IconLogout}
                            label="Kijelentkezés"
                            onClick={handleLogout}
                            color="red"
                        />
                    </div>
                )}
            </div>
        </nav>
    );
}
