import {useEffect, useState} from 'react';
import {
    Container, Title, Paper, Table, Text, Group, Button, LoadingOverlay,
    Stack, Badge, ScrollArea, Center, Divider, Grid, Box, ThemeIcon, SimpleGrid,
} from '@mantine/core';
import {Calendar} from '@mantine/dates';
import {useParams, useNavigate} from 'react-router-dom';
import {notifications} from '@mantine/notifications';
import {
    IconAlertCircle, IconArrowLeft, IconCalendarEvent,
    IconGasStation, IconLicense, IconRoad, IconInfoCircle,
} from '@tabler/icons-react';
import api from '../api/api.ts';
import {ICar} from '../interfaces/ICar.ts';
import {IRentGetDto, IRentForCalendar} from '../interfaces/IRent.ts';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/hu';

dayjs.extend(isBetween);
dayjs.locale('hu');

const fuelTypesMap: { [key: number]: string } = {0: "Dízel", 1: "Benzin", 2: "Hibrid", 3: "Elektromos"};
const licenceTypesMap: { [key: number]: string } = {0: "AM", 1: "A1", 2: "A2", 3: "A", 4: "B"};
const getFuelTypeLabel = (value: number | string) => fuelTypesMap[Number(value)] || 'Ismeretlen';
const getLicenceTypeLabel = (value: number | string) => licenceTypesMap[Number(value)] || 'Ismeretlen';

const InfoItem = ({label, children}: { label: string; children: React.ReactNode }) => (
    <Stack gap={4}>
        <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
        <Box>{children}</Box>
    </Stack>
);

const CarDetailsPage = () => {
    const {id} = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [car, setCar] = useState<ICar | null>(null);
    const [rents, setRents] = useState<IRentForCalendar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setError("Érvénytelen autóazonosító.");
            return;
        }
        const fetchCarDetails = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [carRes, rentsRes] = await Promise.all([
                    api.Cars.getCarById(parseInt(id)),
                    api.Rents.getRentsByCarId(parseInt(id))
                ]);
                const carData = carRes.data as ICar;
                setCar(carData);
                const rentsData = rentsRes.data as IRentGetDto[];
                setRents(rentsData.map(rent => ({
                    ...rent,
                    parsedPlannedStart: dayjs(rent.plannedStart).toDate(),
                    parsedPlannedEnd: dayjs(rent.plannedEnd).toDate(),
                })));
            } catch (error: any) {
                setError(error.response?.data?.message || error.message || 'Nem sikerült betölteni az autó adatait.');
                notifications.show({title: 'Hiba', message: 'Az adatok betöltése sikertelen.', color: 'red'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchCarDetails();
    }, [id]);

    const renderDay = (date: Date) => {
        const day = dayjs(date);
        const isRented = rents.some(rent => day.isBetween(rent.parsedPlannedStart, rent.parsedPlannedEnd, 'day', '[]'));
        const isFinished = rents.some(rent => rent.finished && day.isBetween(rent.parsedPlannedStart, rent.parsedPlannedEnd, 'day', '[]'));

        if (isRented) {
            return (
                <div style={{
                    backgroundColor: isFinished ? 'rgba(107, 114, 128, 0.3)' : 'rgba(251, 146, 60, 0.3)',
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '4px',
                }}>
                    {day.date()}
                </div>
            );
        }
        return <div>{day.date()}</div>;
    };

    if (isLoading) {
        return (
            <Container size="xl" my="xl">
                <Box style={{position: 'relative', minHeight: '400px'}}>
                    <LoadingOverlay visible={true} overlayProps={{radius: 'sm', blur: 2}}/>
                </Box>
            </Container>
        );
    }

    if (error || !car) {
        return (
            <Container size="xl" my="xl">
                <Stack gap="xl">
                    <Box>
                        <Title order={1} size="h2" fw={900} style={{
                            background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem',
                        }}>
                            Jármű Részletei
                        </Title>
                        <Text c="dimmed" size="sm">Autó információk</Text>
                    </Box>

                    <Paper shadow="xl" p="xl" withBorder style={{
                        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                    }}>
                        <Center py={60} style={{flexDirection: 'column'}}>
                            <ThemeIcon size={80} radius="xl" variant="light" color="red" mb="md">
                                <IconAlertCircle size={40} stroke={1.5} />
                            </ThemeIcon>
                            <Title order={3} fw={700} mb="xs">Hiba történt</Title>
                            <Text c="dimmed" size="sm" ta="center" maw={400} mb="xl">
                                {error || "Az autó nem található."}
                            </Text>
                            <Button
                                onClick={() => navigate('/admin/list-cars')}
                                variant="light"
                                leftSection={<IconArrowLeft size={16}/>}
                            >
                                Vissza a listához
                            </Button>
                        </Center>
                    </Paper>
                </Stack>
            </Container>
        );
    }

    const rentRows = rents.length > 0 ? rents.map((rent) => (
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
                <Text size="sm" fw={500}>{dayjs(rent.plannedStart).format('YYYY.MM.DD')}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{rent.renterName}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color={rent.finished ? 'gray' : 'orange'} variant="filled" size="md">
                    {rent.finished ? 'Lezárult' : 'Aktív/Jövőbeli'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge color="cyan" variant="filled" size="lg" tt="none" style={{fontWeight: 600}}>
                    {rent.totalCost ? `${rent.totalCost.toLocaleString('hu-HU')} Ft` : '-'}
                </Badge>
            </Table.Td>
        </Table.Tr>
    )) : (
        <Table.Tr>
            <Table.Td colSpan={4}>
                <Center py="xl">
                    <Text c="dimmed" size="sm">Nincsenek bérlések ehhez az autóhoz.</Text>
                </Center>
            </Table.Td>
        </Table.Tr>
    );

    return (
        <Container size="xl" my="xl">
            <Stack gap="xl">
                {/* Fejléc */}
                <Group justify="space-between" align="flex-start">
                    <Box>
                        <Title order={1} size="h2" fw={900} style={{
                            background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem',
                        }}>
                            {car.brand} {car.model}
                        </Title>
                        <Text c="dimmed" size="sm">Jármű részletes információi</Text>
                    </Box>
                    <Button
                        variant="light"
                        leftSection={<IconArrowLeft size={16}/>}
                        onClick={() => navigate('/admin/list-cars')}
                        color="cyan"
                    >
                        Vissza
                    </Button>
                </Group>

                {/* Alapadatok */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Group gap="sm" mb="xl">
                        <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                            <IconInfoCircle size={28}/>
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Alapadatok</Title>
                            <Text size="sm" c="dimmed">Jármű technikai információk</Text>
                        </Box>
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

                    <SimpleGrid cols={{base: 2, sm: 3, md: 4}} spacing="xl">
                        <InfoItem label="Rendszám">
                            <Badge size="xl" variant="outline" color="gray" tt="none" style={{fontSize: '1rem'}}>
                                {car.licencePlate}
                            </Badge>
                        </InfoItem>
                        <InfoItem label="Napi Ár">
                            <Badge size="xl" color="cyan" variant="filled" tt="none" style={{fontSize: '1rem', fontWeight: 700}}>
                                {car.pricePerDay.toLocaleString('hu-HU')} Ft
                            </Badge>
                        </InfoItem>
                        <InfoItem label="Váltó">
                            <Badge size="lg" color={car.isAutomatic ? 'blue' : 'gray'} variant="filled">
                                {car.isAutomatic ? 'Automata' : 'Manuális'}
                            </Badge>
                        </InfoItem>
                        <InfoItem label="Futott km">
                            <Group gap="xs">
                                <IconRoad size={18} stroke={1.5} style={{opacity: 0.7}}/>
                                <Text fw={600}>{car.actualKilometers.toLocaleString('hu-HU')} km</Text>
                            </Group>
                        </InfoItem>
                        <InfoItem label="Üzemanyag">
                            <Group gap="xs">
                                <IconGasStation size={18} stroke={1.5} style={{opacity: 0.7}}/>
                                <Text fw={600}>{getFuelTypeLabel(car.fuelType)}</Text>
                            </Group>
                        </InfoItem>
                        <InfoItem label="Jogosítvány">
                            <Group gap="xs">
                                <IconLicense size={18} stroke={1.5} style={{opacity: 0.7}}/>
                                <Text fw={600}>{getLicenceTypeLabel(car.requiredLicence)}</Text>
                            </Group>
                        </InfoItem>
                        <InfoItem label="Matrica">
                            <Badge color={car.hasValidVignette ? 'teal' : 'red'} variant="filled" size="lg">
                                {car.hasValidVignette ? 'Érvényes' : 'Lejárt'}
                            </Badge>
                        </InfoItem>
                        <InfoItem label="Státusz">
                            <Badge color={car.isRented ? 'orange' : 'green'} variant="filled" size="lg">
                                {car.isRented ? 'Kiadva' : 'Szabad'}
                            </Badge>
                        </InfoItem>
                    </SimpleGrid>
                </Paper>

                {/* Foglalások */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Group gap="sm" mb="xl">
                        <ThemeIcon size="xl" radius="md" variant="light" color="cyan">
                            <IconCalendarEvent size={28}/>
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Foglalások</Title>
                            <Text size="sm" c="dimmed">{rents.length} bérlés összesen</Text>
                        </Box>
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

                    <Grid>
                        <Grid.Col span={{base: 12, md: 5}}>
                            <Stack align="center">
                                <Paper p="md" withBorder style={{
                                    background: 'rgba(15, 23, 42, 0.3)',
                                    borderColor: 'rgba(255, 255, 255, 0.05)',
                                }}>
                                    <Calendar size="md" locale="hu" renderDay={renderDay}/>
                                </Paper>
                                <Group mt="md">
                                    <Badge color="orange" variant="light" size="md">Aktív/Tervezett</Badge>
                                    <Badge color="gray" variant="light" size="md">Lezárult</Badge>
                                </Group>
                            </Stack>
                        </Grid.Col>
                        <Grid.Col span={{base: 12, md: 7}}>
                            <ScrollArea h={400}>
                                <Table striped={false} highlightOnHover={false} style={{
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                }}>
                                    <Table.Thead style={{
                                        background: 'rgba(15, 23, 42, 0.6)',
                                    }}>
                                        <Table.Tr>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Dátum</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Bérlő</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Státusz</Table.Th>
                                            <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Költség</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>{rentRows}</Table.Tbody>
                                </Table>
                            </ScrollArea>
                        </Grid.Col>
                    </Grid>
                </Paper>
            </Stack>
        </Container>
    );
};

export default CarDetailsPage;