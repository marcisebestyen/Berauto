import {Button, Card, Group, Table, Box } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useState } from "react"; // useEffect itt nem volt használva, kivettem az importból, ha máshol sem kell
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/hu';

import api from "../api/api.ts";
import { ICar } from "../interfaces/ICar.ts";
import useAuth from "../hooks/useAuth.tsx";
import { notifications } from "@mantine/notifications";

dayjs.extend(customParseFormat);
dayjs.locale('hu');

const Cars = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { user } = useAuth(); // A user objektumot továbbra is használjuk a handleRent-ben

    // Az useEffect a dayjs.locale('hu') beállítására már nem szükséges itt,
    // ha globálisan megtörtént a dayjs import után. Az előző kódban már nem volt aktív.

    const fetchAvailableCars = async () => {
        if (!startDate || !endDate) {
            notifications.show({
                title: "Hiányzó dátumok",
                message: "Kérlek, add meg a kezdő és befejező dátumot a kereséshez.",
                color: "yellow",
            });
            setItems([]);
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalizáljuk a mai nap kezdetére (éjfél)

        if (startDate < today) { // Feltéve, hogy a startDate is éjfélre van normalizálva a DatePickerInput által
            notifications.show({
                title: "Hibás kezdő dátum",
                message: "A bérlés kezdő dátuma nem lehet korábbi a mai napnál.",
                color: "red",
            });
            setItems([]); // Vagy ne ürítsd, csak ne engedd a keresést
            return;
        }

        if (startDate > endDate) {
            notifications.show({
                title: "Hibás időintervallum",
                message: "A kezdő dátum nem lehet későbbi, mint a befejező dátum.",
                color: "red",
            });
            setItems([]);
            return;
        }

        setIsLoading(true);
        try {
            // Feltéve, hogy az api.ts Date objektumokat vár és belül kezeli a formázást:
            const res = await api.Cars.getAvailableCars(startDate, endDate);

            console.log("API válasz sikeres:", res.data);
            setItems(res.data);
        } catch (error: any) {
            console.error("Hiba az autók lekérdezése közben:", error);
            let errorMessage = "Nem sikerült betölteni az elérhető autókat a megadott időszakra.";
            if (error.response) {
                console.error("Hiba adatok (response.data):", error.response.data);
                console.error("Hiba státusz (response.status):", error.response.status);
                if (error.response.data && typeof error.response.data.message === 'string') {
                    errorMessage = error.response.data.message;
                } else if (typeof error.response.data === 'string' && error.response.data.length < 150) {
                    errorMessage = error.response.data;
                }
            } else if (error.request) {
                console.error("Hiba kérés (error.request):", error.request);
                errorMessage = "Nem érkezett válasz a szerverről. Ellenőrizd a hálózati kapcsolatot és a szerver állapotát.";
            } else {
                console.error("Hiba üzenet (error.message):", error.message);
                if (error.message) {
                    errorMessage = error.message;
                }
            }
            notifications.show({
                title: "Hiba",
                message: errorMessage,
                color: "red",
            });
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRent = async (carId: number) => {
        try {
            if (!user?.id) { // Ez az ellenőrzés továbbra is fontos!
                notifications.show({
                    title: "Hiba",
                    message: "A foglaláshoz bejelentkezés szükséges.",
                    color: "red",
                });
                return;
            }
            await api.Cars.updateCarAvailability(carId, false);
            notifications.show({
                title: "Sikeres foglalás (állapotváltás)",
                message: "Az autó státusza 'foglalt'-ra változott.",
                color: "green",
            });
            fetchAvailableCars(); // Frissítjük a listát
        } catch (error: any) {
            notifications.show({
                title: "Foglalási hiba",
                message: error.response?.data?.message || error.message || "A foglalás (státuszváltás) sikertelen.",
                color: "red",
            });
        }
    };

    const dateFormat = "YYYY.MM.DD";

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
            <Table.Td>{element.isAutomatic ? "Automata" : "Manuális"}</Table.Td>
            <Table.Td> {/* Műveletek oszlop */}
                {/* A '{user &&' feltételt eltávolítottuk innen */}
                <Button size="xs" onClick={() => handleRent(element.id)}>
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
                    <Box ta="center" py="lg">Nincsenek elérhető autók a megadott időintervallumban.</Box>
                </Card>
            )}
        </div>
    );
};

export default Cars;