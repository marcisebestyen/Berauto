import React, { useState, useEffect } from 'react';
import api from '../api/api'; // Ellenőrizd az import útvonalát
import { ICar, FuelType, RequiredLicenceType } from '../interfaces/ICar'; // Ellenőrizd az import útvonalát
import {
    Container, Title, Text, Stack, Card, Button, Modal,
    Alert, Loader, List, ThemeIcon, Paper, Grid, Group
} from '@mantine/core';
import {
    IconAlertCircle, IconTrash, IconGasStation, IconLicense,
    IconCurrencyDollar, IconGauge, IconSettings, IconShieldCheck, IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';

// Ezeket a segédfüggvényeket átveheted az UpdateCar oldalból vagy egy közös utility fájlból
const getFuelTypeLabel = (fuelType: FuelType | string): string => {
    // Ha a fuelType számként érkezik (enum index), konvertáljuk stringgé
    let typeStr = String(fuelType);
    if (typeof fuelType === 'number') {
        switch (fuelType) {
            case 0: typeStr = 'Diesel'; break;
            case 1: typeStr = 'Petrol'; break;
            case 2: typeStr = 'Hybrid'; break;
            case 3: typeStr = 'Electric'; break;
            default: typeStr = 'Ismeretlen';
        }
    }

    switch (typeStr) {
        case "Diesel": return 'Dízel';
        case "Petrol": return 'Benzin';
        case "Hybrid": return 'Hibrid';
        case "Electric": return 'Elektromos';
        default: return 'Ismeretlen';
    }
}

const getLicenceTypeLabel = (licence: RequiredLicenceType | string): string => {
    let typeStr = String(licence);
    if (typeof licence === 'number') {
        switch (licence) {
            case 0: typeStr = 'AM'; break;
            case 1: typeStr = 'A1'; break;
            case 2: typeStr = 'A2'; break;
            case 3: typeStr = 'A'; break;
            case 4: typeStr = 'B'; break;
            default: typeStr = 'Ismeretlen';
        }
    }
    return typeStr; // Az AM, A1, stb. már a label
}


const DeleteCarPage: React.FC = () => {
    const [cars, setCars] = useState<ICar[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [carToDelete, setCarToDelete] = useState<ICar | null>(null);
    const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        setIsLoading(true);
        try {
            const response = await api.Cars.getAllCars();
            setCars(response.data);
        } catch (err) {
            console.error("Failed to fetch cars:", err);
            notifications.show({
                title: 'Hiba',
                message: 'Nem sikerült betölteni az autókat a törléshez.',
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (car: ICar) => {
        setCarToDelete(car);
        openDeleteModal();
    };

    const confirmDelete = async () => {
        if (!carToDelete) return;

        setIsDeleting(true);
        try {
            await api.Cars.deleteCar(carToDelete.id);
            notifications.show({
                title: 'Sikeres törlés',
                message: `A(z) ${carToDelete.brand} ${carToDelete.model} (ID: ${carToDelete.id}) autó sikeresen törölve.`,
                color: 'green',
                icon: <IconCheck />,
            });
            fetchCars(); // Frissítjük a listát
        } catch (err: any) {
            console.error("Failed to delete car:", err);
            let errorMessage = `Hiba történt a(z) ${carToDelete.brand} ${carToDelete.model} autó törlésekor.`;
            if (err.response && err.response.data) {
                // Ha a backend ad specifikus hibaüzenetet (pl. 404 Not Found)
                errorMessage = typeof err.response.data === 'string' ? err.response.data : (err.response.data.message || err.response.data.title || errorMessage);
            } else if (err.message) {
                errorMessage = err.message;
            }
            notifications.show({
                title: 'Törlési hiba',
                message: errorMessage,
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
            setCarToDelete(null);
        }
    };

    if (isLoading && !cars.length) {
        return <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}><Loader size="xl" /></Container>;
    }

    return (
        <Container fluid p="md">
            <Title order={2} mb="xl" ta="center">Autók törlése</Title>
            {cars.length === 0 && !isLoading && (
                <Paper p="xl" shadow="xs" ta="center"><Text>Nincsenek törölhető autók az adatbázisban.</Text></Paper>
            )}
            <Grid gutter="md">
                {cars.map(car => (
                    <Grid.Col key={car.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                            <Stack justify="space-between" style={{ flexGrow: 1 }}>
                                <div>
                                    <Title order={4}>{car.brand} {car.model}</Title>
                                    <Text c="dimmed" size="sm" mb="sm">{car.licencePlate}</Text>
                                    <List spacing={6} size="sm" center>
                                        <List.Item icon={<ThemeIcon color="teal" size={20} radius="xl"><IconGasStation size={12} /></ThemeIcon>}>
                                            Üzemanyag: {getFuelTypeLabel(car.fuelType)}
                                        </List.Item>
                                        <List.Item icon={<ThemeIcon color="grape" size={20} radius="xl"><IconLicense size={12} /></ThemeIcon>}>
                                            Jogosítvány: {getLicenceTypeLabel(car.requiredLicence)}
                                        </List.Item>
                                        <List.Item icon={<ThemeIcon color="orange" size={20} radius="xl"><IconCurrencyDollar size={12} /></ThemeIcon>}>
                                            Ár/nap: {car.pricePerDay} Ft
                                        </List.Item>
                                        <List.Item icon={<ThemeIcon color="blue" size={20} radius="xl"><IconGauge size={12} /></ThemeIcon>}>
                                            Km óra: {car.actualKilometers} km
                                        </List.Item>
                                        <List.Item icon={<ThemeIcon color={car.isAutomatic ? "cyan" : "gray"} size={20} radius="xl"><IconSettings size={12} /></ThemeIcon>}>
                                            Váltó: {car.isAutomatic ? 'Automata' : 'Manuális'}
                                        </List.Item>
                                        <List.Item icon={<ThemeIcon color={car.hasValidVignette ? "green" : "red"} size={20} radius="xl"><IconShieldCheck size={12} /></ThemeIcon>}>
                                            Matrica: {car.hasValidVignette ? 'Érvényes' : 'Nincs/Lejárt'}
                                        </List.Item>
                                    </List>
                                </div>
                                <Button
                                    leftSection={<IconTrash size={16} />}
                                    variant="filled"
                                    color="red"
                                    fullWidth
                                    mt="md"
                                    onClick={() => handleDeleteClick(car)}
                                    loading={isDeleting && carToDelete?.id === car.id}
                                >
                                    Autó törlése
                                </Button>
                            </Stack>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>

            {carToDelete && (
                <Modal
                    opened={deleteModalOpened}
                    onClose={closeDeleteModal}
                    title={<Title order={3}>Törlés megerősítése</Title>}
                    centered
                    overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
                >
                    <Stack>
                        <Text>Biztosan törölni szeretnéd a következő autót?</Text>
                        <Text fw={700}>{carToDelete.brand} {carToDelete.model} ({carToDelete.licencePlate})</Text>
                        <Alert icon={<IconAlertCircle size="1rem" />} title="Figyelem!" color="red" variant="light">
                            Ez a művelet nem visszavonható!
                        </Alert>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeDeleteModal} disabled={isDeleting}>Mégsem</Button>
                            <Button color="red" onClick={confirmDelete} loading={isDeleting} leftSection={<IconTrash size={14}/>}>
                                Törlés
                            </Button>
                        </Group>
                    </Stack>
                </Modal>
            )}
        </Container>
    );
};

export default DeleteCarPage;
