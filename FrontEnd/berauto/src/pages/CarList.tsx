import {
    Button,
    Card,
    Table,
    Box,

} from '@mantine/core';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../api/api.ts';
import { ICar } from '../interfaces/ICar.ts';
import { notifications } from '@mantine/notifications';


const CarListPage = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAllCars = async () => {
            setIsLoading(true);
            try {
                const res = await api.Cars.getAllCars();
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

        fetchAllCars();
    }, []);

    const navigateToCarDetails = (carId: number) => {
        navigate(`/admin/cars/${carId}`);
    };

    const rows = items.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>{element.brand}</Table.Td>
            <Table.Td>{element.model}</Table.Td>
            <Table.Td>{element.licencePlate}  </Table.Td>
            <Table.Td>{element.isAutomatic ? 'Automata' : 'Manuális'}</Table.Td>
            <Table.Td>
                <Button
                    size="xs"
                    onClick={() => navigateToCarDetails(element.id)}
                >
                    Adatlap megtekintése
                </Button>
            </Table.Td>
        </Table.Tr>
    ));


    return (
        <div>
            {isLoading ? (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Box ta="center" py="lg">
                        Autók betöltése...
                    </Box>
                </Card>
            ) : items.length > 0 ? (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Table>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Márka</Table.Th>
                                <Table.Th>Modell</Table.Th>
                                <Table.Th>Rendszám</Table.Th>
                                <Table.Th>Váltó</Table.Th>
                                <Table.Th>Műveletek</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>{rows}</Table.Tbody>
                    </Table>
                </Card>
            ) : (
                <Card shadow="sm" padding="lg" radius="md" withBorder>
                    <Box ta="center" py="lg">
                        Nincsenek autók a rendszerben.
                    </Box>
                </Card>
            )}
        </div>
    );
};

export default CarListPage;