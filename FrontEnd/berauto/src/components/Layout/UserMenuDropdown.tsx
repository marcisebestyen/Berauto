import {
    Avatar,
    Text,
    Group,
    Menu,
    rem,
    UnstyledButton,
    useMantineTheme,
    Flex,
    Button, // Button importálása a bejelentkezés gombhoz
} from "@mantine/core";
import { IconChevronDown, IconLogout, IconUserCircle, IconLogin } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { useMediaQuery } from "@mantine/hooks";
import useAuth from "../../hooks/useAuth.tsx";

const UserMenuDropdown = () => {
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const { logout, user, isAuthenticated } = useAuth();

    const handleLogout = () => {
        logout(() => {
            window.location.href = '/';
        });
    };

    const handleLogin = () => {
        navigate('/login');
    };

    const authenticatedUserItems = [
        {
            url: '/profile',
            label: "Profil",
            onClick: () => {
                navigate('/profile');
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

    const profileName = <>{user?.email || 'Profil'}</>;

    if (!isAuthenticated) {
        // Ha a felhasználó nincs bejelentkezve, egy "Bejelentkezés" gombot jelenítünk meg
        return (
            <Button
                variant="default" // Vagy "subtle", "outline", stb.
                leftSection={<IconLogin size={rem(18)} />}
                onClick={handleLogin}
            >
                Bejelentkezés
            </Button>
        );
    }

    // Ha a felhasználó be van jelentkezve, a menüt jelenítjük meg
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
                            {profileName} {/* Ez most már biztosan a user.email lesz, mert isAuthenticated true */}
                        </Text>
                        <IconChevronDown style={{ width: rem(12), height: rem(12) }} stroke={1.5} />
                    </Group>
                </UnstyledButton>
            </Menu.Target>

            {/* A Menu.Dropdown tartalma csak akkor jelenik meg, ha a felhasználó be van jelentkezve,
                de ezt a külső if (!isAuthenticated) már kezeli, így itt a user biztosan létezik. */}
            <Menu.Dropdown>
                {/* Mobil nézetben a profilnév és avatar megismétlése */}
                {isMobile && user?.email && (
                    <Menu.Item
                        disabled
                        leftSection={
                            <Flex align="center">
                                <Avatar src="/avatars/avatar_user.png" alt="User profil" radius="xl" size={20} />
                                <Text fw={500} size="sm" lh={1} ml="xs">
                                    {user.email}
                                </Text>
                            </Flex>
                        }
                    />
                )}
                {authenticatedUserItems.map(item => (
                    <Menu.Item
                        key={item.url}
                        onClick={item.onClick}
                        leftSection={
                            <item.icon
                                style={{ width: rem(16), height: rem(16) }}
                                color={theme.colors.grape[6]}
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
