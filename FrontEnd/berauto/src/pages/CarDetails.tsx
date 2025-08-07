import {
    Button,
    Card,
    Group,
    Table,
    Box,
    Loader,
    Text,
    Badge,
    Title,
    SimpleGrid,
} from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isBetween from 'dayjs/plugin/isBetween';
import 'dayjs/locale/hu';
import { notifications } from '@mantine/notifications';

import api from '../api/api.ts';
import { ICar } from '../interfaces/ICar.ts';
import { IRentGetDto, IRentForCalendar } from '../interfaces/IRent.ts';

import '@mantine/dates/styles.css';


dayjs.extend(customParseFormat);
dayjs.extend(isBetween);
dayjs.locale('hu');


const CarDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [car, setCar] = useState<ICar | null>(null);
    const [rents, setRents] = useState<IRentForCalendar[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchCarDetails = async () => {
            if (!id) {
                notifications.show({
                    title: 'Hiba',
                    message: 'Érvénytelen autóazonosító.',
                    color: 'red',
                });
                navigate('/admin/list-cars');
                return;
            }

            setIsLoading(true);
            try {
                const carRes = await api.Cars.getCarById(parseInt(id));
                setCar(carRes.data as ICar); // ITT A MÓDOSÍTÁS!

                const rentsRes = await api.Rents.getRentsByCarId(parseInt(id));
                const rentsData: IRentGetDto[] = rentsRes.data as IRentGetDto[]; // ITT A MÓDOSÍTÁS!

                const parsedRentsForCalendar: IRentForCalendar[] = rentsData.map((rentDto: IRentGetDto) => ({
                    ...rentDto,
                    parsedPlannedStart: dayjs(rentDto.plannedStart).toDate(),
                    parsedPlannedEnd: dayjs(rentDto.plannedEnd).toDate(),
                    parsedActualStart: rentDto.actualStart ? dayjs(rentDto.actualStart).toDate() : null,
                    parsedActualEnd: rentDto.actualEnd ? dayjs(rentDto.actualEnd).toDate() : null,
                }));
                setRents(parsedRentsForCalendar);

            } catch (error: any) {
                console.error("Hiba az adatok betöltésekor:", error);
                notifications.show({
                    title: 'Hiba',
                    message: 'Nem sikerült betölteni az autó adatait vagy a bérléseket.',
                    color: 'red',
                });
                setCar(null);
                setRents([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCarDetails();
    }, [id, navigate]);

    const renderDay = (dateStr: string) => {
        const day = dayjs(dateStr);
        const currentRent = rents.find(rent => {
            const plannedStart = dayjs(rent.parsedPlannedStart);
            const plannedEnd = dayjs(rent.parsedPlannedEnd);
            return day.isBetween(plannedStart, plannedEnd, null, '[]');
        });

        if (currentRent) {
            const isFinishedRent = currentRent.finished || (currentRent.parsedActualEnd && dayjs(currentRent.parsedActualEnd).isBefore(dayjs(), 'day'));

            const color = isFinishedRent ? 'var(--mantine-color-gray-2)' : 'var(--mantine-color-orange-light)';
            const textColor = isFinishedRent ? 'var(--mantine-color-gray-7)' : 'var(--mantine-color-orange-light-color)';
            const title = isFinishedRent ? 'Befejezett bérlés' : 'Aktív/Tervezett bérlés';

            return (
                <div
                    title={title}
                    style={{
                        backgroundColor: color,
                        color: textColor,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 'calc(var(--mantine-spacing-md) * 2)',
                        height: 'calc(var(--mantine-spacing-md) * 2)',
                    }}
                >
                    {day.date()}
                </div>
            );
        }

        return <div>{day.date()}</div>;
    };


    if (isLoading) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Box ta="center" py="lg">
                    <Loader size="xl" />
                    <Text mt="md">Autó adatok betöltése...</Text>
                </Box>
            </Card>
        );
    }

    if (!car) {
        return (
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Box ta="center" py="lg">
                    <Text>Az autó nem található, vagy hiba történt a betöltés során.</Text>
                    <Button mt="md" onClick={() => navigate('/admin/list-cars')}>Vissza az autókhoz</Button>
                </Box>
            </Card>
        );
    }

    const rentRows = rents.length > 0 ? rents.map((rent) => (
        <Table.Tr key={rent.id}>
            <Table.Td>{dayjs(rent.plannedStart).format('YYYY.MM.DD.')}</Table.Td>
            <Table.Td>{dayjs(rent.plannedEnd).format('YYYY.MM.DD.')}</Table.Td>
            <Table.Td>{rent.renterName}</Table.Td>
            <Table.Td>{rent.approverId ? rent.approverId : 'Nincs'}</Table.Td>
            <Table.Td>
                <Badge color={rent.finished ? 'green' : 'orange'}>
                    {rent.finished ? 'Befejezett' : 'Aktív/Tervezett'}
                </Badge>
            </Table.Td>
            <Table.Td>
                {rent.actualStart ? dayjs(rent.actualStart).format('YYYY.MM.DD.') : 'Nincs'} /
                {rent.actualEnd ? dayjs(rent.actualEnd).format('YYYY.MM.DD.') : 'Nincs'}
            </Table.Td>
            <Table.Td>{rent.startingKilometer || 'Nincs'} / {rent.endingKilometer || 'Nincs'}</Table.Td>
            <Table.Td>{rent.totalCost ? `${rent.totalCost} Ft` : 'Nincs'}</Table.Td>
        </Table.Tr>
    )) : (
        <Table.Tr>
            <Table.Td colSpan={8} ta="center">Nincsenek bérlések ehhez az autóhoz.</Table.Td>
        </Table.Tr>
    );

    return (
        <div>
            <Group justify="space-between" mb="lg">
                <Title order={2}>{car.brand} {car.model} - {car.licencePlate}</Title>
                <Button onClick={() => navigate('/admin/list-cars')}>Vissza az autókhoz</Button>
            </Group>

            <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                <Title order={3} mb="md">Alap adatok</Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
                    <Text><strong>Márka:</strong> {car.brand}</Text>
                    <Text><strong>Modell:</strong> {car.model}</Text>
                    <Text><strong>Rendszám:</strong> {car.licencePlate}</Text>
                    <Text><strong>Napi ár:</strong> {car.pricePerDay} Ft</Text>
                    <Text><strong>Váltó:</strong> <Badge color={car.isAutomatic ? 'green' : 'blue'}>{car.isAutomatic ? 'Automata' : 'Manuális'}</Badge></Text>
                    <Text><strong>Üzemanyag:</strong> {car.fuelType}</Text>
                    <Text><strong>Jogosítvány:</strong> {car.requiredLicence}</Text>
                    <Text><strong>Futott km:</strong> {car.actualKilometers} km</Text>
                    <Text><strong>Érvényes matrica:</strong> <Badge color={car.hasValidVignette ? 'green' : 'red'}>{car.hasValidVignette ? 'Igen' : 'Nem'}</Badge></Text>
                    <Text><strong>Állapot:</strong> <Badge color={car.inProperCondition ? 'green' : 'red'}>{car.inProperCondition ? 'Megfelelő' : 'Nem megfelelő'}</Badge></Text>
                    <Text><strong>Bérelt:</strong> <Badge color={car.isRented ? 'orange' : 'green'}>{car.isRented ? 'Igen' : 'Nem'}</Badge></Text>
                    <Text><strong>Törölve:</strong> <Badge color={car.isDeleted ? 'red' : 'green'}>{car.isDeleted ? 'Igen' : 'Nem'}</Badge></Text>
                </SimpleGrid>
                <Group mt="lg" justify="flex-end">
                    <Button variant="outline">Adatok szerkesztése</Button>
                </Group>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                <Title order={3} mb="md">Foglalási naptár</Title>
                <Group justify="center">
                    <Calendar
                        size="md"
                        locale="hu"
                        renderDay={renderDay}
                        numberOfColumns={2}
                    />
                </Group>
                <Text mt="md" ta="center" fz="sm" c="dimmed">
                    <Badge color="orange" mr="xs" /> Aktív/Tervezett bérlés
                    <Badge color="gray" ml="md" mr="xs" /> Befejezett bérlés
                </Text>
            </Card>

            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Title order={3} mb="md">Bérlések listája</Title>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Tervezett Kezdés</Table.Th>
                            <Table.Th>Tervezett Vége</Table.Th>
                            <Table.Th>Bérlő neve</Table.Th>
                            <Table.Th>Jóváhagyó ID</Table.Th>
                            <Table.Th>Státusz</Table.Th>
                            <Table.Th>Tényleges (Kezdés/Vége)</Table.Th>
                            <Table.Th>KM (Kezdés/Vége)</Table.Th>
                            <Table.Th>Költség</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rentRows}</Table.Tbody>
                </Table>
            </Card>
        </div>
    );
};

export default CarDetailsPage;