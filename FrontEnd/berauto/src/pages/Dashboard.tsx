import {
    Text,
    Title,
    Button,
    Center,
    Stack
} from '@mantine/core';
import {IconLogin } from '@tabler/icons-react';
import useAuth from '../hooks/useAuth';


const Dashboard = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <Center style={{ minHeight: '80vh' }}>
                <Stack align="center">
                    <Title order={2}>Üdvözlünk a Bérautó rendszernél!</Title>
                    <Text c="dimmed">A foglalások eléréséhez kérlek jelentkezz be.</Text>
                    <Button
                        leftSection={<IconLogin size={18} />}
                        variant="outline"
                        size="md"
                    >
                        Bejelentkezés
                    </Button>
                </Stack>
            </Center>
        );
    }



    return (
        <>
            <Title order={2} mb="md">Üdvözlünk, {user.username}!</Title>

        </>
    );
};

export default Dashboard;
