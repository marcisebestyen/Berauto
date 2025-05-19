import { useEffect, useState } from 'react';
import { Container, Title, Paper, Table, LoadingOverlay } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import api from '../api/api';
import { IRentGetDto } from '../interfaces/IRent';

export function CompletedRents() {
    const [rents, setRents] = useState<IRentGetDto[]>([]);
    const [loading, setLoading] = useState(true);

    const loadRents = async () => {
        try {
            setLoading(true);
            const response = await api.Staff.completedRents();
            setRents(response.data);
        } catch (error) {
            notifications.show({
                title: 'Hiba',
                message: 'A lezárt kölcsönzések betöltése sikertelen',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRents();
    }, []);

    const rows = rents.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>{rent.carModel}</Table.Td>
            <Table.Td>{rent.renterId}</Table.Td>
            <Table.Td>{new Date(rent.plannedStart).toLocaleDateString('hu-HU')}</Table.Td>
            <Table.Td>{new Date(rent.plannedEnd).toLocaleDateString('hu-HU')}</Table.Td>
            <Table.Td>{rent.actualStart ? new Date(rent.actualStart).toLocaleDateString('hu-HU') : '-'}</Table.Td>
            <Table.Td>{rent.actualEnd ? new Date(rent.actualEnd).toLocaleDateString('hu-HU') : '-'}</Table.Td>
            <Table.Td>{rent.endingKilometer} km</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl">
            <LoadingOverlay visible={loading} />
            <Title order={2} mb="md">Lezárt Kölcsönzések</Title>

            <Paper p="md" withBorder>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Autó</Table.Th>
                            <Table.Th>Bérlő</Table.Th>
                            <Table.Th>Tervezett kezdés</Table.Th>
                            <Table.Th>Tervezett befejezés</Table.Th>
                            <Table.Th>Tényleges kezdés</Table.Th>
                            <Table.Th>Tényleges befejezés</Table.Th>
                            <Table.Th>Záró km óra</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
        </Container>
    );
}