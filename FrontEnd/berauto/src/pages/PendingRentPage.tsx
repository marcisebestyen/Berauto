import {useEffect, useState} from 'react';
import {
    Table,
    Button,
    Group,
    Title,
    Text,
    Paper,
    LoadingOverlay,
    Modal,
    Textarea,
    Stack,
    Badge,
    ScrollArea,
    Center,
    ActionIcon,
    Box,
    rem,
    Container,
    ThemeIcon,
    Divider,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {notifications} from '@mantine/notifications';
import {
    IconCheck,
    IconX,
    IconAlertCircle,
    IconRefresh,
    IconMailbox,
    IconClipboardCheck,
    IconUsers,
    IconCar,
} from '@tabler/icons-react';
import api from '../api/api';
import {IRentGetDto} from '../interfaces/IRent';
import dayjs from 'dayjs';
import useAuth from '../hooks/useAuth';

const PendingRentsPage = () => {
    const [pendingRents, setPendingRents] = useState<IRentGetDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const [approveModalOpened, {open: openApproveModal, close: closeApproveModal}] = useDisclosure(false);
    const [rejectModalOpened, {open: openRejectModal, close: closeRejectModal}] = useDisclosure(false);
    const {user} = useAuth();

    const fetchPendingRents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Rents.getRentsGloballyByFilter("Open");
            setPendingRents(response.data || []);
        } catch (err: any) {
            const errorMsg = "Nem sikerült betölteni a jóváhagyásra váró igényeket.";
            setError(errorMsg);
            notifications.show({title: 'Lekérdezési Hiba', message: errorMsg, color: 'red'});
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
                icon: <IconCheck/>
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
            notifications.show({title: 'Hiba', message: 'Nincs kiválasztott bérlés az elutasításhoz.', color: 'red'});
            return;
        }
        setIsLoading(true);
        try {
            await api.Staff.rejectRent(selectedRent.id, rejectionReason || null);
            notifications.show({
                title: 'Siker!',
                message: `A(z) #${selectedRent.id} bérlés elutasítva.`,
                color: 'teal',
                icon: <IconCheck/>
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
                <Badge color="blue" variant="light" size="lg" style={{fontWeight: 600}}>
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
                        leftSection={<IconCheck size={16}/>}
                    >
                        Jóváhagyás
                    </Button>
                    <Button
                        size="sm"
                        color="red"
                        variant="light"
                        onClick={() => handleRejectClick(rent)}
                        leftSection={<IconX size={16}/>}
                    >
                        Elutasítás
                    </Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center py={60} style={{flexDirection: 'column'}}>
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
        <Center py={60} style={{flexDirection: 'column'}}>
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
                leftSection={<IconRefresh size={16}/>}
            >
                Újrapróbálás
            </Button>
        </Center>
    );

    return (
        <Container size="xl" my="xl">
            <Stack gap="xl">
                {/* Fejléc */}
                <Box>
                    <Title order={1} size="h2" fw={900} style={{
                        background: 'linear-gradient(45deg, #10b981 0%, #3b82f6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>
                        Jóváhagyásra Váró Igények
                    </Title>
                    <Text c="dimmed" size="sm">Feldolgozandó bérlési kérelmek kezelése</Text>
                </Box>

                {/* Fő tartalom */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Group justify="space-between" mb="xl">
                        <Group gap="sm">
                            <ThemeIcon size="xl" radius="md" variant="light" color="green">
                                <IconClipboardCheck size={28}/>
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
                            <IconRefresh style={{width: rem(20)}}/>
                        </ActionIcon>
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

                    <Box style={{position: 'relative', minHeight: '300px'}}>
                        <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

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
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Igény ID</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Igénylő</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Jármű</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Időszak</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Számla</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Műveletek</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>{rows}</Table.Tbody>
                                </Table>
                            </ScrollArea>
                        )}
                    </Box>
                </Paper>
            </Stack>

            {/* Jóváhagyás Modal */}
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
                                leftSection={<IconCheck size={16}/>}
                            >
                                Jóváhagyás
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>

            {/* Elutasítás Modal */}
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
                                leftSection={<IconX size={16}/>}
                            >
                                Elutasítás
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Container>
    );
};

export default PendingRentsPage;