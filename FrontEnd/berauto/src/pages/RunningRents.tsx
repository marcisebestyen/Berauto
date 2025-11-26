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
    Select,
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
import {IDepot} from '../interfaces/IDepot';
import {DateTimePicker} from '@mantine/dates';
import {useDisclosure} from '@mantine/hooks';
import dayjs from 'dayjs';

function RunningRents() {
    const [rents, setRents] = useState<IRentGetDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);
    // Mantine DateTimePicker onChange here provides string (ISO) — tároljuk stringként és konvertáljuk Date-re ahol szükséges
    const [actualEndDate, setActualEndDate] = useState<string | null>(new Date().toISOString());
    const [endingKilometer, setEndingKilometer] = useState<string | number>('');
    const [modalOpened, {open: openModal, close: closeModal}] = useDisclosure(false);

    // Leadási telephely kiválasztása
    const [depots, setDepots] = useState<IDepot[]>([]);
    const [selectedDropOffDepotId, setSelectedDropOffDepotId] = useState<string | null>(null);

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

    useEffect(() => {
        const loadDepots = async () => {
            try {
                const res = await api.Depots.getAll();
                setDepots(res.data || []);
            } catch (e) {
                // opcionális hiba kezelés
            }
        };
        loadDepots();
    }, []);

    const handleOpenModal = (rent: IRentGetDto) => {
        setSelectedRent(rent);
        // Alapértelmezett dátum a 'most', vagy ha az korábbi, mint a start, akkor a start
        const startDate = new Date(rent.actualStart!);
        const now = new Date();
        // A DateTimePicker onChange stringet ad vissza, így itt ISO stringet tárolunk
        setActualEndDate((now < startDate ? startDate : now).toISOString());
        setEndingKilometer(rent.startingKilometer ?? '');
        setSelectedDropOffDepotId(null); // Reset leadási telephely
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

        // actualEndDate most string | null, konvertáljuk Date-re az összehasonlításhoz
        const parsedActualEnd = actualEndDate ? new Date(actualEndDate) : null;
        if (!parsedActualEnd) {
            notifications.show({
                title: 'Figyelmeztetés',
                message: 'Kérjük, válasszon érvényes visszavételi időpontot!',
                color: 'yellow',
            });
            return;
        }

        if (parsedActualEnd < actualStartDate) {
            notifications.show({
                title: 'Érvénytelen dátum',
                message: `A visszavétel dátuma (${dayjs(parsedActualEnd).format('YYYY.MM.DD HH:mm')}) nem lehet korábbi, mint a kiadás dátuma (${dayjs(actualStartDate).format('YYYY.MM.DD HH:mm')}).`,
                color: 'red',
            });
            return;
        }
        // --- JAVÍTÁS VÉGE ---

        if (!selectedDropOffDepotId || selectedDropOffDepotId === '') {
            notifications.show({
                title: 'Hiányzó telephely',
                message: 'Kérjük, válassza ki a leadási telephelyet!',
                color: 'orange',
            });
            return;
        }

        // A parsedActualEnd már Date objektum; az API belül actualEnd.toISOString() hívással
        // megfelelő UTC ISO formátumot állít elő, ezért a manuális timezone-korrekció felesleges,
        // és pontatlan eredményt adhat. Használjuk közvetlenül a parsedActualEnd-et.
        const utcDate = parsedActualEnd;
        const dropOffDepotId = parseInt(selectedDropOffDepotId, 10);

        if (isNaN(dropOffDepotId) || dropOffDepotId <= 0) {
            notifications.show({
                title: 'Érvénytelen telephely',
                message: 'Kérjük, válasszon ki egy érvényes telephelyet!',
                color: 'red',
            });
            return;
        }

        try {
            setLoading(true);
            await api.Staff.takeBackCar(selectedRent.id, utcDate, Number(endingKilometer), dropOffDepotId);
            notifications.show({
                title: 'Sikeres visszavétel',
                message: `A(z) ${selectedRent.carModel} sikeresen visszavéve.`,
                color: 'green',
                icon: <IconCheck/>
            });
            setSelectedDropOffDepotId(null); // Reset
            closeModal();
            loadRents();
        } catch (error: any) {
            const serverMsg = error?.response?.data?.message;
            // Ha a backend kifejezetten telephely hibára utal (pl. "Depot with id 0 not found"), mutassunk barátságosabb üzenetet és javaslatot
            if (typeof serverMsg === 'string' && /depot.*not found|telephely.*nem található|depot with id/i.test(serverMsg)) {
                notifications.show({
                    title: 'Telephely hiba',
                    message: 'A kiválasztott telephely nem található a szerveren. Kérjük, frissítse a telephelyek listáját (frissítés gomb), majd próbálja újra a visszavételt.',
                    color: 'red',
                });
            } else {
                notifications.show({
                    title: 'Hiba',
                    message: serverMsg || 'Az autó visszavétele sikertelen',
                    color: 'red',
                });
            }
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
                            // A komponens onChange-je stringet ad vissza (ISO), ezért string | null-t várunk
                            onChange={(value: string | null) => setActualEndDate(value)}
                            minDate={new Date(selectedRent.actualStart!)}
                            // maxDate={new Date()} // <-- JAVÍTÁS: Eltávolítva a tesztelés engedélyezéséhez
                            required
                            styles={inputStyles}
                        />
                        <Select
                            label="Leadási telephely"
                            placeholder="Válassz telephelyet"
                            data={depots
                                .filter(d => typeof d.id === 'number' && d.id > 0)
                                .map(d => ({ value: d.id.toString(), label: `${d.name} - ${d.city}` }))}
                            value={selectedDropOffDepotId}
                            onChange={(v: string | null) => setSelectedDropOffDepotId(v)}
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
                                disabled={loading || !selectedDropOffDepotId}
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