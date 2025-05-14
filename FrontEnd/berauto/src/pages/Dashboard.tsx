import {Text, Title, Group, Paper, ThemeIcon, SimpleGrid } from '@mantine/core';
import {IconCheck, IconClock} from '@tabler/icons-react';
import useAuth from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import api from '../api/api.ts';

const Dashboard = () => {
    const [rentCount, setRentCount] = useState<number>(0);
    const [activeRentCount, setActiveRentCount] = useState<number>(0);
    const { user } = useAuth();

    useEffect(() => {
        const fetchRentCount = async () => {
            try {
                const response = await api.Users.getUserRents(user?.id);
                setRentCount(response.data);

                const response2 = await api.Users.getActiveRents(user?.id);
                setActiveRentCount(response2.data);
            } catch (error) {
                console.error('Hiba a foglalások számának lekérésekor:', error);
            }
        };

        if (user?.id) {
            fetchRentCount();
        }
    }, [user?.id]);

    const stats = [
        {
            title: 'Aktív foglalásaid',
            value: activeRentCount.toString() ,
            icon: IconClock,
            color: 'blue'
        },
        {
            title: 'Összes foglalásod',
            value: rentCount.toString(),
            icon: IconCheck,
            color: 'green'
        }
    ];

    return (
        <>
            <Title order={2} mb="md">Üdvözlünk, {user?.username}!</Title>

            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {stats.map((stat) => (
                    <Paper withBorder radius="md" p="md" key={stat.title}>
                        <Group justify="space-between">
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">
                                {stat.title}
                            </Text>
                            <ThemeIcon color={stat.color} variant="light" size={38} radius="md">
                                <stat.icon style={{ width: '1.5rem', height: '1.5rem' }} />
                            </ThemeIcon>
                        </Group>
                        <Text fw={700} size="xl" mt="sm">
                            {stat.value}
                        </Text>
                    </Paper>
                ))}
            </SimpleGrid>
        </>
    );
};

export default Dashboard;