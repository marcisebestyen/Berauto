import {useEffect, useState} from 'react';
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
    Modal,
    NumberInput,
    ActionIcon,
    Box,
    Center,
    Alert,
    ScrollArea,
    Badge,
    rem,
} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {IconCheck, IconCar, IconAlertCircle, IconRefresh, IconClockHour4} from '@tabler/icons-react';
import api from '../api/api';
import {IRentGetDto} from '../interfaces/IRent';
import {DateTimePicker} from '@mantine/dates';
import {useDisclosure} from '@mantine/hooks';
import dayjs from 'dayjs';

function RunningRents() {
    const [rents, setRents] = useState<IRentGetDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);
    const [actualEndDate, setActualEndDate] = useState<Date | null>(new Date());
    const [endingKilometer, setEndingKilometer] = useState<string | number>('');
    const [modalOpened, {open: openModal, close: closeModal}] = useDisclosure(false);

    const loadRents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.Rents.getRentsGloballyByFilter("Running");
            setRents(response.data);
        } catch (error) {
            const errorMsg = 'A futó kölcsönzések betöltése sikertelen';
            setError(errorMsg);
            notifications.show({title: 'Hiba', message: errorMsg, color: 'red'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRents();
    }, []);

    const handleOpenModal = (rent: IRentGetDto) => {
        setSelectedRent(rent);
        setActualEndDate(new Date());
        setEndingKilometer(rent.startingKilometer ?? '');
        openModal();
    };

    const handleTakeBack = async () => {
        if (!selectedRent || !actualEndDate || endingKilometer === '' || Number(endingKilometer) < (selectedRent.startingKilometer ?? 0)) {
            notifications.show({
                title: 'Figyelmeztetés',
                message: 'Kérjük, adjon meg érvényes visszavételi időpontot és a kezdőnél nem alacsonyabb kilométeróra-állást!',
                color: 'yellow',
            });
            return;
        }

        const utcDate = new Date(actualEndDate.getTime() - actualEndDate.getTimezoneOffset() * 60000);

        try {
            setLoading(true);
            await api.Staff.takeBackCar(selectedRent.id, utcDate, Number(endingKilometer));
            notifications.show({
                title: 'Sikeres visszavétel',
                message: `A(z) ${selectedRent.carModel} sikeresen visszavéve.`,
                color: 'green',
                icon: <IconCheck/>
            });
            closeModal();
            loadRents();
        } catch (error) {
            notifications.show({
                title: 'Hiba',
                message: 'Az autó visszavétele sikertelen',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

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
                <Text size="sm">{dayjs(rent.actualStart).format('YYYY.MM.DD')}</Text>
                <Text size="xs" c="dimmed">{dayjs(rent.actualStart).format('HH:mm')}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color="green" variant="light">Folyamatban</Badge>
            </Table.Td>
            <Table.Td>
                <Button onClick={() => handleOpenModal(rent)} variant="light" color="blue" size="xs"
                        leftSection={<IconCar size={14}/>}>
                    Visszavétel
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconClockHour4 size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek futó kölcsönzések</Title>
            <Text c="dimmed" size="sm" mt={4}>Jelenleg egyetlen autó sincs kiadva bérlőnek.</Text>
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
            <Paper shadow="sm" p="lg" withBorder>
                <Group justify="space-between" mb="lg">
                    <Title order={3}>Futó Kölcsönzések</Title>
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
                                        <Table.Th>Tényleges Kezdés</Table.Th>
                                        <Table.Th>Státusz</Table.Th>
                                        <Table.Th>Művelet</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}
                </Box>
            </Paper>

            <Modal opened={modalOpened} onClose={closeModal} title={`Autó visszavétele: ${selectedRent?.carModel}`}
                   centered>
                {selectedRent && (
                    <Stack>
                        <DateTimePicker
                            label="Tényleges befejezés időpontja"
                            placeholder="Válassz időpontot"
                            value={actualEndDate}
                            onChange={setActualEndDate}
                            minDate={new Date(selectedRent.actualStart!)}
                            maxDate={new Date()}
                            required
                        />
                        <NumberInput
                            label="Záró kilométeróra állás"
                            placeholder="Adja meg az óraállást"
                            value={endingKilometer}
                            onChange={setEndingKilometer}
                            min={selectedRent.startingKilometer ?? 0}
                            required
                            suffix=" km"
                            thousandSeparator=" "
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeModal}>Mégsem</Button>
                            <Button onClick={handleTakeBack} loading={loading} leftSection={<IconCheck size={16}/>}>
                                Visszavétel véglegesítése
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Container>
    );
}

export default RunningRents;