import { useEffect, useState } from 'react';
import {
    Text,
    Title,
    Button,
    Center,
    Stack,
    Card,
    Group,
    Badge,
} from '@mantine/core';
import { IconLogin, IconUserPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../api/api';
import { ISimpleRent } from '../interfaces/IRent';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeRents, setActiveRents] = useState<ISimpleRent[]>([]);
    const [allRents, setAllRents] = useState<ISimpleRent[]>([]);

    useEffect(() => {
        const fetchRents = async () => {
            if (user?.id) {
                try {
                    const [activeRes, allRes] = await Promise.all([
                        api.Users.getActiveRents(user.id),
                        api.Users.getUserRents(user.id),
                    ]);

                    console.log("Aktív foglalások API válasz:", activeRes.data);
                    console.log("Összes foglalás API válasz:", allRes.data);

                    if (Array.isArray(activeRes.data)) {
                        setActiveRents(activeRes.data);
                    }
                    if (Array.isArray(allRes.data)) {
                        setAllRents(allRes.data);
                    }
                } catch (error) {
                    console.error("Hiba a foglalások lekérésekor:", error);
                }
            }
        };

        fetchRents();
    }, [user]);

    if (!user) {
        return (
            <Center style={{ minHeight: '80vh' }}>
                <Stack align="center">
                    <Title order={2}>Üdvözlünk, Vendég!</Title>
                    <Text c="dimmed">A foglalások eléréséhez kérlek jelentkezz be.</Text>
                    <Button
                        leftSection={<IconLogin size={18} />}
                        variant="outline"
                        size="md"
                        onClick={() => navigate('/login')}
                    >
                        Bejelentkezés
                    </Button>
                    <Button
                        leftSection={<IconUserPlus size={18} />}
                        variant="outline"
                        size="md"
                        onClick={() => navigate('/register')}
                    >
                        Regisztráció
                    </Button>
                </Stack>
            </Center>
        );
    }

    const fullName = user.lastName && user.firstName
        ? `${user.firstName} ${user.lastName}`
        : 'Felhasználó';

    return (
        <>
            <Title order={2} mb="md">Üdvözlünk, {fullName}!</Title>

            {activeRents.length > 0 && (
                <Card shadow="sm" padding="md" mb="lg" withBorder>
                    <Title order={4} mb="sm">Aktív foglalásaid</Title>
                    <Stack>
                        {activeRents.map(rent => (
                            <Group key={rent.id} justify="space-between">
                                <Text>{rent.carModel} ({new Date(rent.plannedStart).toLocaleDateString('hu-HU')} – {new Date(rent.plannedEnd).toLocaleDateString('hu-HU')})</Text>
                                <Badge color="orange">Aktív</Badge>
                            </Group>
                        ))}
                    </Stack>
                </Card>
            )}

            <Card shadow="sm" padding="md" withBorder>
                <Title order={4} mb="sm">Összes foglalásod</Title>
                <Stack>
                    {allRents.map(rent => (
                        <Group key={rent.id} justify="space-between">
                            <Text>{rent.carModel} ({new Date(rent.plannedStart).toLocaleDateString('hu-HU')} – {new Date(rent.plannedEnd).toLocaleDateString('hu-HU')})</Text>
                        </Group>
                    ))}
                </Stack>
            </Card>
        </>
    );
};

export default Dashboard;
