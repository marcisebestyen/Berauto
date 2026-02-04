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
    ActionIcon,
    rem,
    Container,
    ThemeIcon,
    Box,
    Divider,
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
    IconCar,
    IconCalendarEvent,
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

    const rows = handovers.map((rent) => (
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
                    <Text size="xs" c="dimmed">{dayjs(rent.plannedStart).format('HH:mm')}</Text>
                </Box>
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
                    size="sm"
                    leftSection={<IconCalendarEvent size={16}/>}
                    styles={{
                        input: {
                            background: 'rgba(15, 23, 42, 0.5)',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        }
                    }}
                />
            </Table.Td>
            <Table.Td>
                <Badge color="teal" variant="filled" size="md" tt="uppercase">
                    ID: {rent.approverId}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Button
                    size="sm"
                    onClick={() => handleHandoverClick(rent)}
                    leftSection={<IconCarSuv size={16}/>}
                    disabled={!!rent.actualStart || !selectedActualStartDates[rent.id]}
                    variant="light"
                    color="blue"
                >
                    Átadás
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center py={60} style={{flexDirection: 'column'}}>
            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="md">
                <IconInfoCircle size={40} stroke={1.5}/>
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek átadásra váró foglalások</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Jelenleg minden jóváhagyott autó át van adva.
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
                onClick={fetchHandovers}
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
                        background: 'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>
                        Átadásra Váró Autók
                    </Title>
                    <Text c="dimmed" size="sm">Jóváhagyott bérlések autóinak átadása</Text>
                </Box>

                {/* Fő tartalom */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Group justify="space-between" mb="xl">
                        <Group gap="sm">
                            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                <IconCarSuv size={28}/>
                            </ThemeIcon>
                            <Box>
                                <Title order={3} size="h4">Átadásra Váró Járművek</Title>
                                <Text size="sm" c="dimmed">
                                    {handovers.length > 0
                                        ? `${handovers.length} jármű vár átadásra`
                                        : 'Nincsenek átadásra váró járművek'}
                                </Text>
                            </Box>
                        </Group>
                        <ActionIcon
                            variant="light"
                            size="xl"
                            color="blue"
                            onClick={fetchHandovers}
                            loading={isLoading}
                            aria-label="Adatok frissítése"
                        >
                            <IconRefresh style={{width: rem(20)}}/>
                        </ActionIcon>
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

                    <Box style={{position: 'relative', minHeight: '300px'}}>
                        <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

                        {!isLoading && error && errorState}
                        {!isLoading && !error && handovers.length === 0 && emptyState}
                        {!isLoading && !error && handovers.length > 0 && (
                            <ScrollArea>
                                <Table striped={false} highlightOnHover={false} miw={900} style={{
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                }}>
                                    <Table.Thead style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                    }}>
                                        <Table.Tr>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Bérlés ID</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Jármű</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Tervezett Kezdet</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Tényleges Átadás</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Jóváhagyó</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Művelet</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>{rows}</Table.Tbody>
                                </Table>
                            </ScrollArea>
                        )}
                    </Box>
                </Paper>
            </Stack>

            {/* Átadás Megerősítés Modal */}
            <Modal opened={handoverModalOpened} onClose={closeHandoverModal} title="Átadás megerősítése" centered>
                {selectedRent && (
                    <Stack>
                        <Text>Biztosan rögzíti az alábbi bérléshez tartozó autó átadását?</Text>
                        <Paper withBorder p="md" radius="md" style={{
                            background: 'rgba(15, 23, 42, 0.5)',
                        }}>
                            <Stack gap="sm">
                                <Group>
                                    <ThemeIcon size="md" variant="light" color="blue">
                                        <IconCar size={16} />
                                    </ThemeIcon>
                                    <Box flex={1}>
                                        <Text fw={600} size="sm">Bérlés ID:</Text>
                                        <Badge color="blue" variant="light" size="lg">
                                            #{selectedRent.id}
                                        </Badge>
                                    </Box>
                                </Group>
                                <Group>
                                    <Text fw={500} style={{width: 100}}>Jármű:</Text>
                                    <Text size="sm">{selectedRent.carBrand} {selectedRent.carModel}</Text>
                                </Group>
                                <Group>
                                    <Text fw={500} style={{width: 100}}>Átadás dátuma:</Text>
                                    <Badge color="blue" size="lg" variant="filled">
                                        {dayjs(selectedActualStartDates[selectedRent.id]).format(dateFormat)}
                                    </Badge>
                                </Group>
                            </Stack>
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
        </Container>
    );
};

export default CarHandoverPage;