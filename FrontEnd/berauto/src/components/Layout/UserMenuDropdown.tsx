import {Avatar, Text, Group, Menu, rem, UnstyledButton, useMantineTheme, Flex, Center} from "@mantine/core";
import {IconChevronDown, IconLogout, IconUserCircle} from "@tabler/icons-react";
import {useNavigate} from "react-router-dom";
import {useMediaQuery} from "@mantine/hooks";
import useAuth from "../../hooks/useAuth.tsx";

const UserMenuDropdown = () => {
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    const {logout, email} = useAuth();

    const items = [
        {
            url: 'profile',
            label: "Profil",
            onClick: () => {
                navigate('profile');
            },
            icon: IconUserCircle
        },
        {
            url: 'logout',
            label: "Kijelentkezés",
            onClick: () => {logout()},
            icon: IconLogout
        }
    ]

    const profileName = <>{email}</>

    return <>
        <Menu
            width={260}
            position="bottom-start"
            transitionProps={{transition: 'pop-top-right'}}
            withinPortal
        >
            <Menu.Target>
                <UnstyledButton
                >
                    <Group gap={7}>
                       <Avatar src="/avatars/avatar_user.png" alt="User profil" radius="xl" size={20}/>
                        <Text fw={500} size="sm" lh={1} mr={3}>
                            {profileName}
                        </Text>
                        <IconChevronDown style={{width: rem(12), height: rem(12)}} stroke={1.5}/>
                    </Group>
                </UnstyledButton>
            </Menu.Target>

            <Menu.Dropdown>
                {isMobile &&
                    <Menu.Item
                        onClick={undefined}
                        leftSection={
                            <Flex>
                                <Center>
                                   <Avatar src="/avatars/avatar_user.png" alt="User profil" radius="xl" size={20}/>
                                    <Text fw={500} size="sm" lh={1} mr={3}>
                                        {profileName}
                                    </Text>
                                </Center>
                            </Flex>
                        }
                    >
                    </Menu.Item>
                }
                {items.map(item =>
                    <Menu.Item
                        key={item.url}
                        onClick={item.onClick}
                        leftSection={
                            <item.icon
                                style={{width: rem(16), height: rem(16)}}
                                color="purple"
                                stroke={1}
                            />
                        }

                    >
                        {item.label}
                    </Menu.Item>
                )}
            </Menu.Dropdown>
        </Menu>
    </>
}

export default UserMenuDropdown;