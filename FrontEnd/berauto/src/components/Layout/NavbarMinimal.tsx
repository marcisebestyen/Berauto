import {useEffect, useState} from "react";
import {rem, Button, useMantineTheme, MantineColor} from "@mantine/core";
import {
    IconUserCircle,
    IconLogout,
    IconHome,
    IconCar
} from "@tabler/icons-react";
import classes from "./NavbarMinimalColored.module.css"; // Győződj meg róla, hogy ez a CSS fájl létezik és helyes
import {useNavigate, useLocation} from "react-router-dom"; // useLocation importálása az aktív linkhez
import {useMediaQuery} from "@mantine/hooks";
import useAuth from "../../hooks/useAuth.tsx"; // Ellenőrizd az útvonalat

interface NavbarLinkProps {
    icon: typeof IconHome;
    label: string;
    color: MantineColor; // MantineColor típus használata
    active?: boolean;
    onClick?(): void;
}

function NavbarLink({icon: Icon, label, color, active, onClick}: NavbarLinkProps) {
    const theme = useMantineTheme(); // Téma hook használata itt is, ha szükséges a színkezeléshez
    return (
        <div
            role="button"
            className={`${classes.link} ${active ? classes.activeLink : ''}`} // CSS osztály az aktív állapothoz
            // A 'color' prop a div-en nem standard, a Mantine Button-nek adjuk át
            onClick={onClick}
            data-active={active || undefined} // Mantine használhatja ezt
        >
            <Button
                variant="light"
                color={active ? color : theme.primaryColor} // Dinamikus szín az aktív állapottól függően
                className={classes.iconButton}
                style={{width: rem(40), height: rem(40), flexGrow: 0, flexShrink:0, flexBasis: rem(40)}}
            >
                <Icon
                    className={classes.linkIcon}
                    style={{width: rem(25), height: rem(25), flexGrow: 0, flexShrink:0, flexBasis: rem(25)}}
                    stroke={1.8}
                />
            </Button>
            <span className={classes.label}>{label}</span> {/* CSS osztály a label-hez */}
        </div>
    );
}

export function NavbarMinimal({toggle}: {toggle: () => void}) { // toggle típusának pontosítása
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    // Az 'active' state helyett 'activeLink' stringet használunk az URL tárolására
    const [activeLink, setActiveLink] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation(); // Jelenlegi útvonal lekérdezése
    const {logout, isAuthenticated} = useAuth();  // isAuthenticated lekérése

    const menuItems = [
        {
            icon: IconHome,
            label: "Kezdőlap",
            url: "/dashboard", // Abszolút útvonalak használata javasolt
            color: "blue" as MantineColor
        },
        {
            icon: IconCar,
            label: "Autó bérlése",
            url: "/cars", // Abszolút útvonalak használata javasolt
            color: "teal" as MantineColor
        }
    ];

    const handleLogout = () => {
        logout();
        navigate('/login'); // Navigálás a login oldalra a teljes újratöltés helyett
    };

    useEffect(() => {
        // Az aktív link beállítása a jelenlegi útvonal alapján
        const currentPath = location.pathname;
        const mainActive = menuItems.find(item => currentPath.startsWith(item.url) && item.url !== "/");
        const profileActive = currentPath.startsWith("/profile");

        if (mainActive) {
            setActiveLink(mainActive.url);
        } else if (profileActive && isAuthenticated) { // Profil csak bejelentkezve lehet aktív
            setActiveLink("/profile");
        } else if (currentPath === "/" || currentPath === "/dashboard") { // Kezdőlap speciális kezelése
            const dashboardItem = menuItems.find(item => item.url === "/dashboard");
            if (dashboardItem) setActiveLink(dashboardItem.url);
        }
        else {
            setActiveLink(null);
        }
    }, [location.pathname, isAuthenticated]); // Figyeljük az isAuthenticated állapotot is

    const links = menuItems
        .map((link) => (
            <NavbarLink
                {...link} // A color prop a link objektumból jön
                key={link.label}
                active={activeLink === link.url}
                onClick={() => {
                    navigate(link.url);
                    if (isMobile) toggle(); // Csak mobilon zárja be a menüt
                }}
            />
        ));

    return (
        <nav className={classes.navbar}>
            <div className={classes.navbarWrapper}> {/* Wrapper a jobb struktúráért */}
                <div className={classes.navbarMain}>
                    {links}
                </div>
                {/* A footer (Profil és Kijelentkezés) csak akkor jelenik meg, ha a felhasználó be van jelentkezve */}
                {isAuthenticated && (
                    <div className={classes.footer} style={{width: !isMobile ? 'calc(100% - 16px)' : '90%'}}> {/* Szélesség igazítása */}
                        <NavbarLink
                            active={activeLink === "/profile"}
                            icon={IconUserCircle}
                            label="Profil"
                            onClick={() => {
                                navigate("/profile"); // Abszolút útvonal
                                if (isMobile) toggle();
                            }}
                            color="grape"
                        />
                        <NavbarLink
                            icon={IconLogout}
                            label="Kijelentkezés"
                            onClick={handleLogout}
                            color="red" // Kijelentkezéshez gyakran pirosas színt használnak
                        />
                    </div>
                )}
            </div>
        </nav>
    );
}
