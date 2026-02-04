import { useEffect, useState } from 'react';
import {
    Container,
    Title,
    Text,
    Paper,
    LoadingOverlay,
    Box,
    Center,
    Alert,
    SimpleGrid,
    Group,
    ThemeIcon,
    Table,
    Divider,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconChartLine, // Aktív bérlések
    IconUsers,       // Függő igények
    IconCar,         // Összes autó
    IconAlertTriangle, // Figyelmet igénylő
    IconCash,        // Bevétel
    IconCalendarStats, // Havi bevétel
    IconStar,        // Top autók
} from '@tabler/icons-react';
// JAVÍTVA: Helyes importok
import api from '../api/api';
import { IStatistics } from '../interfaces/IStatistics.ts'; // Az új interfész importálása
import dayjs from 'dayjs';

// Egy "Kártya" komponens a statisztikákhoz (Grid item)
const StatCard = ({ title, value, icon, color }: { title: string, value: string | number, icon: React.ReactNode, color: string }) => {
    return (
        <Paper
            p="md"
            radius="md"
            withBorder
            style={{
                background: 'rgba(15, 23, 42, 0.4)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
        >
            <Group>
                <ThemeIcon color={color} variant="light" size="lg" radius="md">
                    {icon}
                </ThemeIcon>
                <Box>
                    <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                        {title}
                    </Text>
                    <Text fw={700} size="xl">
                        {value}
                    </Text>
                </Box>
            </Group>
        </Paper>
    );
};


const AdminDashboard = () => {
    // JAVÍTVA: A useState típusa és a dupla '=' eltávolítva
    const [stats, setStats] = useState<IStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            setError(null);
            try {
                // Hívás az új API végpontra
                const response = await api.Statistics.getDashboardStats();
                setStats(response.data);
            } catch (err: any) {
                console.error("Dashboard hiba:", err);
                setError("Hiba a statisztikák lekérésekor. Nincs megfelelő jogosultsága (Admin) vagy a szerver nem elérhető.");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Helper a pénz formázásához
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('hu-HU', {
            style: 'currency',
            currency: 'HUF',
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <Container size="xl" my="xl">
            <Box mb="xl">
                <Title order={1} size="h2" fw={900} style={{
                    // Egyedi "admin" színátmenet
                    background: 'linear-gradient(45deg, #f76707 0%, #fab005 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem',
                }}>
                    Admin Dashboard
                </Title>
                <Text c="dimmed" size="sm">Vezetői kimutatások és statisztikák</Text>
            </Box>

            <Box style={{ position: 'relative' }}>
                <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />

                {error && (
                    <Alert icon={<IconAlertCircle size="1rem" />} title="Betöltési hiba" color="red" radius="md" variant="light">
                        {error}
                    </Alert>
                )}

                {/* JAVÍTVA: Egyetlen feltételblokkba vontam össze a tartalmat */}
                {stats && !loading && !error && (
                    <>
                        {/* KPI Kártyák */}
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="xl">
                            <StatCard
                                title="Összbevétel (Örök)"
                                value={formatCurrency(stats.totalRevenueAllTime)}
                                icon={<IconCash size={20} />}
                                color="green"
                            />
                            <StatCard
                                title="Bevétel (Aktuális Hó)"
                                value={formatCurrency(stats.revenueThisMonth)}
                                icon={<IconCalendarStats size={20} />}
                                color="lime"
                            />
                            <StatCard
                                title="Aktív Bérlések"
                                value={stats.activeRentsCount}
                                icon={<IconChartLine size={20} />}
                                color="blue"
                            />
                            <StatCard
                                title="Függő Igények"
                                value={stats.pendingRequestsCount}
                                icon={<IconUsers size={20} />}
                                color="yellow"
                            />
                            <StatCard
                                title="Összes Autó"
                                value={stats.totalCarsCount}
                                icon={<IconCar size={20} />}
                                color="gray"
                            />
                            <StatCard
                                title="Figyelmet Igénylő Autók"
                                value={stats.carsOnWarningListCount}
                                icon={<IconAlertTriangle size={20} />}
                                color="red"
                            />
                        </SimpleGrid>
                        {/* JAVÍTVA: A hibás tag (`SimpleGrid>`) helyett a helyes lezárás (`</SimpleGrid>`) */}

                        {/* Táblázatok (Grafikonok helyett) */}
                        <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="xl" mt="xl">
                            {/* Legnépszerűbb autók */}
                            <Paper shadow="md" p="lg" withBorder radius="md" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                <Group gap="sm" mb="md">
                                    <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                                        <IconStar size={20} />
                                    </ThemeIcon>
                                    <Title order={4}>Legnépszerűbb Autók</Title>
                                </Group>
                                <Divider opacity={0.1} mb="md" />
                                <Table striped={false} highlightOnHover={false}>
                                    <Table.Thead style={{ background: 'rgba(15, 23, 42, 0.6)' }}>
                                        <Table.Tr>
                                            <Table.Th>Márka</Table.Th>
                                            <Table.Th>Modell</Table.Th>
                                            <Table.Th>Bérlések száma</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {stats.popularCars.length > 0 ? (
                                            stats.popularCars.map(car => (
                                                <Table.Tr key={car.carId}>
                                                    <Table.Td>{car.brand}</Table.Td>
                                                    <Table.Td>{car.model}</Table.Td>
                                                    <Table.Td>{car.rentCount} db</Table.Td>
                                                </Table.Tr>
                                            ))
                                        ) : (
                                            <Table.Tr>
                                                <Table.Td colSpan={3}>
                                                    <Text c="dimmed" ta="center" py="md">Nincsenek adatok</Text>
                                                </Table.Td>
                                            </Table.Tr>
                                        )}
                                    </Table.Tbody>
                                </Table>
                            </Paper>

                            {/* Utolsó 30 nap (Grafikon helyett táblázat) */}
                            <Paper shadow="md" p="lg" withBorder radius="md" style={{ background: 'rgba(30, 41, 59, 0.4)' }}>
                                <Group gap="sm" mb="md">
                                    <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
                                        <IconCalendarStats size={20} />
                                    </ThemeIcon>
                                    <Title order={4}>Új Bérlések (Utolsó 30 Nap)</Title>
                                </Group>
                                <Divider opacity={0.1} mb="md" />
                                <Box style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <Table striped={false} highlightOnHover={false}>
                                        <Table.Thead style={{ background: 'rgba(15, 23, 42, 0.6)', position: 'sticky', top: 0 }}>
                                            <Table.Tr>
                                                <Table.Th>Dátum</Table.Th>
                                                <Table.Th>Új Bérlések (db)</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>
                                            {stats.rentsLast30Days.length > 0 ? (
                                                stats.rentsLast30Days.map(day => (
                                                    <Table.Tr key={day.date}>
                                                        <Table.Td>{dayjs(day.date).format('YYYY.MM.DD')}</Table.Td>
                                                        <Table.Td>{day.count} db</Table.Td>
                                                    </Table.Tr>
                                                ))
                                            ) : (
                                                <Table.Tr>
                                                    <Table.Td colSpan={2}>
                                                        <Text c="dimmed" ta="center" py="md">Nincsenek adatok</Text>
                                                    </Table.Td>
                                                </Table.Tr>
                                            )}
                                        </Table.Tbody>
                                    </Table>
                                </Box>
                            </Paper>
                        </SimpleGrid>
                    </>
                )}

                {/* Betöltés közben üres hely */}
                {loading && (
                    <Center style={{ minHeight: '500px' }}></Center>
                )}
            </Box>
        </Container>
    );
};

export default AdminDashboard;