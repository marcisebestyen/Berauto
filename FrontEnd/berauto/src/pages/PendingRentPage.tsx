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
    Alert,
    ActionIcon,
    Box,
    rem,
} from '@mantine/core';
import {useDisclosure} from '@mantine/hooks';
import {notifications} from '@mantine/notifications';
import {
    IconCheck,
    IconX,
    IconAlertCircle,
    IconRefresh,
    IconMailbox,
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
        <Table.Tr key={rent.id}>
            <Table.Td>
                <Text fw={500}>#{rent.id}</Text>
            </Table.Td>
            <Table.Td>
                <Text fw={500}>{rent.renterName}</Text>
                <Text size="xs" c="dimmed">ID: {rent.renterId}</Text>
            </Table.Td>
            <Table.Td>
                <Text fw={500}>{rent.carBrand} {rent.carModel}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{dayjs(rent.plannedStart).format('YYYY.MM.DD')}</Text>
                <Text size="xs"
                      c="dimmed">{dayjs(rent.plannedStart).format('HH:mm')} - {dayjs(rent.plannedEnd).format('HH:mm')}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color={rent.invoiceRequest ? 'blue' : 'gray'} variant="light">
                    {rent.invoiceRequest ? 'Kér' : 'Nem kér'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button size="xs" color="green" variant="light" onClick={() => handleApproveClick(rent)}
                            leftSection={<IconCheck size={14}/>}>
                        Jóváhagyás
                    </Button>
                    <Button size="xs" color="red" variant="light" onClick={() => handleRejectClick(rent)}
                            leftSection={<IconX size={14}/>}>
                        Elutasítás
                    </Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconMailbox size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek függőben lévő igények</Title>
            <Text c="dimmed" size="sm" mt={4}>Jelenleg minden beérkezett kérés feldolgozásra került.</Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%" maw={600}>
                {error}
                <Button color="red" variant="light" onClick={fetchPendingRents} mt="md">
                    Próbálja újra
                </Button>
            </Alert>
        </Center>
    );

    const showEmptyState = !isLoading && !error && pendingRents.length === 0;
    const showErrorState = !isLoading && error;
    const showTable = !isLoading && !error && pendingRents.length > 0;

    return (
        <Paper shadow="sm" p="lg" withBorder>
            <Group justify="space-between" mb="lg">
                <Title order={3}>Jóváhagyásra Váró Igények</Title>
                <ActionIcon variant="light" onClick={fetchPendingRents} loading={isLoading}
                            aria-label="Igények frissítése">
                    <IconRefresh style={{width: rem(18)}}/>
                </ActionIcon>
            </Group>

            <Box style={{position: 'relative', minHeight: '300px'}}>
                <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

                {showErrorState && errorState}
                {showEmptyState && emptyState}

                {showTable && (
                    <ScrollArea>
                        <Table striped highlightOnHover withTableBorder miw={800}>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th>Igény ID</Table.Th>
                                    <Table.Th>Igénylő</Table.Th>
                                    <Table.Th>Jármű</Table.Th>
                                    <Table.Th>Időszak</Table.Th>
                                    <Table.Th>Számla</Table.Th>
                                    <Table.Th>Műveletek</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>{rows}</Table.Tbody>
                        </Table>
                    </ScrollArea>
                )}
            </Box>

            <Modal opened={approveModalOpened} onClose={closeApproveModal} title="Jóváhagyás Megerősítése" centered>
                {selectedRent && (
                    <Stack>
                        <Text>Biztosan jóváhagyod a következő bérlési igényt?</Text>
                        <Paper withBorder p="sm" radius="md" bg="dark">
                            <Text fw={500} size="sm">{selectedRent.carBrand} {selectedRent.carModel}</Text>
                            <Text c="dimmed"
                                  size="xs">Igénylő: {selectedRent.renterName} (#{selectedRent.renterId})</Text>
                            <Text c="dimmed"
                                  size="xs">Időszak: {dayjs(selectedRent.plannedStart).format('YYYY.MM.DD')} - {dayjs(selectedRent.plannedEnd).format('YYYY.MM.DD')}</Text>
                        </Paper>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeApproveModal}>Mégsem</Button>
                            <Button color="green" onClick={confirmApprove} loading={isLoading}
                                    leftSection={<IconCheck size={16}/>}>Jóváhagyás</Button>
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
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeRejectModal}>Mégsem</Button>
                            <Button color="red" onClick={confirmReject} loading={isLoading}
                                    leftSection={<IconX size={16}/>}>Elutasítás</Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Paper>
    );
};

export default PendingRentsPage;