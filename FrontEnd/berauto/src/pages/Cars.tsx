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
    Container,
    ThemeIcon,
    Divider,
    Select,
} from '@mantine/core';
import {DatePickerInput} from '@mantine/dates';
import {useState, useEffect} from 'react';
import {
    IconCalendarSearch,
    IconCarOff,
    IconCalendarEvent,
    IconBookmark,
    IconListCheck,
    IconCar,
    IconSearch,
    IconSparkles,
    IconMapPin,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/hu';

import api from '../api/api.ts';
import {ICar, CarAvailabilityStatus} from '../interfaces/ICar.ts';
import {IDepot} from '../interfaces/IDepot.ts';
import {notifications} from '@mantine/notifications';
import BookingModal from '../modals/BookingModal';

dayjs.extend(customParseFormat);
dayjs.locale('hu');

const Cars = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const [depots, setDepots] = useState<IDepot[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [selectedDepotId, setSelectedDepotId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isWaitingListLoading, setIsWaitingListLoading] = useState<number | null>(null);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [bookingOpen, setBookingOpen] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Fetch depots on component mount
    useEffect(() => {
        const fetchDepots = async () => {
            try {
                const res = await api.Depots.getAll();
                setDepots(res.data);
            } catch (error: any) {
                console.error('Error fetching depots:', error);
                notifications.show({
                    title: 'Hiba',
                    message: 'Nem sikerült betölteni a telephelyeket.',
                    color: 'red',
                });
            }
        };
        fetchDepots();
    }, []);

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

            // Call API with optional depotId parameter
            const depotIdParam = selectedDepotId ? parseInt(selectedDepotId, 10) : undefined;
            const res = await api.Cars.getAvailableCars(utcStartDate, utcEndDate, depotIdParam);
            setItems(res.data);
        } catch (error: any) {
            console.error('Error fetching cars:', error);
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
                return <Badge color="green" variant="filled" size="md" tt="uppercase">Elérhető</Badge>;
            case CarAvailabilityStatus.Rented:
                return <Badge color="red" variant="filled" size="md" tt="uppercase">Foglalt</Badge>;
            case CarAvailabilityStatus.NotProperCondition:
                return <Badge color="yellow" variant="filled" size="md" tt="uppercase">Nem bérelhető</Badge>;
            case CarAvailabilityStatus.Deleted:
                return <Badge color="gray" variant="filled" size="md" tt="uppercase">Törölve</Badge>;
            default:
                return <Badge color="gray" variant="filled" size="md" tt="uppercase">Ismeretlen</Badge>;
        }
    };

    const getDepotById = (depotId: number): IDepot | undefined => {
        return depots.find(d => d.id === depotId);
    };

    const rows = items.map((element) => {
        const depot = getDepotById(element.depotId);
        return (
            <Table.Tr key={element.id} style={{
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
                    <Group gap="sm">
                        <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                            <IconCar size={20} />
                        </ThemeIcon>
                        <Box>
                            <Text fw={600} size="sm">{element.brand}</Text>
                            <Text size="xs" c="dimmed">{element.model}</Text>
                        </Box>
                    </Group>
                </Table.Td>
                <Table.Td>
                    {depot ? (
                        <Group gap="xs">
                            <IconMapPin size={16} stroke={1.5} />
                            <Box>
                                <Text size="sm" fw={500}>{depot.name}</Text>
                                <Text size="xs" c="dimmed">{depot.city}</Text>
                            </Box>
                        </Group>
                    ) : (
                        <Text size="sm" c="dimmed">Nincs adat</Text>
                    )}
                </Table.Td>
                <Table.Td>
                    <Badge
                        color="cyan"
                        variant="filled"
                        size="lg"
                        tt="none"
                        style={{
                            fontWeight: 600,
                        }}
                    >
                        {element.pricePerDay.toLocaleString('hu-HU')} Ft/nap
                    </Badge>
                </Table.Td>
                <Table.Td>
                    <Badge color={element.isAutomatic ? 'blue' : 'gray'} variant="filled" size="md" tt="uppercase">
                        {element.isAutomatic ? 'Automata' : 'Manuális'}
                    </Badge>
                </Table.Td>
                <Table.Td>{renderStatusBadge(element.status)}</Table.Td>
                <Table.Td>
                    <Group gap="xs">
                        <Button
                            size="sm"
                            leftSection={<IconBookmark size={16}/>}
                            onClick={() => openBookingModal(element.id)}
                            disabled={element.status !== CarAvailabilityStatus.Available}
                            variant="light"
                            color="blue"
                        >
                            Foglalás
                        </Button>
                        <Button
                            size="sm"
                            variant="subtle"
                            color="gray"
                            leftSection={<IconListCheck size={16}/>}
                            onClick={() => handleAddToWaitingList(element.id)}
                            disabled={element.status === CarAvailabilityStatus.Available || element.status === CarAvailabilityStatus.NotProperCondition}
                            loading={isWaitingListLoading === element.id}
                        >
                            Várólista
                        </Button>
                    </Group>
                </Table.Td>
            </Table.Tr>
        );
    });

    const initialState = (
        <Center py={60} style={{flexDirection: 'column'}}>
            <ThemeIcon size={80} radius="xl" variant="light" color="cyan" mb="md"
                       style={{
                           background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                       }}
            >
                <IconCalendarSearch size={40} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Keresés indítása</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Válassz kezdő és befejező dátumot, hogy megtaláld a számodra tökéletes járművet a kívánt időszakra.
            </Text>
        </Center>
    );

    const emptyState = (
        <Center py={60} style={{flexDirection: 'column'}}>
            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="md">
                <IconCarOff size={40} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek elérhető autók</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                A megadott időintervallumban sajnos egyetlen autó sem elérhető. Próbálj meg másik dátumot választani!
            </Text>
        </Center>
    );

    const depotSelectData = depots.map(depot => ({
        value: depot.id.toString(),
        label: `${depot.name} - ${depot.city}`
    }));

    return (
        <Container size="xl" my="xl">
            <Stack gap="xl">
                {/* Fejléc */}
                <Box>
                    <Title order={1} size="h2" fw={900} style={{
                        background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>
                        Autók Keresése
                    </Title>
                    <Text c="dimmed" size="sm">Találd meg a tökéletes járművet az utazásodhoz</Text>
                </Box>

                {/* Keresési Form */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Group gap="sm" mb="xl">
                        <ThemeIcon size="xl" radius="md" variant="light" color="cyan">
                            <IconSearch size={28}/>
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Keresési Paraméterek</Title>
                            <Text size="sm" c="dimmed">Add meg a bérlés időszakát és telephelyet</Text>
                        </Box>
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

                    <Grid>
                        <Grid.Col span={{base: 12, md: 4}}>
                            <DatePickerInput
                                label="Bérlés kezdete"
                                placeholder="Válassz kezdő dátumot"
                                value={startDate}
                                onChange={handleStartDateChange}
                                locale="hu"
                                clearable
                                minDate={new Date()}
                                leftSection={<IconCalendarEvent size={18}/>}
                                size="md"
                                styles={{
                                    input: {
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                    }
                                }}
                            />
                        </Grid.Col>
                        <Grid.Col span={{base: 12, md: 4}}>
                            <DatePickerInput
                                label="Bérlés vége"
                                placeholder="Válassz befejező dátumot"
                                value={endDate}
                                onChange={handleEndDateChange}
                                locale="hu"
                                clearable
                                minDate={startDate ? dayjs(startDate).add(0, 'day').toDate() : new Date()}
                                leftSection={<IconCalendarEvent size={18}/>}
                                size="md"
                                styles={{
                                    input: {
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                    }
                                }}
                            />
                        </Grid.Col>
                        <Grid.Col span={{base: 12, md: 4}}>
                            <Select
                                label="Telephely (opcionális)"
                                placeholder="Válassz telephelyet"
                                value={selectedDepotId}
                                onChange={setSelectedDepotId}
                                data={depotSelectData}
                                clearable
                                leftSection={<IconMapPin size={18}/>}
                                size="md"
                                styles={{
                                    input: {
                                        background: 'rgba(15, 23, 42, 0.5)',
                                        borderColor: 'rgba(255, 255, 255, 0.1)',
                                    }
                                }}
                            />
                        </Grid.Col>
                    </Grid>
                    <Button
                        onClick={fetchAllCarsWithAvailability}
                        mt="xl"
                        loading={isLoading}
                        disabled={!startDate || !endDate}
                        fullWidth
                        size="lg"
                        leftSection={<IconSparkles size={20}/>}
                        style={{
                            background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                            fontWeight: 600,
                        }}
                    >
                        Elérhető autók keresése
                    </Button>
                </Paper>

                {/* Eredmények */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Box style={{position: 'relative', minHeight: '300px'}}>
                        <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

                        {!isLoading && !hasSearched && initialState}
                        {!isLoading && hasSearched && items.length === 0 && emptyState}
                        {!isLoading && items.length > 0 && (
                            <>
                                <Group gap="sm" mb="xl">
                                    <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                        <IconCar size={28}/>
                                    </ThemeIcon>
                                    <Box>
                                        <Title order={3} size="h4">Elérhető Járművek</Title>
                                        <Text size="sm" c="dimmed">{items.length} autó találat</Text>
                                    </Box>
                                </Group>

                                <Divider mb="xl" opacity={0.1} />

                                <ScrollArea>
                                    <Table striped={false} highlightOnHover={false} miw={800} style={{
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                    }}>
                                        <Table.Thead style={{
                                            background: 'rgba(15, 23, 42, 0.6)',
                                        }}>
                                            <Table.Tr>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Jármű</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Telephely</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Ár</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Váltó</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Státusz</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Műveletek</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>{rows}</Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            </>
                        )}
                    </Box>
                </Paper>
            </Stack>

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
                    initialDepotId={selectedDepotId ? parseInt(selectedDepotId, 10) : null}
                    depots={depots}
                />
            )}
        </Container>
    );
};

export default Cars;