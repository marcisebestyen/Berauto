import { useState, useEffect } from 'react';
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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertCircle } from '@tabler/icons-react';
import api from '../api/api'; // Feltételezve, hogy az api.ts a ../api/api.ts útvonalon van
import { IRentGetDto } from '../interfaces/IRent'; // Vagy a te IRentGetDto interfészed
import dayjs from 'dayjs';
import useAuth from '../hooks/useAuth'; // Szükséges lehet az ügyintéző azonosításához a műveleteknél

// const ROLES = {
//     ADMIN: 'Admin',
//     STAFF: 'Staff',
// };

const PendingRentsPage = () => {
    const [pendingRents, setPendingRents] = useState<IRentGetDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);

    const [approveModalOpened, { open: openApproveModal, close: closeApproveModal }] = useDisclosure(false);
    const [rejectModalOpened, { open: openRejectModal, close: closeRejectModal }] = useDisclosure(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const { user } = useAuth(); // Az aktuális felhasználó (ügyintéző) adatainak lekérése

    const fetchPendingRents = async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Az api.ts-ben definiált metódus hívása az "Open" filterrel
            const response = await api.Rents.getRentsGloballyByFilter("Open");
            console.log("Lekérdezett függőben lévő bérlések (nyers adat fetchPendingRents-ben):", response.data); // DEBUG
            if (response.data && Array.isArray(response.data)) {
                response.data.forEach(rent => {
                    console.log(`Bérlés ID a fetchPendingRents-ben (response.data map): ${rent.id}, Típus: ${typeof rent.id}`); // DEBUG
                });
            }
            setPendingRents(response.data || []);
        } catch (err: any) {
            console.error("Hiba a függőben lévő igények lekérésekor:", err);
            setError("Nem sikerült betölteni a jóváhagyásra váró kölcsönzési igényeket.");
            notifications.show({
                title: 'Lekérdezési Hiba',
                message: err.response?.data?.message || err.message || 'Ismeretlen hiba történt.',
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingRents();
    }, []);

    const handleApproveClick = (rent: IRentGetDto) => {
        console.log("handleApproveClick - Kiválasztott bérlés objektum:", rent); // DEBUG
        console.log(`handleApproveClick - Kiválasztott bérlés ID-ja: ${rent.id}, Típusa: ${typeof rent.id}`); // DEBUG
        setSelectedRent(rent);
        openApproveModal();
    };

    const handleRejectClick = (rent: IRentGetDto) => {
        console.log("handleRejectClick - Kiválasztott bérlés objektum:", rent); // DEBUG
        console.log(`handleRejectClick - Kiválasztott bérlés ID-ja: ${rent.id}, Típusa: ${typeof rent.id}`); // DEBUG
        setSelectedRent(rent);
        setRejectionReason(''); // Ürítjük az előző indoklást
        openRejectModal();
    };

    const confirmApprove = async () => {
        console.log("confirmApprove - Kezdeti selectedRent állapot:", selectedRent); // DEBUG
        if (!selectedRent || selectedRent.id == null || selectedRent.id === 0) {
            notifications.show({
                title: 'Hiba',
                message: 'Nincs kiválasztott bérlés a jóváhagyáshoz, vagy az azonosító érvénytelen (null, undefined, vagy 0).',
                color: 'red',
            });
            console.error("confirmApprove hiba: selectedRent null, vagy selectedRent.id érvénytelen. selectedRent:", selectedRent);
            setIsLoading(false);
            closeApproveModal();
            return;
        }
        if (!user?.id) {
            notifications.show({
                title: 'Hiba',
                message: 'A művelethez bejelentkezés szükséges (ügyintéző azonosítása sikertelen).',
                color: 'red',
            });
            setIsLoading(false);
            closeApproveModal();
            return;
        }

        console.log(`confirmApprove - API hívás indítása. Rent ID: ${selectedRent.id}, Staff ID (tokenből jön): ${user.id}`); // DEBUG

        setIsLoading(true);
        try {
            await api.Staff.approveRent(selectedRent.id);
            console.log(`Bérlés ${selectedRent.id} jóváhagyva az ügyintéző (ID: ${user.id}) által.`);
            notifications.show({
                title: 'Sikeres Jóváhagyás',
                message: `A(z) ${selectedRent.id} azonosítójú kölcsönzés jóváhagyva.`,
                color: 'green',
                icon: <IconCheck />,
            });
            fetchPendingRents(); // Lista frissítése
        } catch (err: any) {
            console.error("Hiba a jóváhagyás során:", err);
            notifications.show({
                title: 'Jóváhagyási Hiba',
                message: err.response?.data?.message || err.message || 'A jóváhagyás nem sikerült.',
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setIsLoading(false);
            closeApproveModal();
        }
    };

    const confirmReject = async () => {
        console.log("confirmReject - Kezdeti selectedRent állapot:", selectedRent); // DEBUG
        if (!selectedRent || selectedRent.id == null || selectedRent.id === 0) {
            notifications.show({
                title: 'Hiba',
                message: 'Nincs kiválasztott bérlés az elutasításhoz, vagy az azonosító érvénytelen.',
                color: 'red',
            });
            console.error("confirmReject hiba: selectedRent null, vagy selectedRent.id érvénytelen. selectedRent:", selectedRent);
            setIsLoading(false);
            closeRejectModal();
            return;
        }
        if (!user?.id) {
            setIsLoading(false);
            closeRejectModal();
            return;
        }

        console.log(`confirmReject - API hívás indítása. Rent ID: ${selectedRent.id}, Staff ID (tokenből jön): ${user.id}, Indok: ${rejectionReason}`); // DEBUG

        setIsLoading(true);
        try {
            // TODO: Backend API hívás az elutasításhoz, elküldve a rejectionReason-t is
            // await api.Staff.rejectRent(selectedRent.id, rejectionReason); // Feltételezve, hogy van ilyen API metódus
            console.log(`Bérlés ${selectedRent.id} elutasítva. Indok: ${rejectionReason}. Ügyintéző ID: ${user.id}`);
            notifications.show({
                title: 'Sikeres Elutasítás (Szimulált)',
                message: `A(z) ${selectedRent.id} azonosítójú kölcsönzés elutasítva.`,
                color: 'orange',
                icon: <IconX />,
            });
            fetchPendingRents(); // Lista frissítése
        } catch (err: any) {
            console.error("Hiba az elutasítás során:", err);
            notifications.show({
                title: 'Elutasítási Hiba',
                message: err.response?.data?.message || err.message || 'Az elutasítás nem sikerült.',
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setIsLoading(false);
            closeRejectModal();
        }
    };

    const rows = pendingRents.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>{rent.renterId || 'Ismeretlen igénylő'}</Table.Td>
            <Table.Td>{rent.carBrand || '-'}{rent.carModel ? ` ${rent.carModel}` : ''}</Table.Td>
            <Table.Td>{rent.plannedStart ? dayjs(rent.plannedStart).format('YYYY.MM.DD HH:mm') : '-'}</Table.Td>
            <Table.Td>{rent.plannedEnd ? dayjs(rent.plannedEnd).format('YYYY.MM.DD HH:mm') : '-'}</Table.Td>
            <Table.Td>
                <Badge color={rent.invoiceRequest ? 'blue' : 'gray'} variant="light">
                    {rent.invoiceRequest ? 'Igen' : 'Nem'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button size="xs" color="green" onClick={() => handleApproveClick(rent)} leftSection={<IconCheck size={14}/>}>
                        Jóváhagyás
                    </Button>
                    <Button size="xs" color="red" onClick={() => handleRejectClick(rent)} leftSection={<IconX size={14}/>}>
                        Elutasítás
                    </Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    if (isLoading && pendingRents.length === 0) {
        return <Center style={{ height: '100%' }}><LoadingOverlay visible={true} /></Center>;
    }

    if (error) {
        return (
            <Center style={{ height: '100%' }}>
                <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba!" color="red" radius="md">
                    {error}
                </Alert>
            </Center>
        );
    }

    return (
        <Paper shadow="sm" p="md" withBorder>
            <LoadingOverlay visible={isLoading && pendingRents.length > 0} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
            <Title order={2} mb="lg">Jóváhagyásra Váró Kölcsönzési Igények</Title>
            {pendingRents.length > 0 ? (
                <ScrollArea>
                    <Table striped highlightOnHover withTableBorder withColumnBorders miw={800}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Igénylő ID</Table.Th>
                                <Table.Th>Autó</Table.Th>
                                <Table.Th>Tervezett Kezdet</Table.Th>
                                <Table.Th>Tervezett Vég</Table.Th>
                                <Table.Th>Számlát Kér?</Table.Th>
                                <Table.Th>Műveletek</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </ScrollArea>
            ) : !isLoading ? (
                <Text>Nincsenek jóváhagyásra váró kölcsönzési igények.</Text>
            ) : null }

            {/* Jóváhagyás Modális Ablak */}
            <Modal opened={approveModalOpened} onClose={closeApproveModal} title="Jóváhagyás Megerősítése" centered>
                <Stack>
                    <Text>Biztosan jóváhagyod a(z) {selectedRent?.id} azonosítójú kölcsönzési igényt?</Text>
                    <Text size="sm">Autó: {selectedRent?.carBrand} {selectedRent?.carModel}</Text>
                    <Text size="sm">Időszak: {selectedRent?.plannedStart ? dayjs(selectedRent.plannedStart).format('YYYY.MM.DD HH:mm') : ''} - {selectedRent?.plannedEnd ? dayjs(selectedRent.plannedEnd).format('YYYY.MM.DD HH:mm') : ''}</Text>
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeApproveModal}>Mégsem</Button>
                        <Button color="green" onClick={confirmApprove} loading={isLoading}>Jóváhagyás</Button>
                    </Group>
                </Stack>
            </Modal>

            {/* Elutasítás Modális Ablak */}
            <Modal opened={rejectModalOpened} onClose={closeRejectModal} title="Elutasítás Megerősítése" centered>
                <Stack>
                    <Text>Biztosan elutasítod a(z) {selectedRent?.id} azonosítójú kölcsönzési igényt?</Text>
                    <Textarea
                        label="Elutasítás oka (opcionális)"
                        placeholder="Kérjük, add meg az elutasítás okát..."
                        value={rejectionReason}
                        onChange={(event) => setRejectionReason(event.currentTarget.value)}
                        minRows={3}
                    />
                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeRejectModal}>Mégsem</Button>
                        <Button color="red" onClick={confirmReject} loading={isLoading}>Elutasítás</Button>
                    </Group>
                </Stack>
            </Modal>
        </Paper>
    );
};

export default PendingRentsPage;
