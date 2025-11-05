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
    ThemeIcon,
    Divider,
} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {
    IconCheck,
    IconCar,
    IconAlertCircle,
    IconRefresh,
    IconClockHour4,
    IconUser,
    IconCalendarEvent,
    IconClockPlay,
} from '@tabler/icons-react';
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

    const inputStyles = {
        input: {
            background: 'rgba(15, 23, 42, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
        }
    };

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
        // Alapértelmezett dátum a 'most', vagy ha az korábbi, mint a start, akkor a start
        const startDate = new Date(rent.actualStart!);
        const now = new Date();
        setActualEndDate(now < startDate ? startDate : now);
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

        // --- JAVÍTÁS: Dátumellenőrzés ---
        const actualStartDate = new Date(selectedRent.actualStart!);
        if (actualEndDate < actualStartDate) {
            notifications.show({
                title: 'Érvénytelen dátum',
                message: `A visszavétel dátuma (${dayjs(actualEndDate).format('YYYY.MM.DD HH:mm')}) nem lehet korábbi, mint a kiadás dátuma (${dayjs(actualStartDate).format('YYYY.MM.DD HH:mm')}).`,
                color: 'red',
            });
            return;
        }
        // --- JAVÍTÁS VÉGE ---

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
        } catch (error: any) {
            notifications.show({
                title: 'Hiba',
                message: error.response?.data?.message || 'Az autó visszavétele sikertelen',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const rows = rents.map((rent) => (
        <Table.Tr
            key={rent.id}
            style={{
                transition: 'all 0.2s ease',
                background: 'rgba(15, 23, 42, 0.4)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
            }}
        >
            <Table.Td>
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                        <IconCar size={20}/>
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{rent.carBrand}</Text>
                        <Text size="xs" c="dimmed">{rent.carModel}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="gray">
                        <IconUser size={20}/>
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{rent.renterName}</Text>
                        <Text size="xs" c="dimmed">ID: {rent.renterId}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                <Badge
                    color="cyan"
                    variant="light"
                    size="lg"
                    tt="none"
                    leftSection={<IconCalendarEvent size={14}/>}
                >
                    {dayjs(rent.actualStart).format('YYYY.MM.DD HH:mm')}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge
                    color="green"
                    variant="filled"
                    size="md"
                    tt="uppercase"
                    leftSection={<IconClockPlay size={14}/>}
                >
                    Folyamatban
                </Badge>
            </Table.Td>
            <Table.Td>
                <Button
                    onClick={() => handleOpenModal(rent)}
                    size="sm"
                    leftSection={<IconCar size={16}/>}
                    style={{
                        background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                        fontWeight: 600,
                    }}
                >
                    Visszavétel
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center py={60} style={{flexDirection: 'column'}}>
            <ThemeIcon size={80} radius="xl" variant="light" color="cyan" mb="md"
                       style={{
                           background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                       }}
            >
                <IconClockHour4 size={40} stroke={1.5}/>
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek futó kölcsönzések</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Jelenleg egyetlen autó sincs kiadva bérlőnek.
            </Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%" maw={600}
                   variant="light">
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
        <Container size="xl" my="xl">
            <Box mb="xl">
                <Title order={1} size="h2" fw={900} style={{
                    background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem',
                }}>
                    Adminisztráció
                </Title>
                <Text c="dimmed" size="sm">Jelenleg futó kölcsönzések kezelése</Text>
            </Box>

            <Paper
                shadow="xl" p="xl" withBorder
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
            >
                <Box style={{position: 'relative', minHeight: '300px'}}>
                    <LoadingOverlay visible={loading} overlayProps={{radius: 'sm', blur: 2}}/>

                    <Group justify="space-between" mb="lg">
                        <Group gap="sm">
                            <ThemeIcon size="xl" radius="md" variant="light" color="green">
                                <IconClockPlay size={28}/>
                            </ThemeIcon>
                            <Box>
                                <Title order={3} size="h4">Futó Kölcsönzések</Title>
                                <Text size="sm" c="dimmed">
                                    {loading ? 'Adatok töltése...' : `${rents.length} futó bérlés`}
                                </Text>
                            </Box>
                        </Group>
                        <ActionIcon
                            variant="default"
                            onClick={loadRents}
                            loading={loading}
                            aria-label="Adatok frissítése"
                            size="lg"
                        >
                            <IconRefresh style={{width: rem(18)}}/>
                        </ActionIcon>
                    </Group>

                    <Divider mb="xl" opacity={0.1}/>

                    {showErrorState && errorState}
                    {showEmptyState && emptyState}

                    {showTable && (
                        <ScrollArea>
                            <Table striped={false} highlightOnHover={false} miw={1000} style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}>
                                <Table.Thead style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                }}>
                                    <Table.Tr>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Jármű</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Bérlő</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Tényleges
                                            Kezdés</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Státusz</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Művelet</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}
                </Box>
            </Paper>

            <Modal
                opened={modalOpened}
                onClose={closeModal}
                title={
                    <Group gap="sm">
                        <IconCar size={20}/>
                        <Text fw={700} size="lg">Autó visszavétele: {selectedRent?.carModel}</Text>
                    </Group>
                }
                centered
                styles={{
                    content: {
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                    },
                    header: {
                        background: 'transparent',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                    title: {
                        color: '#FFF',
                    },
                    body: {
                        paddingBottom: 'var(--mantine-spacing-xl)',
                    }
                }}
            >
                {selectedRent && (
                    <Stack>
                        <DateTimePicker
                            label="Tényleges befejezés időpontja"
                            placeholder="Válassz időpontot"
                            value={actualEndDate}
                            onChange={setActualEndDate}
                            minDate={new Date(selectedRent.actualStart!)}
                            // maxDate={new Date()} // <-- JAVÍTÁS: Eltávolítva a tesztelés engedélyezéséhez
                            required
                            styles={inputStyles}
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
                            styles={inputStyles}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeModal}>Mégsem</Button>
                            <Button
                                onClick={handleTakeBack}
                                loading={loading}
                                leftSection={<IconCheck size={16}/>}
                                style={{
                                    background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                    fontWeight: 600,
                                }}
                            >
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