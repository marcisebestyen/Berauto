import {useEffect, useState} from 'react';
import {
    Container,
    Title,
    Paper,
    Table,
    LoadingOverlay,
    Group,
    ActionIcon,
    Box,
    Center,
    Text,
    Alert,
    Badge,
    ScrollArea,
    Button,
    rem,
} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {
    IconRefresh,
    IconListCheck,
    IconAlertCircle,
} from '@tabler/icons-react';
import api from '../api/api';
import {IRentGetDto} from '../interfaces/IRent';
import dayjs from 'dayjs';
import 'dayjs/locale/hu';

dayjs.locale('hu');

export function CompletedRents() {
    const [rents, setRents] = useState<IRentGetDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.Staff.completedRents();
            setRents(response.data);
        } catch (error) {
            const errorMsg = 'A lezárt kölcsönzések betöltése sikertelen';
            notifications.show({
                title: 'Hiba',
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle/>,
            });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRents();
    }, []);

    const rows = rents.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>
                <Text fw={500}>{rent.carBrand} {rent.carModel}</Text>
            </Table.Td>
            <Table.Td>
                <Text fw={500}>{rent.renterName}</Text>
                <Text size="xs" c="dimmed">ID: {rent.renterId}</Text>
            </Table.Td>
            <Table.Td>
                {rent.actualStart ? (
                    <>
                        <Text size="sm">{dayjs(rent.actualStart).format('YYYY.MM.DD')}</Text>
                        <Text size="xs" c="dimmed">{dayjs(rent.actualStart).format('HH:mm')}</Text>
                    </>
                ) : <Badge color="gray" variant="light">-</Badge>}
            </Table.Td>
            <Table.Td>
                {rent.actualEnd ? (
                    <>
                        <Text size="sm">{dayjs(rent.actualEnd).format('YYYY.MM.DD')}</Text>
                        <Text size="xs" c="dimmed">{dayjs(rent.actualEnd).format('HH:mm')}</Text>
                    </>
                ) : <Badge color="gray" variant="light">-</Badge>}
            </Table.Td>
            <Table.Td>
                <Badge color="blue" variant="light" size="md">
                    {rent.endingKilometer} km
                </Badge>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconListCheck size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek lezárt kölcsönzések</Title>
            <Text c="dimmed" size="sm" mt={4}>Még egyetlen kölcsönzés sem zárult le a rendszerben.</Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%" maw={600}>
                {error}
                <Button color="red" variant="light" onClick={loadRents} mt="md">
                    Próbálja újra
                </Button>
            </Alert>
        </Center>
    );

    const showEmptyState = !loading && !error && rents.length === 0;
    const showErrorState = !loading && error;
    const showTable = !loading && !error && rents.length > 0;

    return (
        <Container size="xl" py="md">
            <Paper shadow="sm" p="md" withBorder>
                <Group justify="space-between" mb="lg">
                    <Title order={3}>Lezárt Kölcsönzések</Title>
                    <ActionIcon variant="light" onClick={loadRents} loading={loading} aria-label="Adatok frissítése">
                        <IconRefresh style={{width: rem(18)}}/>
                    </ActionIcon>
                </Group>

                <Box style={{position: 'relative', minHeight: '300px'}}>
                    <LoadingOverlay visible={loading} overlayProps={{radius: 'sm', blur: 2}}/>

                    {showErrorState && errorState}
                    {showEmptyState && emptyState}

                    {showTable && (
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder miw={800}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Jármű</Table.Th>
                                        <Table.Th>Bérlő</Table.Th>
                                        <Table.Th>Tényleges kezdés</Table.Th>
                                        <Table.Th>Tényleges befejezés</Table.Th>
                                        <Table.Th>Záró km óra</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}