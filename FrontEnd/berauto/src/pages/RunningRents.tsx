import { useEffect, useState } from 'react';
import {
    Container,
    Title,
    Paper,
    Table,
    Text,
    Group,
    Button,
    LoadingOverlay,
    Stack,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCalendarTime, IconCheck } from '@tabler/icons-react';
import api from '../api/api';
import { IRentGetDto } from '../interfaces/IRent';
import { DateTimePicker } from '@mantine/dates';

export function RunningRents() {
    const [rents, setRents] = useState<IRentGetDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);
    const [actualEndDate, setActualEndDate] = useState<Date | null>(null);
    const [endingKilometer, setEndingKilometer] = useState<number | null>(null);

    const loadRents = async () => {
        try {
            setLoading(true);
            const response = await api.Rents.getRentsGloballyByFilter("Running");
            setRents(response.data);
        } catch (error) {
            notifications.show({
                title: 'Hiba',
                message: 'A futó kölcsönzések betöltése sikertelen',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRents();
    }, []);

    const handleTakeBack = async (rentId: number) => {
        if (!actualEndDate || endingKilometer === null || endingKilometer < 0) {
            notifications.show({
                title: 'Figyelmeztetés',
                message: 'Kérjük töltsd ki az összes mezőt helyesen!',
                color: 'yellow',
            });
            return;
        }

        const utcDate = new Date(actualEndDate.getTime() - actualEndDate.getTimezoneOffset() * 60000);

        try {
            await api.Staff.takeBackCar(rentId, utcDate, endingKilometer);
            notifications.show({
                title: 'Sikeres visszavétel',
                message: 'Az autó sikeresen visszavételre került',
                color: 'green',
            });
            setSelectedRent(null);
            setActualEndDate(null);
            setEndingKilometer(null);
            loadRents();
        } catch (error) {
            notifications.show({
                title: 'Hiba',
                message: 'Az autó visszavétele sikertelen',
                color: 'red',
            });
        }
    };


    const rows = rents.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>{rent.carModel}</Table.Td>
            <Table.Td>{rent.renterId}</Table.Td>
            <Table.Td>{rent.actualStart ? new Date(rent.actualStart).toLocaleString('hu-HU') : '-'}</Table.Td>
            <Table.Td>{rent.plannedEnd ? new Date(rent.plannedEnd).toLocaleString('hu-HU') : '-'}</Table.Td>
            <Table.Td>
                <Button
                    onClick={() => setSelectedRent(rent)}
                    variant="light"
                    color="blue"
                >
                    Visszavétel
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl">
            <LoadingOverlay visible={loading} />
            <Title order={2} mb="md">Futó Kölcsönzések</Title>

            <Paper p="md" withBorder>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Autó</Table.Th>
                            <Table.Th>Bérlő</Table.Th>
                            <Table.Th>Kezdés</Table.Th>
                            <Table.Th>Tervezett befejezés</Table.Th>
                            <Table.Th>Műveletek</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>

            {selectedRent && (
                <Paper p="md" mt="md" withBorder>
                    <Title order={3} mb="md">Autó visszavétele</Title>
                    <Stack>
                        <DateTimePicker
                            label="Tényleges befejezés időpontja"
                            placeholder="Válassz időpontot"
                            value={actualEndDate}

                            onChange={(value: string) => {
                                const parsed = new Date(value);
                                setActualEndDate(parsed);
                            }}

                            leftSection={<IconCalendarTime size="1.2rem" />}
                            clearable
                        />

                        <Text size="sm">Záró kilométeróra állás</Text>
                        <input
                            type="number"
                            value={endingKilometer ?? ''}
                            onChange={(e) => setEndingKilometer(Number(e.target.value))}
                            min={0}
                        />
                        <Group justify="flex-end">
                            <Button
                                onClick={() => handleTakeBack(selectedRent.id)}
                                leftSection={<IconCheck size="1.2rem" />}
                            >
                                Visszavétel véglegesítése
                            </Button>
                        </Group>
                    </Stack>
                </Paper>
            )}
        </Container>
    );
}

export default RunningRents;
