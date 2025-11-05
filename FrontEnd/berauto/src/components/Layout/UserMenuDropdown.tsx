import {
    Avatar,
    Text,
    Group,
    Menu,
    rem,
    UnstyledButton,
    useMantineTheme,
    Flex,
    Button,
} from "@mantine/core";
import {IconChevronDown, IconLogout, IconUserCircle, IconLogin} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";
import {useMediaQuery} from "@mantine/hooks";
import useAuth from "../../hooks/useAuth.tsx";

const UserMenuDropdown = () => {
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
    const {logout, user, isAuthenticated} = useAuth();

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
        return (
            <Button
                leftSection={<IconLogin size={rem(18)}/>}
                onClick={handleLogin}
                size="sm"
                // Átalakítva a gradiens gomb stílusra
                style={{
                    background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                    fontWeight: 600,
                }}
            >
                Bejelentkezés
            </Button>
        );
    }

    return (
        <Menu
            width={260}
            position="bottom-start"
            transitionProps={{transition: 'pop-top-right'}}
            withinPortal
        >
            <Menu.Target>
                <UnstyledButton>
                    <Group gap={7}>
                        <Avatar src="/avatars/avatar_user.png" alt="User profil" radius="xl" size={20}/>
                        <Text fw={500} size="sm" lh={1} mr={3} c="white"> {/* Szövegszín fehérre állítva */}
                            {profileName}
                        </Text>
                        <IconChevronDown
                            style={{width: rem(12), height: rem(12)}}
                            stroke={1.5}
                            color={theme.colors.gray[5]} // Chevron színe
                        />
                    </Group>
                </UnstyledButton>
            </Menu.Target>

            {/* A lenyíló menü stílusának átalakítása */}
            <Menu.Dropdown style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)', // "Glass" effekt
            }}>
                {isMobile && user?.email && (
                    <Menu.Item
                        disabled
                        leftSection={
                            <Flex align="center">
                                <Avatar src="/avatars/avatar_user.png" alt="User profil" radius="xl" size={20}/>
                                <Text fw={500} size="sm" lh={1} ml="xs" c="white"> {/* Szövegszín */}
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
                        c="white" // Menüpont szövegszíne
                        leftSection={
                            <item.icon
                                style={{width: rem(16), height: rem(16)}}
                                color={theme.colors.cyan[5]} // Ikon színe (grape helyett)
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