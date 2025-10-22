import {useState, useEffect} from 'react';
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
    ActionIcon,
    rem,
} from '@mantine/core';
import {DatePickerInput} from '@mantine/dates';
import {useDisclosure} from '@mantine/hooks';
import {notifications} from '@mantine/notifications';
import {
    IconCheck,
    IconAlertCircle,
    IconCarSuv,
    IconRefresh,
    IconInfoCircle,
} from '@tabler/icons-react';
import api from '../api/api';
import {IRentGetDto} from '../interfaces/IRent';
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

    const [handoverModalOpened, {open: openHandoverModal, close: closeHandoverModal}] = useDisclosure(false);

    const dateFormat = "YYYY.MM.DD";

    const fetchHandovers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Rents.getRentsGloballyByFilter("ApprovedForHandover");
            if (!Array.isArray(response.data)) {
                throw new Error("A szerver válasza nem a várt formátumú (nem tömb).");
            }

            setHandovers(response.data);
            const initialDates: Record<number, Date | null> = {};
            response.data.forEach(rent => {
                const plannedStartDate = rent.plannedStart ? dayjs(rent.plannedStart) : dayjs();
                initialDates[rent.id] = plannedStartDate.isAfter(dayjs()) ? plannedStartDate.toDate() : dayjs().toDate();
            });
            setSelectedActualStartDates(initialDates);
        } catch (err: any) {
            console.error("Hiba az átadandó bérlések lekérésekor:", err);
            setError("Nem sikerült betölteni az átadásra váró kölcsönzéseket.");
            notifications.show({
                title: 'Lekérdezési Hiba',
                message: err.message || 'Ismeretlen hiba történt.',
                color: 'red'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchHandovers();
    }, []);

    const handleActualStartDateChange = (rentId: number, value: any) => {
        const date = value instanceof Date ? value : (value ? new Date(value) : null);
        setSelectedActualStartDates(prevDates => ({
            ...prevDates,
            [rentId]: date,
        }));
    };

    const handleHandoverClick = (rent: IRentGetDto) => {
        if (!selectedActualStartDates[rent.id]) {
            notifications.show({
                title: 'Hiányzó adat',
                message: 'Kérjük, válassza ki a tényleges átadás dátumát!',
                color: 'orange'
            });
            return;
        }
        setSelectedRent(rent);
        openHandoverModal();
    };

    const confirmHandover = async () => {
        if (!selectedRent?.id || !selectedActualStartDates[selectedRent.id]) return;

        const localTime = selectedActualStartDates[selectedRent.id];
        if (!localTime) return;
        const utcTime = new Date(Date.UTC(localTime.getFullYear(), localTime.getMonth(), localTime.getDate()));


        setIsLoading(true);
        try {
            await api.Staff.handOverCar(selectedRent.id, utcTime);
            notifications.show({
                title: 'Sikeres Átadás',
                message: `Az autó átadása rögzítve.`,
                color: 'green',
                icon: <IconCheck/>
            });
            closeHandoverModal();
            fetchHandovers();
        } catch (err: any) {
            notifications.show({
                title: 'Átadási Hiba',
                message: err.response?.data?.message || 'Az autó átadása nem sikerült.',
                color: 'red',
                icon: <IconAlertCircle/>
            });
        } finally {
            setIsLoading(false);
        }
    };

    const noHandovers = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconInfoCircle size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek átadásra váró foglalások</Title>
            <Text c="dimmed" size="sm" mt={4}>Jelenleg minden jóváhagyott autó át van adva.</Text>
        </Center>
    );

    const rows = handovers.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>
                <Text fw={500}>{rent.id}</Text>
            </Table.Td>
            <Table.Td>
                <Text fw={500}>{`${rent.carBrand} ${rent.carModel}`}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{dayjs(rent.plannedStart).format('YYYY.MM.DD')}</Text>
                <Text size="xs" c="dimmed">{dayjs(rent.plannedStart).format('HH:mm')}</Text>
            </Table.Td>
            <Table.Td style={{minWidth: 200}}>
                <DatePickerInput
                    placeholder="Átadás dátuma"
                    value={selectedActualStartDates[rent.id] || null}
                    onChange={(date) => handleActualStartDateChange(rent.id, date)}
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
                <Badge color="teal" variant='light'>
                    {`ID: ${rent.approverId}`}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Button
                    size="xs"
                    onClick={() => handleHandoverClick(rent)}
                    leftSection={<IconCarSuv size={14}/>}
                    disabled={!!rent.actualStart || !selectedActualStartDates[rent.id]}
                >
                    Átadás
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    if (isLoading && handovers.length === 0) {
        return <Center style={{height: '100%'}}><LoadingOverlay visible/></Center>;
    }
    if (error) {
        return <Center style={{height: '100%'}}><Alert icon={<IconAlertCircle/>} title="Hiba!" color="red"
                                                       radius="md">{error}</Alert></Center>;
    }

    return (
        <Paper shadow="sm" p="md" withBorder>
            <LoadingOverlay visible={isLoading && handovers.length > 0} overlayProps={{radius: 'sm', blur: 2}}/>
            <Group justify="space-between" mb="lg">
                <Title order={3}>Átadásra Váró Autók</Title>
                <ActionIcon variant="light" onClick={fetchHandovers} loading={isLoading} aria-label="Adatok frissítése">
                    <IconRefresh style={{width: rem(18)}}/>
                </ActionIcon>
            </Group>

            {handovers.length > 0 ? (
                <ScrollArea>
                    <Table striped highlightOnHover withTableBorder miw={800}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Bérlés ID</Table.Th>
                                <Table.Th>Jármű</Table.Th>
                                <Table.Th>Tervezett Kezdet</Table.Th>
                                <Table.Th>Tényleges Átadás Dátuma</Table.Th>
                                <Table.Th>Jóváhagyó ID</Table.Th>
                                <Table.Th>Művelet</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </ScrollArea>
            ) : (
                noHandovers
            )}

            <Modal opened={handoverModalOpened} onClose={closeHandoverModal} title="Átadás megerősítése" centered>
                {selectedRent && (
                    <Stack>
                        <Text>Biztosan rögzíti az alábbi bérléshez tartozó autó átadását?</Text>
                        <Paper withBorder p="sm" radius="md" bg="dark">
                            <Group>
                                <Text fw={500} w={100}>Bérlés ID:</Text>
                                <Text size="sm">{selectedRent.id}</Text>
                            </Group>
                            <Group>
                                <Text fw={500} w={100}>Jármű:</Text>
                                <Text size="sm">{`${selectedRent.carBrand} ${selectedRent.carModel}`}</Text>
                            </Group>
                            <Group>
                                <Text fw={500} w={100}>Átadás dátuma:</Text>
                                <Badge color="blue" size="lg">
                                    {dayjs(selectedActualStartDates[selectedRent.id]).format(dateFormat)}
                                </Badge>
                            </Group>
                        </Paper>

                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeHandoverModal}>Mégsem</Button>
                            <Button
                                color="blue"
                                onClick={confirmHandover}
                                loading={isLoading}
                                leftSection={<IconCheck size={16}/>}
                            >
                                Megerősítés
                            </Button>
                        </Group>
                    </Stack>
                )}
            </Modal>
        </Paper>
    );
};

export default CarHandoverPage;