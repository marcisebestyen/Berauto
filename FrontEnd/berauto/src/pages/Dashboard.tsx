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
} from '@mantine/core';
import {IconLogin, IconUserPlus, IconKey, IconCar, IconHistory} from '@tabler/icons-react';
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
            <Container size="xs" py={50}>
                <Paper withBorder shadow="sm" p="xl" radius="md" ta="center">
                    <IconKey size={50} stroke={1.5} style={{opacity: 0.6, marginBottom: 'var(--mantine-spacing-md)'}}/>
                    <Title order={2}>Üdvözlünk, Vendég!</Title>
                    <Text c="dimmed" mt="sm" mb="xl">A foglalások megtekintéséhez és új foglalás leadásához kérjük,
                        jelentkezzen be vagy regisztráljon.</Text>
                    <Stack>
                        <Button
                            leftSection={<IconLogin size={18}/>}
                            size="md"
                            onClick={() => navigate('/login')}
                        >
                            Bejelentkezés
                        </Button>
                        <Button
                            leftSection={<IconUserPlus size={18}/>}
                            variant="light"
                            size="md"
                            onClick={() => navigate('/register')}
                        >
                            Regisztráció
                        </Button>
                    </Stack>
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
            <Paper withBorder p="sm" radius="md">
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

    return (
        <Container>
            <Title order={2} mb="xl">Üdvözlünk, {fullName}!</Title>

            <Paper shadow="sm" p="lg" withBorder radius="md">
                <Box style={{position: 'relative'}}>
                    <LoadingOverlay visible={loading} overlayProps={{radius: 'sm', blur: 2}}/>

                    <Group gap="xs" mb="sm">
                        <IconCar size={20}/>
                        <Title order={4}>Aktív és Jövőbeli Foglalásaid</Title>
                    </Group>

                    {activeAndUpcomingRents.length > 0 ? (
                        <Stack>
                            {activeAndUpcomingRents.map(rent => <RentItem key={rent.id} rent={rent}/>)}
                        </Stack>
                    ) : (
                        <Text c="dimmed" py="md">Nincsenek aktív vagy jövőbeli foglalásaid.</Text>
                    )}

                    <Divider my="xl"/>

                    <Group gap="xs" mb="sm">
                        <IconHistory size={20}/>
                        <Title order={4}>Korábbi Foglalásaid</Title>
                    </Group>

                    {pastRents.length > 0 ? (
                        <Stack>
                            {pastRents.map(rent => <RentItem key={rent.id} rent={rent}/>)}
                        </Stack>
                    ) : (
                        <Text c="dimmed" py="md">Nincsenek korábbi foglalásaid.</Text>
                    )}
                </Box>
            </Paper>
        </Container>
    );
};

export default Dashboard;