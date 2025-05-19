import {
    Button,
    Card,
    Group,
    Table,
    Box,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useState } from 'react'; // useEffect itt nem volt használva, kivettem
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/hu';

import api from '../api/api.ts';
import { ICar } from '../interfaces/ICar.ts';
import useAuth from '../hooks/useAuth.tsx'; // useAuth importálása
import { notifications } from '@mantine/notifications';
import BookingModal from '../modals/BookingModal'; // BookingModal importálása

dayjs.extend(customParseFormat);
dayjs.locale('hu');

const Cars = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [bookingOpen, setBookingOpen] = useState(false);
    const { user } = useAuth(); // <-- JAVÍTVA: user objektum kinyerése

    const fetchAvailableCars = async () => {
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
            // Feltételezve, hogy az api.ts Date objektumokat vár és belül kezeli a formázást:
            const res = await api.Cars.getAvailableCars(startDate, endDate);
            setItems(res.data);
        } catch (error: any) {
            notifications.show({
                title: 'Hiba',
                message: 'Nem sikerült betölteni az autókat.', // Általánosabb hibaüzenet
                color: 'red',
            });
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const openBookingModal = (carId: number) => {
        console.log("Cars.tsx: openBookingModal, user állapota itt:", user); // Logoljuk a user állapotát a modal nyitásakor
        setSelectedCarId(carId);
        setBookingOpen(true);
    };

    const dateFormat = 'YYYY.MM.DD';

    const handleStartDateChange = (dateString: string | null): void => {
        if (dateString) {
            const parsedDate = dayjs(dateString, dateFormat, 'hu').toDate();
            setStartDate(parsedDate);
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

    const rows = items.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>{element.brand}</Table.Td>
            <Table.Td>{element.model}</Table.Td>
            <Table.Td>{element.pricePerKilometer} Ft/km</Table.Td>
            <Table.Td>{element.isAutomatic ? 'Automata' : 'Manuális'}</Table.Td>
            <Table.Td>
                {/* A gomb mindig látszik, a kérésednek megfelelően */}
                <Button size="xs" onClick={() => openBookingModal(element.id)}>
                    Foglalás
                </Button>
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
                    />
                    <DatePickerInput
                        label="Bérlés vége"
                        placeholder="Válassz befejező dátumot"
                        value={endDate ? dayjs(endDate).format(dateFormat) : null}
                        onChange={handleEndDateChange}
                        locale="hu"
                        valueFormat={dateFormat}
                        clearable
                        minDate={startDate || undefined} // MinDate beállítása a startDate alapján
                    />
                </Group>
                <Button onClick={fetchAvailableCars} mt="md" loading={isLoading} disabled={!startDate || !endDate}>
                    Elérhető autók keresése
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
                        // Opcionális: frissíthetjük az autók listáját a modal bezárása után,
                        // ha a foglalás befolyásolhatja az elérhetőséget a listában.
                        // fetchAvailableCars(); // Ezt csak akkor, ha releváns
                    }}
                />
            )}
        </div>
    );
};

export default Cars;
