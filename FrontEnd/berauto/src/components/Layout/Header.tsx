import { Box, Burger, Flex, Text, Group, ThemeIcon } from "@mantine/core";
import { IconSparkles, IconCar } from "@tabler/icons-react";
import UserMenuDropdown from "./UserMenuDropdown.tsx";

const Header = ({ opened, toggle }: any) => {
    return (
        <Flex
            justify="space-between"
            align="center"
            h="100%"
            px="xl"
            style={{
                background:
                    "linear-gradient(90deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)",
                borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
            }}
        >
            {/* Logo Section */}
            <Group gap="md">
                <Box
                    style={{
                        position: "relative",
                        padding: "10px",
                        borderRadius: "12px",
                        background:
                            "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.15))",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <IconCar
                        size={34}
                        stroke={1.7}
                        color="#3b82f6"
                        style={{
                            filter: "drop-shadow(0 0 6px rgba(59,130,246,0.25))",
                        }}
                    />
                    <ThemeIcon
                        size="xs"
                        radius="xl"
                        variant="gradient"
                        gradient={{ from: "blue", to: "cyan", deg: 45 }}
                        style={{
                            position: "absolute",
                            top: -4,
                            right: -4,
                            animation: "pulse 2s infinite",
                        }}
                    >
                        <IconSparkles size={12} />
                    </ThemeIcon>
                </Box>

                <Box visibleFrom="sm">
                    <Text
                        size="lg"
                        fw={900}
                        style={{
                            background: "linear-gradient(45deg, #3b82f6, #06b6d4)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            letterSpacing: "-0.4px",
                        }}
                    >
                        AutoRent
                    </Text>
                    <Text size="xs" c="dimmed" fw={500}>
                        Prémium autóbérlés
                    </Text>
                </Box>
            </Group>

            {/* Right Section */}
            <Group gap="md">
                <Box visibleFrom="sm">
                    <UserMenuDropdown />
                </Box>
                <Burger
                    opened={opened}
                    onClick={toggle}
                    hiddenFrom="sm"
                    size="sm"
                    style={{
                        "& .mantine-Burger-burger": {
                            background: "rgba(59, 130, 246, 0.8)",
                        },
                    }}
                />
            </Group>

            {/* Animation for the sparkle */}
            <style>
                {`
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
              transform: scale(1);
            }
            50% {
              opacity: 0.8;
              transform: scale(0.95);
            }
          }
        `}
            </style>
        </Flex>
    );
};

export default Header;
