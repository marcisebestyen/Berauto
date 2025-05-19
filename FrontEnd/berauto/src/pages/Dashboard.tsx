import { Text, Title, Button, Center, Stack } from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

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
                </Stack>
            </Center>
        );
    }

    const fullName = user.lastName && user.firstName
        ? `${user.firstName} ${user.lastName}`
        : 'Vendég';

    return (
        <>
            <Title order={2} mb="md">Üdvözlünk, {fullName}!</Title>
            {/* dashboard tartalom */}
        </>
    );
};

export default Dashboard;
