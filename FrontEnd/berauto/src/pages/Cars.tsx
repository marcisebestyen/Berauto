import {
    Button,
    Group,
    Table,
    Box,
    Badge,
    Paper,
    Stack,
    Grid,
    Title,
    Center,
    LoadingOverlay,
    Text,
    ScrollArea,
} from '@mantine/core';
import {DatePickerInput} from '@mantine/dates';
import {useState} from 'react';
import {
    IconCalendarSearch,
    IconCarOff,
    IconCalendarEvent,
    IconBookmark,
    IconListCheck,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/hu';

import api from '../api/api.ts';
import {ICar, CarAvailabilityStatus} from '../interfaces/ICar.ts';
import {notifications} from '@mantine/notifications';
import BookingModal from '../modals/BookingModal';

dayjs.extend(customParseFormat);
dayjs.locale('hu');

const Cars = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isWaitingListLoading, setIsWaitingListLoading] = useState<number | null>(null);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchAllCarsWithAvailability = async () => {
        setHasSearched(true);

        if (!startDate || !endDate) {
            notifications.show({
                title: 'Hiányzó dátumok',
                message: 'Kérlek, add meg a kezdő és befejező dátumot.',
                color: 'yellow'
            });
            setItems([]);
            return;
        }

        // Ensure dates are valid Date objects
        const validStartDate = startDate instanceof Date ? startDate : new Date(startDate);
        const validEndDate = endDate instanceof Date ? endDate : new Date(endDate);

        if (validStartDate < dayjs().startOf('day').toDate()) {
            notifications.show({
                title: 'Hibás kezdő dátum',
                message: 'A bérlés kezdő dátuma nem lehet korábbi a mai napnál.',
                color: 'red'
            });
            setItems([]);
            return;
        }
        if (validStartDate > validEndDate) {
            notifications.show({
                title: 'Hibás időintervallum',
                message: 'A kezdő dátum nem lehet későbbi, mint a befejező dátum.',
                color: 'red'
            });
            setItems([]);
            return;
        }

        setIsLoading(true);
        try {
            const utcStartDate = new Date(Date.UTC(
                validStartDate.getFullYear(),
                validStartDate.getMonth(),
                validStartDate.getDate()
            ));

            const utcEndDate = new Date(Date.UTC(
                validEndDate.getFullYear(),
                validEndDate.getMonth(),
                validEndDate.getDate()
            ));

            const res = await api.Cars.getAvailableCars(utcStartDate, utcEndDate);

            setItems(res.data);
        } catch (error: any) {
            console.error('Error fetching cars:', error);
            console.error('Error response:', error.response);
            notifications.show({
                title: 'Hiba',
                message: error.response?.data?.message || error.message || 'Nem sikerült betölteni az autókat.',
                color: 'red',
            });
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToWaitingList = async (carId: number) => {
        setIsWaitingListLoading(carId);
        try {
            const response = await api.Rents.addToWaitingList(carId);
            notifications.show({
                title: 'Sikeres feliratkozás',
                message: `Sikeresen feliratkoztál a várólistára. Pozíciód: ${response.data.queuePosition}`,
                color: 'green'
            });
        } catch (error: any) {
            console.error('Waiting list error:', error);
            let msg = 'Váratlan hiba történt a várólistára való feliratkozás során.';
            if (error.response?.data?.Message || error.response?.data?.message) {
                msg = error.response.data.Message || error.response.data.message;
            } else if (error.response?.status === 401) {
                msg = 'Kérlek, jelentkezz be a várólistára való feliratkozáshoz.';
            } else if (error.response?.status === 403) {
                msg = 'Vendég felhasználók nem iratkozhatnak fel várólistára.';
            }
            notifications.show({title: 'Hiba', message: msg, color: 'red'});
        } finally {
            setIsWaitingListLoading(null);
        }
    };

    const openBookingModal = (carId: number) => {
        if (!startDate || !endDate) {
            notifications.show({
                title: 'Hiányzó dátumok',
                message: 'Kérlek, először válassz dátumot a foglaláshoz.',
                color: 'orange'
            });
            return;
        }
        setSelectedCarId(carId);
        setBookingOpen(true);
    };

    const handleStartDateChange = (value: any) => {
        const date = value instanceof Date ? value : (value ? new Date(value) : null);
        setStartDate(date);
        if (endDate && date && date > endDate) {
            setEndDate(null);
        }
    };

    const handleEndDateChange = (value: any) => {
        const date = value instanceof Date ? value : (value ? new Date(value) : null);
        setEndDate(date);
    };

    const renderStatusBadge = (status: CarAvailabilityStatus) => {
        switch (status) {
            case CarAvailabilityStatus.Available:
                return <Badge color="green" variant="light">Elérhető</Badge>;
            case CarAvailabilityStatus.Rented:
                return <Badge color="red" variant="light">Foglalt</Badge>;
            case CarAvailabilityStatus.NotProperCondition:
                return <Badge color="yellow" variant="light">Nem bérelhető</Badge>;
            case CarAvailabilityStatus.Deleted:
                return <Badge color="gray" variant="light">Törölve</Badge>;
            default:
                return <Badge color="gray" variant="light">Ismeretlen</Badge>;
        }
    };

    const rows = items.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>
                <Text fw={500}>{element.brand}</Text>
                <Text size="xs" c="dimmed">{element.model}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color="gray" variant="filled" size="lg">
                    {element.pricePerDay} Ft/nap
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={element.isAutomatic ? 'blue' : 'gray'} variant="light">
                    {element.isAutomatic ? 'Automata' : 'Manuális'}
                </Badge>
            </Table.Td>
            <Table.Td>{renderStatusBadge(element.status)}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button
                        size="xs"
                        leftSection={<IconBookmark size={14}/>}
                        onClick={() => openBookingModal(element.id)}
                        disabled={element.status !== CarAvailabilityStatus.Available}
                    >
                        Foglalás
                    </Button>
                    <Button
                        size="xs"
                        variant="light"
                        color="gray"
                        leftSection={<IconListCheck size={14}/>}
                        onClick={() => handleAddToWaitingList(element.id)}
                        disabled={element.status === CarAvailabilityStatus.Available || element.status === CarAvailabilityStatus.NotProperCondition}
                        loading={isWaitingListLoading === element.id}
                    >
                        Várólista
                    </Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    const initialState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconCalendarSearch size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Keresés indítása</Title>
            <Text c="dimmed" size="sm" mt={4}>Kérjük, válasszon kezdő és befejező dátumot az elérhető autók
                listázásához.</Text>
        </Center>
    );

    const emptyState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconCarOff size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek találatok</Title>
            <Text c="dimmed" size="sm" mt={4}>A megadott időintervallumban sajnos egyetlen autó sem elérhető.</Text>
        </Center>
    );

    return (
        <Stack>
            <Paper shadow="sm" p="lg" withBorder>
                <Title order={3} mb="md">Autók keresése</Title>
                <Grid>
                    <Grid.Col span={{base: 12, md: 6}}>
                        <DatePickerInput
                            label="Bérlés kezdete"
                            placeholder="Válassz kezdő dátumot"
                            value={startDate}
                            onChange={handleStartDateChange}
                            locale="hu"
                            clearable
                            minDate={new Date()}
                            leftSection={<IconCalendarEvent size={16}/>}
                        />
                    </Grid.Col>
                    <Grid.Col span={{base: 12, md: 6}}>
                        <DatePickerInput
                            label="Bérlés vége"
                            placeholder="Válassz befejező dátumot"
                            value={endDate}
                            onChange={handleEndDateChange}
                            locale="hu"
                            clearable
                            minDate={startDate ? dayjs(startDate).add(0, 'day').toDate() : new Date()}
                            leftSection={<IconCalendarEvent size={16}/>}
                        />
                    </Grid.Col>
                </Grid>
                <Button
                    onClick={fetchAllCarsWithAvailability}
                    mt="lg"
                    loading={isLoading}
                    disabled={!startDate || !endDate}
                    fullWidth
                    size="md"
                >
                    Elérhető autók keresése
                </Button>
            </Paper>

            <Paper shadow="sm" p="lg" withBorder>
                <Box style={{position: 'relative', minHeight: '250px'}}>
                    <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

                    {!isLoading && !hasSearched && initialState}
                    {!isLoading && hasSearched && items.length === 0 && emptyState}
                    {!isLoading && items.length > 0 && (
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder miw={700}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Jármű</Table.Th>
                                        <Table.Th>Ár</Table.Th>
                                        <Table.Th>Váltó</Table.Th>
                                        <Table.Th>Státusz</Table.Th>
                                        <Table.Th>Műveletek</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}
                </Box>
            </Paper>

            {selectedCarId !== null && (
                <BookingModal
                    carId={selectedCarId}
                    opened={bookingOpen}
                    onClose={() => {
                        setBookingOpen(false);
                        setSelectedCarId(null);
                        if (hasSearched) fetchAllCarsWithAvailability();
                    }}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                />
            )}
        </Stack>
    );
};

export default Cars;