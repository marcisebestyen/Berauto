import { Badge, Button, Card, Group, Table } from "@mantine/core";
import { useEffect, useState } from "react";
import api from "../api/api.ts";
import { ICar } from "../interfaces/ICar.ts";
import useAuth from "../hooks/useAuth.tsx";
import { notifications } from "@mantine/notifications";

const Cars = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const { user } = useAuth();

    const fetchCars = async () => {
        try {
            const res = await api.Cars.getCars();
            setItems(res.data);
        } catch (error) {
            notifications.show({
                title: "Hiba",
                message: "Nem sikerült betölteni az autókat",
                color: "red",
            });
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const handleRent = async (carId: number) => {
        try {
            if (!user?.id) {
                throw new Error("A felhasználó nincs bejelentkezve.");
            }

            await api.Cars.updateCarAvailability(carId, false);

            notifications.show({
                title: "Sikeres foglalás",
                message: "Az autót sikeresen lefoglaltad",
                color: "green",
            });

            fetchCars();
        } catch (error: any) {
            notifications.show({
                title: "Hiba",
                message: error.message || "A foglalás sikertelen",
                color: "red",
            });
        }
    };

    const rows = items.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>{element.brand}</Table.Td>
            <Table.Td>{element.model}</Table.Td>
            <Table.Td>{element.price} Ft/nap</Table.Td>
            <Table.Td>
                <Group>
                    <Badge color={element.isAvailable ? "green" : "red"} variant="light">
                        {element.isAvailable ? "Elérhető" : "Foglalt"}
                    </Badge>
                    {element.isAvailable && (
                        <Button size="xs" onClick={() => handleRent(element.id)}>
                                    Foglalás
                        </Button>
                    )}
                </Group>
            </Table.Td>
        </Table.Tr>
    ));

    return (
        <div>
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Márka</Table.Th>
                            <Table.Th>Modell</Table.Th>
                            <Table.Th>Ár</Table.Th>
                            <Table.Th>Státusz</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Card>
        </div>
    );
};

export default Cars;
