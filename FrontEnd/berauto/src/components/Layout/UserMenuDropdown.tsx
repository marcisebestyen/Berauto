import {
    Avatar,
    Text,
    Group,
    Menu,
    rem,
    UnstyledButton,
    useMantineTheme,
    Flex,
    Center
} from "@mantine/core";
import { IconChevronDown, IconLogout, IconUserCircle } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";
import useAuth from "../../hooks/useAuth.tsx"; // Ellenőrizd az útvonalat

const UserMenuDropdown = () => {
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const { logout, user } = useAuth();

    const handleLogout = () => {
        logout(); // Törli a tokent, usert stb.
        // A window.location.reload() helyett érdemesebb lehet a navigate('/') vagy navigate('/login')
        // használata a React Routerrel való konzisztens navigáció érdekében,
        // és hogy elkerüld a teljes oldal újratöltést, ami elveszítheti a kliensoldali állapotot.
        // Például: navigate('/login');
        window.location.reload(); // Teljes oldal újratöltés
    };


    const items = [
        {
            url: 'profile',
            label: "Profil",
            onClick: () => {
                console.log("UserMenuDropdown: Profilra navigálás..."); // Debug log
                navigate('profile'); // <-- Ez a sor felel a profil oldalra navigálásért
            },
            icon: IconUserCircle
        },
        {
            url: 'logout',
            label: "Kijelentkezés",
            onClick: handleLogout,
            icon: IconLogout
        }
    ];

    // Feltételezzük, hogy a user objektum tartalmaz egy 'email' property-t.
    // Ha más a property neve (pl. username), akkor azt használd.
    const profileName = <>{user?.email || 'Profil'}</>; // Fallback, ha nincs email

    return (
        <Menu
            width={260}
            position="bottom-start"
            transitionProps={{ transition: 'pop-top-right' }}
            withinPortal
        >
            <Menu.Target>
                <UnstyledButton>
                    <Group gap={7}>
                        <Avatar src="/avatars/avatar_user.png" alt="User profil" radius="xl" size={20} />
                        <Text fw={500} size="sm" lh={1} mr={3}>
                            {profileName}
                        </Text>
                        <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                    </Group>
                </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
                {/* Mobil nézetben a profilnév megismétlése a menüben, ha szükséges */}
                {isMobile && user?.email && ( // Csak akkor jelenjen meg, ha van user és email
                    <Menu.Item
                        disabled // Ez a menüpont nem kattintható, csak megjeleníti az adatokat
                        leftSection={
                            <Flex align="center"> {/* Flex és align="center" a jobb igazításért */}
                                <Avatar src="/avatars/avatar_user.png" alt="User profil" radius="xl" size={20} />
                                <Text fw={500} size="sm" lh={1} ml="xs"> {/* Kis margó a szövegnek */}
                                    {profileName}
                                </Text>
                            </Flex>
                        }
                    />
                )}
                {items.map(item => (
                    <Menu.Item
                        key={item.url}
                        onClick={item.onClick}
                        leftSection={
                            <item.icon
                                style={{ width: rem(16), height: rem(16) }}
                                color={theme.colors.grape[6]} // Használhatsz téma színeket
                                stroke={1.5}
                            />
                        }
                    >
                        {item.label}
                    </Menu.Item>
                ))}
            </Menu.Dropdown>
        </Menu>
    );
};

export default UserMenuDropdown;
