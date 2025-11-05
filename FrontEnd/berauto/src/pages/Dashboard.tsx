import {useEffect, useState} from 'react';
import {
    Text,
    Title,
    Button,
    Stack,
    Paper,
    Group,
    Badge,
    Container,
    LoadingOverlay,
    Divider,
    Box,
    Center,
    ThemeIcon,
} from '@mantine/core';
import {
    IconLogin,
    IconUserPlus,
    IconKey,
    IconCar,
    IconHistory,
    IconCarOff,
    IconListDetails,
} from '@tabler/icons-react';
import {useNavigate} from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/api';
import {ISimpleRent} from '../interfaces/IRent';
import dayjs from 'dayjs';

const Dashboard = () => {
    const {user} = useAuth();
    const navigate = useNavigate();

    const [allRents, setAllRents] = useState<ISimpleRent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRents = async () => {
            if (user?.id) {
                setLoading(true);
                try {
                    const allRes = await api.Users.getUserRents(user.id);
                    if (Array.isArray(allRes.data)) {
                        setAllRents(allRes.data);
                    }
                } catch (error) {
                    console.error("Hiba a foglalások lekérésekor:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchRents();
    }, [user]);

    if (!user) {
        return (
            <Container size="md" my="xl">
                <Paper
                    shadow="xl" p="xl" withBorder
                    style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                >
                    <Center py={40} style={{flexDirection: 'column'}}>
                        <ThemeIcon size={80} radius="xl" variant="light" color="cyan" mb="md"
                                   style={{
                                       background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                                   }}
                        >
                            <IconKey size={40} stroke={1.5}/>
                        </ThemeIcon>
                        <Title order={3} fw={700} mb="xs">Üdvözlünk, Vendég!</Title>
                        <Text c="dimmed" size="sm" ta="center" maw={400} mb="xl">
                            A foglalások megtekintéséhez és új foglalás leadásához kérjük,
                            jelentkezzen be vagy regisztráljon.
                        </Text>
                        <Group>
                            <Button
                                leftSection={<IconLogin size={18}/>}
                                size="md"
                                onClick={() => navigate('/login')}
                                style={{
                                    background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                    fontWeight: 600,
                                }}
                            >
                                Bejelentkezés
                            </Button>
                            <Button
                                leftSection={<IconUserPlus size={18}/>}
                                variant="default"
                                size="md"
                                onClick={() => navigate('/register')}
                            >
                                Regisztráció
                            </Button>
                        </Group>
                    </Center>
                </Paper>
            </Container>
        );
    }

    const RentItem = ({rent}: { rent: ISimpleRent }) => {
        const isPast = dayjs(rent.plannedEnd).isBefore(dayjs(), 'day');
        const isActive = !isPast && dayjs(rent.plannedStart).isBefore(dayjs(), 'day');

        const getStatusBadge = () => {
            if (isPast) {
                return <Badge color="gray" variant="light">Lezárult</Badge>;
            }
            if (isActive) {
                return <Badge color="green" variant="light">Aktív</Badge>;
            }
            return <Badge color="blue" variant="light">Jövőbeli</Badge>;
        };

        return (
            <Paper
                p="sm" radius="md" withBorder
                style={{
                    transition: 'all 0.2s ease',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                }}
            >
                <Group justify="space-between">
                    <Stack gap={0}>
                        <Text fw={500}>{rent.carModel}</Text>
                        <Text size="sm" c="dimmed">
                            {dayjs(rent.plannedStart).format('YYYY.MM.DD')} – {dayjs(rent.plannedEnd).format('YYYY.MM.DD')}
                        </Text>
                    </Stack>
                    {getStatusBadge()}
                </Group>
            </Paper>
        );
    };

    const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Felhasználó';

    const now = dayjs();
    const activeAndUpcomingRents = allRents.filter(rent => dayjs(rent.plannedEnd).isAfter(now, 'day'));
    const pastRents = allRents.filter(rent => dayjs(rent.plannedEnd).isBefore(now, 'day'));

    const EmptyRentList = ({icon, title, text}: { icon: React.ReactNode, title: string, text: string }) => (
        <Center py="lg" style={{flexDirection: 'column', opacity: 0.7}}>
            <ThemeIcon size={60} radius="xl" variant="light" color="gray" mb="md">
                {icon}
            </ThemeIcon>
            <Title order={5} fw={600} mb={4}>{title}</Title>
            <Text c="dimmed" size="sm" ta="center">{text}</Text>
        </Center>
    );

    return (
        <Container my="xl">
            <Title order={1} size="h2" fw={900} mb="xl" style={{
                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
            }}>
                Üdvözlünk, {fullName}!
            </Title>

            <Paper
                shadow="xl" p="xl" withBorder radius="md"
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                <Box style={{position: 'relative'}}>
                    <LoadingOverlay visible={loading} overlayProps={{radius: 'sm', blur: 2}}/>

                    <Group gap="sm" mb="xl">
                        <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                            <IconCar size={28}/>
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Aktív és Jövőbeli Foglalásaid</Title>
                            <Text size="sm" c="dimmed">Itt látod a közelgő utazásaidat</Text>
                        </Box>
                    </Group>
                    <Divider mb="xl" opacity={0.1}/>

                    {activeAndUpcomingRents.length > 0 ? (
                        <Stack>
                            {activeAndUpcomingRents.map(rent => <RentItem key={rent.id} rent={rent}/>)}
                        </Stack>
                    ) : (
                        <EmptyRentList
                            icon={<IconCarOff size={30} stroke={1.5}/>}
                            title="Nincsenek aktív foglalások"
                            text="Még nincsenek aktív vagy jövőbeli foglalásaid."
                        />
                    )}

                    <Divider my="xl" opacity={0.1}/>

                    <Group gap="sm" mb="xl">
                        <ThemeIcon size="xl" radius="md" variant="light" color="gray">
                            <IconHistory size={28}/>
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Korábbi Foglalásaid</Title>
                            <Text size="sm" c="dimmed">Lezárult bérléseid listája</Text>
                        </Box>
                    </Group>
                    <Divider mb="xl" opacity={0.1}/>


                    {pastRents.length > 0 ? (
                        <Stack>
                            {pastRents.map(rent => <RentItem key={rent.id} rent={rent}/>)}
                        </Stack>
                    ) : (
                        <EmptyRentList
                            icon={<IconListDetails size={30} stroke={1.5}/>}
                            title="Nincsenek korábbi foglalások"
                            text="Még nem zártál le egyetlen bérlést sem."
                        />
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default Dashboard;