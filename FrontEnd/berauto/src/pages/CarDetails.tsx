import {useEffect, useState} from 'react';
import {
    Container, Title, Paper, Table, Text, Group, Button, LoadingOverlay,
    Stack, SimpleGrid, Badge, ScrollArea, Center, Alert, Divider, Grid,
} from '@mantine/core';
import {Calendar} from '@mantine/dates';
import {useParams, useNavigate} from 'react-router-dom';
import {notifications} from '@mantine/notifications';
import {
    IconAlertCircle, IconArrowLeft, IconCalendarEvent,
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
    <Stack gap={0}>
        <Text size="xs" c="dimmed">{label}</Text>
        <Text size="sm">{children}</Text>
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
                setError('Nem sikerült betölteni az autó adatait.');
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
                    backgroundColor: isFinished ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-orange-1)',
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    {day.date()}
                </div>
            );
        }
        return <div>{day.date()}</div>;
    };

    if (isLoading) {
        return <LoadingOverlay visible={true}/>;
    }

    if (error || !car) {
        return (
            <Container size="md" py={40}>
                <Center>
                    <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%">
                        {error || "Az autó nem található."}
                        <Button onClick={() => navigate('/admin/list-cars')} color="red" variant="light" mt="md">
                            Vissza az autók listájához
                        </Button>
                    </Alert>
                </Center>
            </Container>
        );
    }

    const rentRows = rents.length > 0 ? rents.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>{dayjs(rent.plannedStart).format('YYYY.MM.DD')}</Table.Td>
            <Table.Td>{rent.renterName}</Table.Td>
            <Table.Td>
                <Badge color={rent.finished ? 'gray' : 'green'}>
                    {rent.finished ? 'Lezárult' : 'Aktív/Jövőbeli'}
                </Badge>
            </Table.Td>
            <Table.Td>{rent.totalCost ? `${rent.totalCost.toLocaleString('hu-HU')} Ft` : '-'}</Table.Td>
        </Table.Tr>
    )) : (
        <Table.Tr>
            <Table.Td colSpan={4} ta="center">Nincsenek bérlések ehhez az autóhoz.</Table.Td>
        </Table.Tr>
    );

    return (
        <Container my="md">
            <Group justify="space-between" mb="md">
                <Title order={2}>{car.brand} {car.model}</Title>
                <Button variant="default" leftSection={<IconArrowLeft size={16}/>}
                        onClick={() => navigate('/admin/list-cars')}>
                    Vissza a listához
                </Button>
            </Group>

            <Paper withBorder shadow="sm" p="lg" radius="md">
                <SimpleGrid cols={{base: 1, sm: 2, md: 4}} spacing="lg">
                    <InfoItem label="Rendszám"><Badge size="lg">{car.licencePlate}</Badge></InfoItem>
                    <InfoItem label="Napi Ár"><Text
                        fw={500}>{car.pricePerDay.toLocaleString('hu-HU')} Ft</Text></InfoItem>
                    <InfoItem label="Váltó">{car.isAutomatic ? 'Automata' : 'Manuális'}</InfoItem>
                    <InfoItem label="Futott km">{car.actualKilometers.toLocaleString('hu-HU')} km</InfoItem>
                    <InfoItem label="Üzemanyag">{getFuelTypeLabel(car.fuelType)}</InfoItem>
                    <InfoItem label="Jogosítvány">{getLicenceTypeLabel(car.requiredLicence)}</InfoItem>
                    <InfoItem label="Érvényes Matrica"><Badge
                        color={car.hasValidVignette ? 'teal' : 'red'}>{car.hasValidVignette ? 'Van' : 'Nincs'}</Badge></InfoItem>
                    <InfoItem label="Státusz"><Badge
                        color={car.isRented ? 'orange' : 'green'}>{car.isRented ? 'Kiadva' : 'Szabad'}</Badge></InfoItem>
                </SimpleGrid>

                <Divider my="xl"/>

                <Group gap="sm" mb="md"><IconCalendarEvent size={24}/><Title order={3}>Foglalások</Title></Group>
                <Grid>
                    <Grid.Col span={{base: 12, md: 5}}>
                        <Stack align="center">
                            <Calendar size="md" locale="hu" renderDay={renderDay}/>
                            <Group mt="sm">
                                <Badge color="orange" variant="light">Aktív/Tervezett</Badge>
                                <Badge color="gray" variant="light">Lezárult</Badge>
                            </Group>
                        </Stack>
                    </Grid.Col>
                    <Grid.Col span={{base: 12, md: 7}}>
                        <ScrollArea h={300}>
                            <Table striped highlightOnHover withTableBorder>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Dátum</Table.Th>
                                        <Table.Th>Bérlő</Table.Th>
                                        <Table.Th>Státusz</Table.Th>
                                        <Table.Th>Költség</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rentRows}</Table.Tbody>
                            </Table>
                        </ScrollArea>
                    </Grid.Col>
                </Grid>
            </Paper>
        </Container>
    );
};

export default CarDetailsPage;