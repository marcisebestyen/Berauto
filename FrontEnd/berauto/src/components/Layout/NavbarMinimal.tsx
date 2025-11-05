import {useEffect, useState} from "react";
import {rem, useMantineTheme, DefaultMantineColor, Stack, Text, Box, Divider} from "@mantine/core";
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
        <Box
            role="button"
            className={`${classes.link} ${active ? classes.activeLink : ''}`}
            onClick={onClick}
            data-active={active || undefined}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: rem(12),
                padding: `${rem(10)} ${rem(16)}`,
                borderRadius: rem(8),
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: active ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                border: active ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
            }}
            onMouseEnter={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }
            }}
            onMouseLeave={(e) => {
                if (!active) {
                    e.currentTarget.style.background = 'transparent';
                }
            }}
        >
            <Box
                style={{
                    width: rem(40),
                    height: rem(40),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: rem(8),
                    background: active
                        ? `linear-gradient(135deg, ${theme.colors[color][6]} 0%, ${theme.colors[color][7]} 100%)`
                        : 'rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease',
                }}
            >
                <Icon
                    style={{width: rem(22), height: rem(22)}}
                    stroke={1.8}
                    color={active ? 'white' : theme.colors[color][5]}
                />
            </Box>
            <Text
                size="sm"
                fw={active ? 600 : 500}
                style={{
                    color: active ? theme.colors[color][4] : 'rgba(255, 255, 255, 0.7)',
                    transition: 'all 0.2s ease',
                }}
            >
                {label}
            </Text>
        </Box>
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
    const {isAuthenticated, user} = useAuth();

    const getMenuItems = () => {
        const basePublicItems = [
            { icon: IconHome, label: "Kezdőlap", url: "/dashboard", color: "blue" },
            { icon: IconCar, label: "Autó bérlése", url: "/cars", color: "cyan" },
        ];

        const staffSpecificItems = [
            { icon: IconListCheck, label: "Igények Kezelése", url: "/staff/pending-rents", color: "green" },
            { icon: IconTransferOut, label: "Autóátadások", url: "/staff/handovers", color: "violet" },
            { icon: IconRun, label: "Futó Kölcsönzések", url: "/staff/running-rents", color: "orange" },
            { icon: IconLockCheck, label: "Lezárt Kölcsönzések", url: "/staff/completed-rents", color: "lime" },
        ];

        const userSpecificItems = [
            { icon: IconUserCircle, label: "Saját számláim", url: "/receipts/my", color: "blue" },
        ];

        const adminSpecificItems = [
            { icon: IconPlus, label: "Autó hozzáadása", url: "/admin/add-car", color: "teal" },
            { icon: IconCar, label: "Autó szerkesztése", url: "/admin/update", color: "blue" },
            { icon: IconCircleMinus, label: "Autó eltávolítása", url: "/admin/delete", color: "red" },
            { icon: IconList, label: "Autók listája" , url: "/admin/list-cars", color: "grape" },
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

    // Csoportosítjuk a menüelemeket
    const baseItems = menuItems.slice(0, 2);
    const staffItems = menuItems.filter(item =>
        item.url.startsWith('/staff/')
    );
    const adminItems = menuItems.filter(item =>
        item.url.startsWith('/admin/')
    );
    const userItems = menuItems.filter(item =>
        item.url.startsWith('/receipts/')
    );

    const renderSection = (items: typeof menuItems, title?: string) => {
        if (items.length === 0) return null;
        return (
            <>
                {title && (
                    <Text
                        size="xs"
                        fw={700}
                        tt="uppercase"
                        c="dimmed"
                        px={16}
                        mt="md"
                        mb="xs"
                        style={{letterSpacing: '0.5px'}}
                    >
                        {title}
                    </Text>
                )}
                <Stack gap={4}>
                    {items.map((link) => (
                        <NavbarLink
                            {...link}
                            key={link.label}
                            active={activeLink === link.url}
                            onClick={() => {
                                navigate(link.url);
                                if (isMobile) toggle();
                            }}
                        />
                    ))}
                </Stack>
            </>
        );
    };

    return (
        <nav className={classes.navbar} style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
            <div className={classes.navbarWrapper} style={{padding: rem(12)}}>
                <Stack gap="xs" className={classes.navbarMain}>
                    {renderSection(baseItems)}

                    {staffItems.length > 0 && (
                        <>
                            <Divider my="sm" opacity={0.1} />
                            {renderSection(staffItems, "Személyzet")}
                        </>
                    )}

                    {adminItems.length > 0 && (
                        <>
                            <Divider my="sm" opacity={0.1} />
                            {renderSection(adminItems, "Adminisztráció")}
                        </>
                    )}

                    {userItems.length > 0 && (
                        <>
                            <Divider my="sm" opacity={0.1} />
                            {renderSection(userItems, "Profil")}
                        </>
                    )}
                </Stack>
            </div>
        </nav>
    );
}