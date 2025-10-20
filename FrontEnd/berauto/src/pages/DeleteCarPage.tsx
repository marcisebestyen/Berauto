import React, {useState, useEffect} from 'react';
import api from '../api/api';
import {ICar, FuelType, RequiredLicenceType} from '../interfaces/ICar';
import {
    Container,
    Title,
    Text,
    Stack,
    Card,
    Button,
    Modal,
    Alert,
    Paper,
    Grid,
    Group,
    Badge,
    ActionIcon,   // For refresh button
    Box,          // For loading overlay container
    Center,       // For empty/error states
    LoadingOverlay, // For a cleaner loading state
    SimpleGrid,   // For a compact stat display
    rem,
} from '@mantine/core';
import {
    IconAlertCircle,
    IconTrash,
    IconGasStation,
    IconLicense,
    IconCurrencyDollar,
    IconGauge,
    IconSettings,
    IconShieldCheck,
    IconCheck,
    IconRefresh,
    IconCarOff,
} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {useDisclosure} from '@mantine/hooks';

const getFuelTypeLabel = (fuelType: FuelType | string): string => {
    let typeStr = String(fuelType);
    if (typeof fuelType === 'number') {
        switch (fuelType) {
            case 0:
                typeStr = 'Diesel';
                break;
            case 1:
                typeStr = 'Petrol';
                break;
            case 2:
                typeStr = 'Hybrid';
                break;
            case 3:
                typeStr = 'Electric';
                break;
            default:
                typeStr = 'Ismeretlen';
        }
    }
    switch (typeStr) {
        case "Diesel":
            return 'Dízel';
        case "Petrol":
            return 'Benzin';
        case "Hybrid":
            return 'Hibrid';
        case "Electric":
            return 'Elektromos';
        default:
            return 'Ismeretlen';
    }
};
const getLicenceTypeLabel = (licence: RequiredLicenceType | string): string => {
    let typeStr = String(licence);
    if (typeof licence === 'number') {
        switch (licence) {
            case 0:
                typeStr = 'AM';
                break;
            case 1:
                typeStr = 'A1';
                break;
            case 2:
                typeStr = 'A2';
                break;
            case 3:
                typeStr = 'A';
                break;
            case 4:
                typeStr = 'B';
                break;
            default:
                typeStr = 'Ismeretlen';
        }
    }
    return typeStr;
};

const Stat = ({icon, label, value}: { icon: React.ReactNode, label: string, value: string }) => (
    <Group gap="xs">
        {icon}
        <Stack gap={0}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="sm">{value}</Text>
        </Stack>
    </Group>
);

const DeleteCarPage: React.FC = () => {
    const [cars, setCars] = useState<ICar[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [carToDelete, setCarToDelete] = useState<ICar | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [deleteModalOpened, {open: openDeleteModal, close: closeDeleteModal}] = useDisclosure(false);

    const fetchCars = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Cars.getAllCars();
            setCars(response.data);
        } catch (err) {
            const errorMsg = 'Nem sikerült betölteni az autókat a törléshez.';
            notifications.show({title: 'Hiba', message: errorMsg, color: 'red'});
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const handleDeleteClick = (car: ICar) => {
        if (car.isRented) {
            notifications.show({
                title: 'Törlési hiba',
                message: `Az autó nem törölhető, mert jelenleg ki van adva.`,
                color: 'orange'
            });
            return;
        }
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
                message: `A(z) ${carToDelete.brand} ${carToDelete.model} autó sikeresen törölve.`,
                color: 'green',
                icon: <IconCheck/>
            });
            fetchCars();
        } catch (err: any) {
            let errorMessage = `Hiba történt az autó törlésekor.`;
            if (err.response?.data?.message || err.response?.data?.title) {
                errorMessage = err.response.data.message || err.response.data.title;
            }
            notifications.show({title: 'Törlési hiba', message: errorMessage, color: 'red'});
        } finally {
            setIsDeleting(false);
            closeDeleteModal();
        }
    };

    const emptyState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconCarOff size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek autók a rendszerben</Title>
            <Text c="dimmed" size="sm" mt={4}>Nincs megjeleníthető autó az adatbázisban.</Text>
        </Center>
    );
    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%" maw={600}>
                {error}
                <Button color="red" variant="light" onClick={fetchCars} mt="md">
                    Próbálja újra
                </Button>
            </Alert>
        </Center>
    );

    const showGrid = !isLoading && !error && cars.length > 0;
    const showEmptyState = !isLoading && !error && cars.length === 0;
    const showErrorState = !isLoading && error;

    return (
        <Container fluid p="md">
            <Paper shadow="sm" p="lg" withBorder>
                <Group justify="space-between" mb="lg">
                    <Title order={3}>Autók törlése</Title>
                    <ActionIcon variant="light" onClick={fetchCars} loading={isLoading} aria-label="Autók frissítése">
                        <IconRefresh style={{width: rem(18)}}/>
                    </ActionIcon>
                </Group>

                <Box style={{position: 'relative', minHeight: '300px'}}>
                    <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

                    {showErrorState && errorState}
                    {showEmptyState && emptyState}

                    {showGrid && (
                        <Grid gutter="md">
                            {cars.map(car => (
                                <Grid.Col key={car.id} span={{base: 12, sm: 6, lg: 4}}>
                                    <Card shadow="sm" padding="lg" radius="md" withBorder
                                          style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                                        <Stack justify="space-between" style={{flexGrow: 1}}>
                                            <div>
                                                <Group justify="space-between" align="flex-start" mb="xs">
                                                    <Stack gap={0}>
                                                        <Title order={4}>{car.brand} {car.model}</Title>
                                                        <Text c="dimmed" size="sm">{car.licencePlate}</Text>
                                                    </Stack>
                                                    {car.isRented &&
                                                        <Badge color="blue" variant="light" size="sm">Bérelt</Badge>}
                                                </Group>

                                                <SimpleGrid cols={2} spacing="sm" mt="md" verticalSpacing="sm">
                                                    <Stat icon={<IconGasStation size={20}/>} label="Üzemanyag"
                                                          value={getFuelTypeLabel(car.fuelType)}/>
                                                    <Stat icon={<IconLicense size={20}/>} label="Jogosítvány"
                                                          value={getLicenceTypeLabel(car.requiredLicence)}/>
                                                    <Stat icon={<IconSettings size={20}/>} label="Váltó"
                                                          value={car.isAutomatic ? 'Automata' : 'Manuális'}/>
                                                    <Stat icon={<IconGauge size={20}/>} label="Km óra"
                                                          value={`${car.actualKilometers} km`}/>
                                                    <Stat icon={<IconShieldCheck size={20}/>} label="Matrica"
                                                          value={car.hasValidVignette ? 'Érvényes' : 'Nincs'}/>
                                                    <Stat icon={<IconCurrencyDollar size={20}/>} label="Ár/nap"
                                                          value={`${car.pricePerDay} Ft`}/>
                                                </SimpleGrid>
                                            </div>
                                            <Button
                                                leftSection={<IconTrash size={16}/>}
                                                color="red"
                                                fullWidth
                                                mt="lg"
                                                onClick={() => handleDeleteClick(car)}
                                                disabled={car.isRented}
                                            >
                                                {car.isRented ? 'Jelenleg bérelve' : 'Végleges törlés'}
                                            </Button>
                                        </Stack>
                                    </Card>
                                </Grid.Col>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Paper>

            {carToDelete && (
                <Modal opened={deleteModalOpened} onClose={closeDeleteModal} title="Törlés megerősítése" centered>
                    <Stack>
                        <Text>Biztosan véglegesen törölni szeretnéd a következő autót?</Text>
                        <Paper withBorder p="sm" radius="md" bg="var(--mantine-color-gray-0)">
                            <Title order={5}>{carToDelete.brand} {carToDelete.model}</Title>
                            <Text c="dimmed" size="sm">{carToDelete.licencePlate}</Text>
                        </Paper>
                        <Alert icon={<IconAlertCircle size="1rem"/>} title="Figyelem!" color="red" variant="light">
                            Ez a művelet nem visszavonható!
                        </Alert>
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeDeleteModal} disabled={isDeleting}>Mégsem</Button>
                            <Button color="red" onClick={confirmDelete} loading={isDeleting}
                                    leftSection={<IconTrash size={14}/>}>
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