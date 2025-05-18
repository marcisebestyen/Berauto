import {
    Text,
    Title,
    Button,
    Center,
    Stack
} from '@mantine/core';
import { IconLogin } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom'; // <-- IMPORTÁLD A useNavigate HOOKOT
import useAuth from '../hooks/useAuth';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate(); // <-- INICIALIZÁLD A useNavigate HOOKOT

    if (!user) {
        // Funkció a bejelentkezési oldalra navigáláshoz
        const handleLoginRedirect = () => {
            navigate('/login'); // <-- ITT TÖRTÉNIK A NAVIGÁCIÓ
        };

        return (
            <Center style={{ minHeight: '80vh' }}>
                <Stack align="center">
                    <Title order={2}>Üdvözlünk a Bérautó rendszernél!</Title>
                    <Text c="dimmed">A foglalások eléréséhez kérlek jelentkezz be.</Text>
                    <Button
                        leftSection={<IconLogin size={18} />}
                        variant="outline"
                        size="md"
                        onClick={handleLoginRedirect} // <-- onClick ESEMÉNY HOZZÁADVA
                    >
                        Bejelentkezés
                    </Button>
                </Stack>
            </Center>
        );
    }

    return (
        <>
            {/* Feltételezve, hogy a user objektumodon van 'username' vagy hasonló property */}
            {/* Ha pl. user.email-t szeretnél kiírni: user.email */}
            <Title order={2} mb="md">Üdvözlünk, {user.email || user.username || 'Felhasználó'}!</Title>
            {/* Ide jöhet a bejelentkezett felhasználóknak szóló dashboard tartalom */}
        </>
    );
};

export default Dashboard;