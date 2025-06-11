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
    Stack,
    Badge,
    ScrollArea,
    Center,
    Alert,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconAlertCircle, IconCarSuv } from '@tabler/icons-react';
import api from '../api/api';
import { IRentGetDto } from '../interfaces/IRent';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'dayjs/locale/hu';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.locale('hu');

const CarHandoverPage = () => {
    const [handovers, setHandovers] = useState<IRentGetDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRent, setSelectedRent] = useState<IRentGetDto | null>(null);
    const [selectedActualStartDates, setSelectedActualStartDates] = useState<Record<number, Date | null>>({});

    const [handoverModalOpened, { open: openHandoverModal, close: closeHandoverModal }] = useDisclosure(false);

    const dateFormat = "YYYY.MM.DD";

    const fetchHandovers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Rents.getRentsGloballyByFilter("ApprovedForHandover");

            if (!Array.isArray(response.data)) {
                // Írjuk ki a konzolra, hogy mit kaptunk valójában, ez segít a hibakeresésben.
                console.error("API hiba: a response.data nem tömb, hanem:", response.data);
                // Dobjunk egy hibát, amit a catch blokk elkap és kezel.
                throw new Error("A szerver válasza nem a várt formátumú (nem tömb).");
            }

            setHandovers(response.data);
            const initialDates: Record<number, Date | null> = {};
            response.data.forEach(rent => {
                const plannedStartDate = rent.plannedStart ? dayjs(rent.plannedStart) : null;
                const today = dayjs().startOf('day');
                if (plannedStartDate && plannedStartDate.isSameOrAfter(today)) {
                    initialDates[rent.id] = plannedStartDate.toDate();
                } else {
                    initialDates[rent.id] = today.toDate();
                }
            });
            setSelectedActualStartDates(initialDates);
        } catch (err: any) {
            console.error("Hiba az átadandó bérlések lekérésekor:", err);
            setError("Nem sikerült betölteni az átadásra váró kölcsönzéseket.");
            notifications.show({ title: 'Lekérdezési Hiba', message: err.response?.data?.message || err.message || 'Ismeretlen hiba történt.', color: 'red', icon: <IconAlertCircle />, });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHandovers();
    }, []);

    const handleActualStartDateChange = (rentId: number, dateString: string | null) => {
        if (dateString) {
            const parsedDate = dayjs(dateString, dateFormat, 'hu').toDate();
            setSelectedActualStartDates(prevDates => ({
                ...prevDates,
                [rentId]: parsedDate,
            }));
        } else {
            setSelectedActualStartDates(prevDates => ({
                ...prevDates,
                [rentId]: null,
            }));
        }
    };

    const handleHandoverClick = (rent: IRentGetDto) => {
        if (!selectedActualStartDates[rent.id]) {
            notifications.show({
                title: 'Hiányzó adat',
                message: 'Kérjük, válassza ki a tényleges átadás dátumát a listában!',
                color: 'orange',
            });
            return;
        }
        setSelectedRent(rent);
        openHandoverModal();
    };

    const confirmHandover = async () => {
        if (!selectedRent || !selectedRent.id) { /* ... */ return; }
        const actualHandoverTime = selectedActualStartDates[selectedRent.id];
        if (!actualHandoverTime) { /* ... */ return; }

        setIsLoading(true);
        try {
            await api.Staff.handOverCar(selectedRent.id, actualHandoverTime);
            notifications.show({ title: 'Sikeres Átadás', message: `A(z) ${selectedRent.id} azonosítójú kölcsönzéshez az autó átadva.`, color: 'green', icon: <IconCheck />, });
            fetchHandovers();
        } catch (err: any) {
            console.error("Hiba az autó átadása során:", err);
            notifications.show({ title: 'Átadási Hiba', message: err.response?.data?.message || err.message || 'Az autó átadása nem sikerült.', color: 'red', icon: <IconAlertCircle />, });
        } finally {
            setIsLoading(false);
            closeHandoverModal();
        }
    };

    const rows = handovers.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>{rent.renterId}</Table.Td>
            <Table.Td>{rent.carBrand || '-'}{rent.carModel ? ` ${rent.carModel}` : ''}</Table.Td>
            <Table.Td>{rent.plannedStart ? dayjs(rent.plannedStart).format('YYYY.MM.DD HH:mm') : '-'}</Table.Td>
            <Table.Td style={{ minWidth: 180 }}>
                <DatePickerInput
                    placeholder="Átadás dátuma"
                    value={selectedActualStartDates[rent.id] ? dayjs(selectedActualStartDates[rent.id]).format(dateFormat) : null}
                    onChange={(dateString) => handleActualStartDateChange(rent.id, dateString)}
                    minDate={
                        rent.plannedStart
                            ? (dayjs(rent.plannedStart).isSameOrAfter(dayjs().startOf('day'))
                                ? dayjs(rent.plannedStart).startOf('day').toDate()
                                : dayjs().startOf('day').toDate())
                            : dayjs().startOf('day').toDate()
                    }
                    maxDate={new Date()}
                    locale="hu"
                    valueFormat={dateFormat}
                    disabled={!rent.approverId || !!rent.actualStart}
                    size="xs"
                />
            </Table.Td>
            <Table.Td>
                <Badge color={rent.approverId ? 'teal' : 'gray'} variant='light'>
                    {rent.approverId ? `Jóváhagyva (ID: ${rent.approverId})` : 'Nincs jóváhagyva'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Button
                    size="xs"
                    color="blue"
                    onClick={() => handleHandoverClick(rent)}
                    leftSection={<IconCarSuv size={14}/>}
                    disabled={!rent.approverId || !!rent.actualStart || !selectedActualStartDates[rent.id]}
                >
                    Átadás Rögzítése
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    if (isLoading && handovers.length === 0) { return <Center style={{ height: '100%' }}><LoadingOverlay visible={true} /></Center>; }
    if (error) { return ( <Center style={{ height: '100%' }}><Alert icon={<IconAlertCircle size="1rem" />} title="Hiba!" color="red" radius="md">{error}</Alert></Center> ); }

    return (
        <Paper shadow="sm" p="md" withBorder>
            <LoadingOverlay visible={isLoading && handovers.length > 0} />
            <Title order={2} mb="lg">Átadásra Váró Autók</Title>
            {handovers.length > 0 ? (
                <ScrollArea>
                    <Table striped highlightOnHover withTableBorder withColumnBorders miw={950}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Bérlő ID</Table.Th>
                                <Table.Th>Autó</Table.Th>
                                <Table.Th>Tervezett Kezdet</Table.Th>
                                <Table.Th>Tényleges Átadás</Table.Th>
                                <Table.Th>Jóváhagyás</Table.Th>
                                <Table.Th>Műveletek</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </ScrollArea>
            ) : !isLoading ? ( <Text>Nincsenek átadásra váró foglalások.</Text> ) : null}

            <Modal
                opened={handoverModalOpened}
                onClose={closeHandoverModal}
                title={`Átadás megerősítése (Bérlés ID: ${selectedRent?.id})`}
                centered
            >
                <Stack>
                    <Text size="sm">Bérlő ID: {selectedRent?.renterId}</Text>
                    <Text size="sm">Autó: {selectedRent?.carBrand} {selectedRent?.carModel}</Text>
                    <Text>Tényleges átadás időpontja:
                        <strong>
                            {selectedActualStartDates[selectedRent?.id ?? 0]
                                ? dayjs(selectedActualStartDates[selectedRent?.id ?? 0]).format('YYYY.MM.DD')
                                : 'Nincs kiválasztva'}
                        </strong>
                    </Text>
                    <Text>Biztosan rögzíti az autó átadását a kiválasztott dátummal?</Text>

                    <Group justify="flex-end" mt="md">
                        <Button variant="default" onClick={closeHandoverModal}>Mégsem</Button>
                        <Button
                            color="blue"
                            onClick={confirmHandover}
                            loading={isLoading}
                            disabled={!selectedActualStartDates[selectedRent?.id ?? 0]}
                        >
                            Átadás Rögzítése
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Paper>
    );
};

export default CarHandoverPage;
