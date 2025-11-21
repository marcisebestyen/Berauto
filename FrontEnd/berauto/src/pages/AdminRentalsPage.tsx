import { useEffect, useState} from 'react';
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
    Textarea,
    Tabs, // Az összevonáshoz
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import {
    IconCheck,
    IconCar,
    IconAlertCircle,
    IconRefresh,
    IconClockHour4,
    IconUser,
    IconCalendarEvent,
    IconClockPlay,
    IconX,
    IconMailbox,
    IconClipboardCheck,
    IconUsers,
    IconListCheck,
    IconCarOff,
    IconDashboard,
} from '@tabler/icons-react';
import api from '../api/api';
import { IRentGetDto } from '../interfaces/IRent';
import { DateTimePicker } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import dayjs from 'dayjs';
import useAuth from '../hooks/useAuth';
import 'dayjs/locale/hu'; // Importáljuk a 'CompletedRents'-ből

// ========================================================================
// 1. KOMPONENS: A PendingRentPage.tsx kódja bemásolva és átalakítva
// ========================================================================

const PendingRentsTab = () => {
    const [pendingRents, setPendingRents] = useState<IRentGetDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const [approveModalOpened, { open: openApproveModal, close: closeApproveModal }] = useDisclosure(false);
    const [rejectModalOpened, { open: openRejectModal, close: closeRejectModal }] = useDisclosure(false);
    const { user } = useAuth();

    const fetchPendingRents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Rents.getRentsGloballyByFilter("Open");
            setPendingRents(response.data || []);
        } catch (err: any) {
            const errorMsg = "Nem sikerült betölteni a jóváhagyásra váró igényeket.";
            setError(errorMsg);
            notifications.show({ title: 'Lekérdezési Hiba', message: errorMsg, color: 'red' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRents();
    }, []);

    const handleApproveClick = (rent: IRentGetDto) => {
        setSelectedRent(rent);
        openApproveModal();
    };

    const handleRejectClick = (rent: IRentGetDto) => {
        setSelectedRent(rent);
        setRejectionReason('');
        openRejectModal();
    };

    const confirmApprove = async () => {
        if (!selectedRent?.id || !user?.id) {
            notifications.show({
                title: 'Hiba',
                message: 'Érvénytelen kérés. A bérlés vagy a felhasználó nem azonosítható.',
                color: 'red'
            });
            return;
        }
        setIsLoading(true);
        try {
            await api.Staff.approveRent(selectedRent.id);
            notifications.show({
                title: 'Siker!',
                message: `A(z) #${selectedRent.id} bérlés jóváhagyva.`,
                color: 'green',
                icon: <IconCheck />
            });
            fetchPendingRents();
        } catch (err: any) {
            notifications.show({
                title: 'Jóváhagyási Hiba',
                message: err.response?.data?.message || 'A jóváhagyás nem sikerült.',
                color: 'red'
            });
        } finally {
            setIsLoading(false);
            closeApproveModal();
        }
    };

    const confirmReject = async () => {
        if (!selectedRent?.id) {
            notifications.show({ title: 'Hiba', message: 'Nincs kiválasztott bérlés az elutasításhoz.', color: 'red' });
            return;
        }
        setIsLoading(true);
        try {
            await api.Staff.rejectRent(selectedRent.id, rejectionReason || null);
            notifications.show({
                title: 'Siker!',
                message: `A(z) #${selectedRent.id} bérlés elutasítva.`,
                color: 'teal',
                icon: <IconCheck />
            });
            fetchPendingRents();
        } catch (err: any) {
            notifications.show({
                title: 'Elutasítási Hiba',
                message: err.response?.data?.message || 'Az elutasítás nem sikerült.',
                color: 'red'
            });
        } finally {
            setIsLoading(false);
            closeRejectModal();
        }
    };

    const rows = pendingRents.map((rent) => (
        <Table.Tr key={rent.id} style={{
            transition: 'all 0.2s ease',
            background: 'rgba(15, 23, 42, 0.4)',
        }}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                  }}>
            <Table.Td>
                <Badge color="blue" variant="light" size="lg" style={{ fontWeight: 600 }}>
                    #{rent.id}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
                        <IconUsers size={20} />
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{rent.renterName}</Text>
                        <Text size="xs" c="dimmed">ID: {rent.renterId}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                        <IconCar size={20} />
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{rent.carBrand}</Text>
                        <Text size="xs" c="dimmed">{rent.carModel}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                <Box>
                    <Text size="sm" fw={500}>{dayjs(rent.plannedStart).format('YYYY.MM.DD')}</Text>
                    <Text size="xs" c="dimmed">
                        {dayjs(rent.plannedStart).format('HH:mm')} - {dayjs(rent.plannedEnd).format('HH:mm')}
                    </Text>
                </Box>
            </Table.Td>
            <Table.Td>
                <Badge color={rent.invoiceRequest ? 'blue' : 'gray'} variant="filled" size="md" tt="uppercase">
                    {rent.invoiceRequest ? 'Kér' : 'Nem kér'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button
                        size="sm"
                        color="green"
                        variant="light"
                        onClick={() => handleApproveClick(rent)}
                        leftSection={<IconCheck size={16} />}
                    >
                        Jóváhagyás
                    </Button>
                    <Button
                        size="sm"
                        color="red"
                        variant="light"
                        onClick={() => handleRejectClick(rent)}
                        leftSection={<IconX size={16} />}
                    >
                        Elutasítás
                    </Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center py={60} style={{ flexDirection: 'column' }}>
            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="md">
                <IconMailbox size={40} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek függőben lévő igények</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Jelenleg minden beérkezett kérés feldolgozásra került.
            </Text>
        </Center>
    );

    const errorState = (
        <Center py={60} style={{ flexDirection: 'column' }}>
            <ThemeIcon size={80} radius="xl" variant="light" color="red" mb="md">
                <IconAlertCircle size={40} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Hiba történt</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400} mb="md">
                {error}
            </Text>
            <Button
                color="red"
                variant="light"
                onClick={fetchPendingRents}
                leftSection={<IconRefresh size={16} />}
            >
                Újrapróbálás
            </Button>
        </Center>
    );

    return (
        <Stack gap="xl">
            <Paper shadow="xl" p="xl" withBorder style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }}>
                <Group justify="space-between" mb="xl">
                    <Group gap="sm">
                        <ThemeIcon size="xl" radius="md" variant="light" color="green">
                            <IconClipboardCheck size={28} />
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Függőben Lévő Igények</Title>
                            <Text size="sm" c="dimmed">
                                {pendingRents.length > 0
                                    ? `${pendingRents.length} igény vár feldolgozásra`
                                    : 'Nincsenek függőben lévő igények'}
                            </Text>
                        </Box>
                    </Group>
                    <ActionIcon
                        variant="light"
                        size="xl"
                        color="blue"
                        onClick={fetchPendingRents}
                        loading={isLoading}
                        aria-label="Igények frissítése"
                    >
                        <IconRefresh style={{ width: rem(20) }} />
                    </ActionIcon>
                </Group>

                <Divider mb="xl" opacity={0.1} />

                <Box style={{ position: 'relative', minHeight: '300px' }}>
                    <LoadingOverlay visible={isLoading} overlayProps={{ radius: 'sm', blur: 2 }} />

                    {!isLoading && error && errorState}
                    {!isLoading && !error && pendingRents.length === 0 && emptyState}
                    {!isLoading && !error && pendingRents.length > 0 && (
                        <ScrollArea>
                            <Table striped={false} highlightOnHover={false} miw={900} style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}>
                                <Table.Thead style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                }}>
                                    <Table.Tr>
                                        <Table.Th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Igény ID</Table.Th>
                                        <Table.Th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Igénylő</Table.Th>
                                        <Table.Th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Jármű</Table.Th>
                                        <Table.Th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Időszak</Table.Th>
                                        <Table.Th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Számla</Table.Th>
                                        <Table.Th style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Műveletek</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}
                </Box>
            </Paper>

            <Modal opened={approveModalOpened} onClose={closeApproveModal} title="Jóváhagyás Megerősítése" centered>
                {selectedRent && (
                    <Stack>
                        <Text>Biztosan jóváhagyod a következő bérlési igényt?</Text>
                        <Paper withBorder p="md" radius="md" style={{
                            background: 'rgba(15, 23, 42, 0.5)',
                        }}>
                            <Stack gap="xs">
                                <Group>
                                    <ThemeIcon size="md" variant="light" color="blue">
                                        <IconCar size={16} />
                                    </ThemeIcon>
                                    <Box flex={1}>
                                        <Text fw={600} size="sm">{selectedRent.carBrand} {selectedRent.carModel}</Text>
                                    </Box>
                                </Group>
                                <Text c="dimmed" size="xs">
                                    Igénylő: {selectedRent.renterName} (#{selectedRent.renterId})
                                </Text>
                                <Text c="dimmed" size="xs">
                                    Időszak: {dayjs(selectedRent.plannedStart).format('YYYY.MM.DD')} - {dayjs(selectedRent.plannedEnd).format('YYYY.MM.DD')}
                                </Text>
                            </Stack>
                        </Paper>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeApproveModal}>Mégsem</Button>
                            <Button
                                color="green"
                                onClick={confirmApprove}
                                loading={isLoading}
                                leftSection={<IconCheck size={16} />}
                            >
                                Jóváhagyás
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            <Modal opened={rejectModalOpened} onClose={closeRejectModal} title="Elutasítás Megerősítése" centered>
                {selectedRent && (
                    <Stack>
                        <Text>Biztosan elutasítod a(z) #{selectedRent.id} bérlési igényt?</Text>
                        <Textarea
                            label="Elutasítás oka (opcionális)"
                            placeholder="Pl. a kiválasztott jármű karbantartás alatt áll..."
                            value={rejectionReason}
                            onChange={(event) => setRejectionReason(event.currentTarget.value)}
                            minRows={3}
                            styles={{
                                input: {
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                }
                            }}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeRejectModal}>Mégsem</Button>
                            <Button
                                color="red"
                                onClick={confirmReject}
                                loading={isLoading}
                                leftSection={<IconX size={16} />}
                            >
                                Elutasítás
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Stack>
    );
};


// ========================================================================
// 2. KOMPONENS: A RunningRents.tsx kódja bemásolva és átalakítva
// ========================================================================

const RunningRentsTab = () => {
    const [rents, setRents] = useState<IRentGetDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);
    const [actualEndDate, setActualEndDate] = useState<Date | null>(new Date());
    const [endingKilometer, setEndingKilometer] = useState<string | number>('');
    const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

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
            notifications.show({ title: 'Hiba', message: errorMsg, color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRents();
    }, []);

    const handleOpenModal = (rent: IRentGetDto) => {
        setSelectedRent(rent);
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

        const actualStartDate = new Date(selectedRent.actualStart!);
        if (actualEndDate < actualStartDate) {
            notifications.show({
                title: 'Érvénytelen dátum',
                message: `A visszavétel dátuma (${dayjs(actualEndDate).format('YYYY.MM.DD HH:mm')}) nem lehet korábbi, mint a kiadás dátuma (${dayjs(actualStartDate).format('YYYY.MM.DD HH:mm')}).`,
                color: 'red',
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
                icon: <IconCheck />
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
                        <IconCar size={20} />
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
                        <IconUser size={20} />
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
                    leftSection={<IconCalendarEvent size={14} />}
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
                    leftSection={<IconClockPlay size={14} />}
                >
                    Folyamatban
                </Badge>
            </Table.Td>
            <Table.Td>
                <Button
                    onClick={() => handleOpenModal(rent)}
                    size="sm"
                    leftSection={<IconCar size={16} />}
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
        <Center py={60} style={{ flexDirection: 'column' }}>
            <ThemeIcon size={80} radius="xl" variant="light" color="cyan" mb="md"
                       style={{
                           background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                       }}
            >
                <IconClockHour4 size={40} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek futó kölcsönzések</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Jelenleg egyetlen autó sincs kiadva bérlőnek.
            </Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba!" color="red" radius="md" w="100%" maw={600}
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
        <>
            <Paper
                shadow="xl" p="xl" withBorder
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
            >
                <Box style={{ position: 'relative', minHeight: '300px' }}>
                    <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />

                    <Group justify="space-between" mb="lg">
                        <Group gap="sm">
                            <ThemeIcon size="xl" radius="md" variant="light" color="green">
                                <IconClockPlay size={28} />
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
                            <IconRefresh style={{ width: rem(18) }} />
                        </ActionIcon>
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

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
                                            style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Jármű</Table.Th>
                                        <Table.Th
                                            style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Bérlő</Table.Th>
                                        <Table.Th
                                            style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Tényleges
                                            Kezdés</Table.Th>
                                        <Table.Th
                                            style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Státusz</Table.Th>
                                        <Table.Th
                                            style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Művelet</Table.Th>
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
                        <IconCar size={20} />
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
                                leftSection={<IconCheck size={16} />}
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
        </>
    );
};


// ========================================================================
// 3. KOMPONENS: A CompletedRents.tsx kódja bemásolva és átalakítva
// ========================================================================

const CompletedRentsTab = () => {
    dayjs.locale('hu'); // Nyelvi beállítás
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
                icon: <IconAlertCircle />,
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
                        <IconCar size={20} />
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
                        <IconUser size={20} />
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{rent.renterName}</Text>
                        <Text size="xs" c="dimmed">ID: {rent.renterId}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                {rent.actualStart ? (
                    <Badge
                        color="cyan"
                        variant="light"
                        size="lg"
                        tt="none"
                        leftSection={<IconCalendarEvent size={14} />}
                    >
                        {dayjs(rent.actualStart).format('YYYY.MM.DD HH:mm')}
                    </Badge>
                ) : <Badge color="gray" variant="light">-</Badge>}
            </Table.Td>
            <Table.Td>
                {rent.actualEnd ? (
                    <Badge
                        color="cyan"
                        variant="light"
                        size="lg"
                        tt="none"
                        leftSection={<IconCalendarEvent size={14} />}
                    >
                        {dayjs(rent.actualEnd).format('YYYY.MM.DD HH:mm')}
                    </Badge>
                ) : <Badge color="gray" variant="light">-</Badge>}
            </Table.Td>
            <Table.Td>
                <Badge
                    color="blue"
                    variant="filled"
                    size="lg"
                    tt="none"
                    leftSection={<IconDashboard size={14} />}
                >
                    {rent.endingKilometer
                        ? `${rent.endingKilometer.toLocaleString('hu-HU')} km`
                        : '-'}
                </Badge>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center py={60} style={{ flexDirection: 'column' }}>
            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="md"
                       style={{
                           background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(51, 65, 85, 0.15) 100%)',
                       }}
            >
                <IconCarOff size={40} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek lezárt kölcsönzések</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Még egyetlen kölcsönzés sem zárult le a rendszerben.
            </Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba!" color="red" radius="md" w="100%" maw={600}
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
        <Paper
            shadow="xl" p="xl" withBorder
            style={{
                background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
        >
            <Box style={{ position: 'relative', minHeight: '300px' }}>
                <LoadingOverlay visible={loading} overlayProps={{ radius: 'sm', blur: 2 }} />

                <Group justify="space-between" mb="lg">
                    <Group gap="sm">
                        <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                            <IconListCheck size={28} />
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Lezárt Kölcsönzések</Title>
                            <Text size="sm" c="dimmed">
                                {loading ? 'Adatok töltése...' : `${rents.length} befejezett bérlés`}
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
                        <IconRefresh style={{ width: rem(18) }} />
                    </ActionIcon>
                </Group>

                <Divider mb="xl" opacity={0.1} />

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
                                        style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Jármű</Table.Th>
                                    <Table.Th
                                        style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Bérlő</Table.Th>
                                    <Table.Th
                                        style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Tényleges
                                        kezdés</Table.Th>
                                    <Table.Th
                                        style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Tényleges
                                        befejezés</Table.Th>
                                    <Table.Th
                                        style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem' }}>Záró
                                        km óra</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{rows}</Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Box>
        </Paper>
    );
};


// ========================================================================
// 4. KOMPONENS: A FŐ OLDAL, AMI ÖSSZEFOGJA A FÜLEKET
// ========================================================================

const AdminRentalsPage = () => {
    const [activeTab, setActiveTab] = useState<string | null>('pending');

    return (
        <Container size="xl" my="xl">
            <Box mb="xl">
                <Title order={1} size="h2" fw={900} style={{
                    background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem',
                }}>
                    Operatív Kezelőpult
                </Title>
                <Text c="dimmed" size="sm">Függőben lévő, futó és lezárt bérlések adminisztrációja</Text>
            </Box>

            <Tabs value={activeTab} onChange={setActiveTab} color="blue" variant="pills" radius="md">
                <Tabs.List grow>
                    <Tabs.Tab
                        value="pending"
                        leftSection={<IconMailbox size={16} />}
                    >
                        Jóváhagyásra váró
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="running"
                        leftSection={<IconClockHour4 size={16} />}
                    >
                        Futó kölcsönzések
                    </Tabs.Tab>
                    <Tabs.Tab
                        value="history"
                        leftSection={<IconListCheck size={16} />}
                    >
                        Lezárt (Előzmények)
                    </Tabs.Tab>
                </Tabs.List>

                {/* Itt hívjuk meg a fenti komponenseket */}

                <Tabs.Panel value="pending" pt="xl">
                    <PendingRentsTab />
                </Tabs.Panel>

                <Tabs.Panel value="running" pt="xl">
                    <RunningRentsTab />
                </Tabs.Panel>

                <Tabs.Panel value="history" pt="xl">
                    <CompletedRentsTab />
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
};

export default AdminRentalsPage;