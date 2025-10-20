import React, {useState, useEffect} from 'react';
import api from '../api/api.ts';
import {ICar} from '../interfaces/ICar.ts';
import {
    Container, Title, Text, Stack, Card, Button, Modal, TextInput,
    NumberInput, Select, Checkbox, Group, Alert, Paper, Grid,
    LoadingOverlay, ActionIcon, Box, Center, SimpleGrid,
    rem,
} from '@mantine/core';
import {
    IconAlertCircle, IconSettings, IconGasStation, IconLicense,
    IconCurrencyDollar, IconGauge, IconShieldCheck, IconCheck,
    IconRefresh, IconCarOff, IconDeviceFloppy,
} from '@tabler/icons-react';
import {notifications} from '@mantine/notifications';
import {useDisclosure} from '@mantine/hooks';
import {useForm} from '@mantine/form';

interface JsonPatchOperation {
    op: "replace";
    path: string;
    value?: any;
}

type CarPatchData = Partial<Omit<ICar, 'id'>>;

const fuelTypesData = [
    {value: "Diesel", label: "Dízel"},
    {value: "Petrol", label: "Benzin"},
    {value: "Hybrid", label: "Hibrid"},
    {value: "Electric", label: "Elektromos"},
];

const licenceTypesData = [
    {value: "AM", label: "AM"}, {value: "A1", label: "A1"},
    {value: "A2", label: "A2"}, {value: "A", label: "A"}, {value: "B", label: "B"},
];

const Stat = ({icon, label, value}: { icon: React.ReactNode, label: string, value: string | React.ReactNode }) => (
    <Group gap="xs">
        {icon}
        <Stack gap={0}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="sm">{value}</Text>
        </Stack>
    </Group>
);

const UpdateCar: React.FC = () => {
    const [cars, setCars] = useState<ICar[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [editingCar, setEditingCar] = useState<ICar | null>(null);
    const [modalOpened, {open: openModal, close: closeModal}] = useDisclosure(false);

    const form = useForm<CarPatchData>({
        initialValues: {
            brand: '', model: '', licencePlate: '', fuelType: 'Petrol', requiredLicence: 'B',
            pricePerDay: 0, actualKilometers: 0, isAutomatic: false, hasValidVignette: true,
        },
        validate: {
            brand: (val) => (val && val.trim().length > 0 ? null : 'Márka megadása kötelező'),
            model: (val) => (val && val.trim().length > 0 ? null : 'Modell megadása kötelező'),
            licencePlate: (val) => (val && val.trim().length > 0 ? null : 'Rendszám megadása kötelező'),
            pricePerDay: (val) => (val !== null && val !== undefined && val >= 0 ? null : 'Az ár nem lehet negatív'),
            actualKilometers: (val) => (val !== null && val !== undefined && val >= 0 ? null : 'A kilométer nem lehet negatív'),
        }
    });

    const fetchCars = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Cars.getAllCars();
            setCars(response.data);
        } catch (err) {
            setError('Nem sikerült betölteni az autókat.');
            notifications.show({title: 'Hiba', message: 'Nem sikerült betölteni az autókat.', color: 'red'});
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCars();
    }, []);

    const handleEditClick = (car: ICar) => {
        setEditingCar(car);
        form.setValues(car);
        form.reset();
        openModal();
    };

    const handleFormSubmit = async (values: CarPatchData) => {
        if (!editingCar) return;

        const patchDocument: JsonPatchOperation[] = [];
        for (const key in form.values) {
            if (form.isDirty(key)) {
                patchDocument.push({
                    op: "replace",
                    path: `/${key.charAt(0).toUpperCase() + key.slice(1)}`,
                    value: values[key as keyof CarPatchData]
                });
            }
        }

        if (patchDocument.length === 0) {
            notifications.show({title: 'Információ', message: 'Nincs menteni való változás.', color: 'blue'});
            return;
        }

        setIsSubmitting(true);
        try {
            await api.Cars.updateCar(editingCar.id, patchDocument);
            notifications.show({
                title: 'Siker!',
                message: 'Az autó adatai frissültek.',
                color: 'green',
                icon: <IconCheck/>
            });
            closeModal();
            fetchCars();
        } catch (err: any) {
            notifications.show({
                title: 'Hiba',
                message: err.response?.data?.message || 'Hiba történt a mentés során.',
                color: 'red'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const emptyState = <Center p="xl" style={{flexDirection: 'column'}}> <IconCarOff size={48} stroke={1.5}
                                                                                     style={{opacity: 0.5}}/> <Title
        order={4} mt="md" fw={500}>Nincsenek autók a rendszerben</Title> <Text c="dimmed" size="sm" mt={4}>Még nem
        rögzített egyetlen autót sem.</Text> </Center>;
    const errorState = <Center p="xl"> <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red"
                                              radius="md" w="100%" maw={600}> {error} <Button color="red"
                                                                                              variant="light"
                                                                                              onClick={fetchCars}
                                                                                              mt="md"> Próbálja
        újra </Button> </Alert> </Center>;

    const showGrid = !isLoading && !error && cars.length > 0;
    const showEmptyState = !isLoading && !error && cars.length === 0;
    const showErrorState = !isLoading && error;

    return (
        <Container fluid p="md">
            <Paper shadow="sm" p="lg" withBorder>
                <Group justify="space-between" mb="lg">
                    <Title order={3}>Autók Módosítása</Title>
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
                                                <Title order={4}>{car.brand} {car.model}</Title>
                                                <Text c="dimmed" size="sm">{car.licencePlate}</Text>
                                                <SimpleGrid cols={2} spacing="sm" mt="md" verticalSpacing="sm">
                                                    <Stat icon={<IconGasStation size={20}/>} label="Üzemanyag"
                                                          value={fuelTypesData.find(f => f.value === car.fuelType)?.label ?? car.fuelType}/>
                                                    <Stat icon={<IconLicense size={20}/>} label="Jogosítvány"
                                                          value={car.requiredLicence}/>
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
                                            <Button leftSection={<IconSettings size={16}/>} variant="light" color="blue"
                                                    fullWidth mt="lg" onClick={() => handleEditClick(car)}>
                                                Adatok módosítása
                                            </Button>
                                        </Stack>
                                    </Card>
                                </Grid.Col>
                            ))}
                        </Grid>
                    )}
                </Box>
            </Paper>

            <Modal opened={modalOpened} onClose={closeModal}
                   title={`Szerkesztés: ${editingCar?.brand} ${editingCar?.model}`} size="lg" centered>
                <LoadingOverlay visible={isSubmitting}/>
                <form onSubmit={form.onSubmit(handleFormSubmit)}>
                    <Stack>
                        <Grid>
                            <Grid.Col span={{base: 12, sm: 6}}><TextInput withAsterisk
                                                                          label="Márka" {...form.getInputProps('brand')} /></Grid.Col>
                            <Grid.Col span={{base: 12, sm: 6}}><TextInput withAsterisk
                                                                          label="Modell" {...form.getInputProps('model')} /></Grid.Col>
                        </Grid>
                        <TextInput withAsterisk label="Rendszám" {...form.getInputProps('licencePlate')} />
                        <Select withAsterisk label="Üzemanyag típus"
                                data={fuelTypesData} {...form.getInputProps('fuelType')} />
                        <Select withAsterisk label="Szükséges jogosítvány"
                                data={licenceTypesData} {...form.getInputProps('requiredLicence')} />
                        <NumberInput withAsterisk label="Ár / nap (Ft)" {...form.getInputProps('pricePerDay')} min={0}
                                     thousandSeparator=" "/>
                        <NumberInput withAsterisk
                                     label="Jelenlegi kilométeróra" {...form.getInputProps('actualKilometers')} min={0}
                                     thousandSeparator=" "/>
                        <Checkbox label="Automata váltó" {...form.getInputProps('isAutomatic', {type: 'checkbox'})} />
                        <Checkbox
                            label="Érvényes autópálya matrica" {...form.getInputProps('hasValidVignette', {type: 'checkbox'})} />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeModal} disabled={isSubmitting}>Mégse</Button>
                            <Button type="submit" loading={isSubmitting}
                                    leftSection={<IconDeviceFloppy size={16}/>}>Mentés</Button>
                        </Group>
                    </Stack>
                </form>
            </Modal>
        </Container>
    );
};

export default UpdateCar;