import {
    Button,
    Card,
    Group,
    Table,
    Box,
    Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/hu';

import api from '../api/api.ts';
import { ICar, CarAvailabilityStatus } from '../interfaces/ICar.ts';
import { notifications } from '@mantine/notifications';
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

    const fetchAllCarsWithAvailability = async () => {
        if (!startDate || !endDate) {
            notifications.show({
                title: 'Hiányzó dátumok',
                message: 'Kérlek, add meg a kezdő és befejező dátumot a kereséshez.',
                color: 'yellow',
            });
            setItems([]);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (startDate < today) {
            notifications.show({
                title: 'Hibás kezdő dátum',
                message: 'A bérlés kezdő dátuma nem lehet korábbi a mai napnál.',
                color: 'red',
            });
            setItems([]);
            return;
        }

        if (startDate > endDate) {
            notifications.show({
                title: 'Hibás időintervallum',
                message: 'A kezdő dátum nem lehet későbbi, mint a befejező dátum.',
                color: 'red',
            });
            setItems([]);
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.Cars.getAvailableCars(startDate, endDate);
            setItems(res.data);
        } catch (error: any) {
            notifications.show({
                title: 'Hiba',
                message: 'Nem sikerült betölteni az autókat.',
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
                color: 'green',
            });
        } catch (error: any) {
            console.error('Waiting list error:', error);

            if (error.response?.status === 400) {
                notifications.show({
                    title: 'Hiba',
                    message: error.response.data?.Message || error.response.data?.message || 'Az autó jelenleg szabad, nincs szükség várólistára.',
                    color: 'orange',
                });
            } else if (error.response?.status === 401) {
                notifications.show({
                    title: 'Hitelesítési hiba',
                    message: 'Kérlek, jelentkezz be a várólistára való feliratkozáshoz.',
                    color: 'red',
                });
            } else if (error.response?.status === 403) {
                notifications.show({
                    title: 'Hozzáférés megtagadva',
                    message: 'Vendég felhasználók nem iratkozhatnak fel várólistára.',
                    color: 'red',
                });
            } else if (error.response?.status === 404) {
                notifications.show({
                    title: 'Nem található',
                    message: 'Az autó nem található.',
                    color: 'red',
                });
            } else {
                notifications.show({
                    title: 'Hiba',
                    message: 'Váratlan hiba történt a várólistára való feliratkozás során.',
                    color: 'red',
                });
            }
        } finally {
            setIsWaitingListLoading(null);
        }
    };

    const openBookingModal = (carId: number) => {
        if (!startDate || !endDate) {
            notifications.show({
                title: 'Hiányzó dátumok',
                message: 'Kérlek, először válassz kezdő és befejező dátumot a kereséshez, mielőtt foglalnál.',
                color: 'orange',
            });
            return;
        }
        console.log("Cars.tsx: openBookingModal, átadott startDate:", startDate, "endDate:", endDate);
        setSelectedCarId(carId);
        setBookingOpen(true);
    };

    const dateFormat = 'YYYY.MM.DD';

    const handleStartDateChange = (dateString: string | null): void => {
        if (dateString) {
            const parsedDate = dayjs(dateString, dateFormat, 'hu').toDate();
            setStartDate(parsedDate);
            if (endDate && parsedDate > endDate) {
                setEndDate(null);
            }
        } else {
            setStartDate(null);
        }
    };

    const handleEndDateChange = (dateString: string | null): void => {
        if (dateString) {
            const parsedDate = dayjs(dateString, dateFormat, 'hu').toDate();
            setEndDate(parsedDate);
        } else {
            setEndDate(null);
        }
    };

    const renderStatusBadge = (status: CarAvailabilityStatus) => {
        switch (status) {
            case CarAvailabilityStatus.Available:
                return <Badge color="green">Elérhető</Badge>;
            case CarAvailabilityStatus.Rented:
                return <Badge color="red">Foglalt</Badge>;
            case CarAvailabilityStatus.NotProperCondition:
                return <Badge color="yellow">Hibás műszaki állapot</Badge>;
            case CarAvailabilityStatus.Deleted:
                return <Badge color="gray">Törölve</Badge>;
            default:
                return <Badge color="gray">Ismeretlen</Badge>;
        }
    };

    const rows = items.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>{element.brand}</Table.Td>
            <Table.Td>{element.model}</Table.Td>
            <Table.Td>{element.pricePerDay} Ft/nap</Table.Td>
            <Table.Td>{element.isAutomatic ? 'Automata' : 'Manuális'}</Table.Td>
            <Table.Td>{renderStatusBadge(element.status)}</Table.Td>
            <Table.Td>
                <Group gap="xs">
                    <Button
                        size="xs"
                        onClick={() => openBookingModal(element.id)}
                        disabled={element.status !== CarAvailabilityStatus.Available}
                    >
                        Foglalás
                    </Button>
                    <Button
                        size="xs"
                        onClick={() => handleAddToWaitingList(element.id)}
                        disabled={element.status === CarAvailabilityStatus.Available || element.status === CarAvailabilityStatus.NotProperCondition}
                        loading={isWaitingListLoading === element.id}
                    >
                        Feliratkozás
                    </Button>
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Card shadow="sm" padding="lg" radius="md" withBorder mb="lg">
                <Group grow>
                    <DatePickerInput
                        label="Bérlés kezdete"
                        placeholder="Válassz kezdő dátumot"
                        value={startDate ? dayjs(startDate).format(dateFormat) : null}
                        onChange={handleStartDateChange}
                        locale="hu"
                        valueFormat={dateFormat}
                        clearable
                        minDate={new Date()}
                    />
                    <DatePickerInput
                        label="Bérlés vége"
                        placeholder="Válassz befejező dátumot"
                        value={endDate ? dayjs(endDate).format(dateFormat) : null}
                        onChange={handleEndDateChange}
                        locale="hu"
                        valueFormat={dateFormat}
                        clearable
                        minDate={startDate ? dayjs(startDate).add(0, 'day').toDate() : new Date()}
                    />
                </Group>
                <Button onClick={fetchAllCarsWithAvailability} mt="md" loading={isLoading} disabled={!startDate || !endDate}>
                    Autók elérhetőségének ellenőrzése
                </Button>
            </Card>

            {items.length > 0 && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Márka</Table.Th>
                                <Table.Th>Modell</Table.Th>
                                <Table.Th>Ár</Table.Th>
                                <Table.Th>Váltó</Table.Th>
                                <Table.Th>Státusz</Table.Th>
                                <Table.Th>Műveletek</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Card>
            )}

            {!isLoading && startDate && endDate && items.length === 0 && (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Box ta="center" py="lg">
                        Nincsenek elérhető autók a megadott időintervallumban.
                    </Box>
                </Card>
            )}

            {selectedCarId !== null && (
                <BookingModal
                    carId={selectedCarId}
                    opened={bookingOpen}
                    onClose={() => {
                        setBookingOpen(false);
                        setSelectedCarId(null);
                    }}
                    initialStartDate={startDate}
                    initialEndDate={endDate}
                />
            )}
        </div>
    );
};

export default Cars;