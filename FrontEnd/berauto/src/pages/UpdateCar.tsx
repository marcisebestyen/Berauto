import React, {useState, useEffect} from 'react';
import api from '../api/api.ts';
import {ICar} from '../interfaces/ICar.ts';
import {
    Container, Title, Text, Stack, Card, Button, Modal, TextInput,
    NumberInput, Select, Checkbox, Group, Alert, Paper, Grid,
    LoadingOverlay, ActionIcon, Box, Center, SimpleGrid,
    rem, ThemeIcon, Divider,
} from '@mantine/core';
import {
    IconAlertCircle, IconSettings, IconGasStation, IconLicense,
    IconCurrencyDollar, IconGauge, IconShieldCheck, IconCheck,
    IconRefresh, IconCarOff, IconDeviceFloppy, IconCar,
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
            <Text size="sm" fw={500}>{value}</Text>
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
        form.resetDirty();
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
            await fetchCars();
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

    const emptyState = (
        <Center py={60} style={{flexDirection: 'column'}}>
            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="md">
                <IconCarOff size={40} stroke={1.5}/>
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek autók a rendszerben</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Még nem rögzített egyetlen autót sem.
            </Text>
        </Center>
    );

    const errorState = (
        <Center py={60}>
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
        <Container size="xl" my="xl">
            <Stack gap="xl">
                <Box>
                    <Group justify="space-between" align="flex-start">
                        <Box>
                            <Title order={1} size="h2" fw={900} style={{
                                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '0.5rem',
                            }}>
                                Autók Módosítása
                            </Title>
                            <Text c="dimmed" size="sm">Autók adatainak szerkesztése</Text>
                        </Box>
                        <ActionIcon
                            variant="light"
                            size="xl"
                            color="blue"
                            onClick={fetchCars}
                            loading={isLoading}
                            aria-label="Autók frissítése"
                        >
                            <IconRefresh style={{width: rem(24)}}/>
                        </ActionIcon>
                    </Group>
                </Box>

                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Box style={{position: 'relative', minHeight: '300px'}}>
                        <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>
                        {showErrorState && errorState}
                        {showEmptyState && emptyState}
                        {showGrid && (
                            <>
                                <Group gap="sm" mb="xl">
                                    <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                        <IconCar size={28}/>
                                    </ThemeIcon>
                                    <Box>
                                        <Title order={3} size="h4">Autók Listája</Title>
                                        <Text size="sm" c="dimmed">{cars.length} autó a rendszerben</Text>
                                    </Box>
                                </Group>

                                <Divider mb="xl" opacity={0.1} />

                                <Grid gutter="md">
                                    {cars.map(car => (
                                        <Grid.Col key={car.id} span={{base: 12, sm: 6, lg: 4}}>
                                            <Card
                                                shadow="sm"
                                                padding="lg"
                                                radius="md"
                                                withBorder
                                                style={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    background: 'rgba(15, 23, 42, 0.4)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }}
                                            >
                                                <Stack justify="space-between" style={{flexGrow: 1}}>
                                                    <div>
                                                        <Title order={4} fw={700}>{car.brand} {car.model}</Title>
                                                        <Text c="dimmed" size="sm">{car.licencePlate}</Text>

                                                        <Divider my="sm" opacity={0.1} />

                                                        <SimpleGrid cols={2} spacing="sm" mt="md" verticalSpacing="sm">
                                                            <Stat
                                                                icon={<IconGasStation size={18} style={{opacity: 0.7}}/>}
                                                                label="Üzemanyag"
                                                                value={fuelTypesData.find(f => f.value === car.fuelType)?.label ?? car.fuelType}
                                                            />
                                                            <Stat
                                                                icon={<IconLicense size={18} style={{opacity: 0.7}}/>}
                                                                label="Jogosítvány"
                                                                value={car.requiredLicence}
                                                            />
                                                            <Stat
                                                                icon={<IconSettings size={18} style={{opacity: 0.7}}/>}
                                                                label="Váltó"
                                                                value={car.isAutomatic ? 'Automata' : 'Manuális'}
                                                            />
                                                            <Stat
                                                                icon={<IconGauge size={18} style={{opacity: 0.7}}/>}
                                                                label="Km óra"
                                                                value={`${car.actualKilometers.toLocaleString('hu-HU')} km`}
                                                            />
                                                            <Stat
                                                                icon={<IconShieldCheck size={18} style={{opacity: 0.7}}/>}
                                                                label="Matrica"
                                                                value={car.hasValidVignette ? 'Érvényes' : 'Nincs'}
                                                            />
                                                            <Stat
                                                                icon={<IconCurrencyDollar size={18} style={{opacity: 0.7}}/>}
                                                                label="Ár/nap"
                                                                value={`${car.pricePerDay.toLocaleString('hu-HU')} Ft`}
                                                            />
                                                        </SimpleGrid>
                                                    </div>
                                                    <Button
                                                        leftSection={<IconSettings size={16}/>}
                                                        variant="light"
                                                        color="blue"
                                                        fullWidth
                                                        mt="lg"
                                                        onClick={() => handleEditClick(car)}
                                                    >
                                                        Adatok módosítása
                                                    </Button>
                                                </Stack>
                                            </Card>
                                        </Grid.Col>
                                    ))}
                                </Grid>
                            </>
                        )}
                    </Box>
                </Paper>
            </Stack>

            <Modal opened={modalOpened} onClose={closeModal}
                   title={`Szerkesztés: ${editingCar?.brand} ${editingCar?.model}`} size="lg" centered>
                <LoadingOverlay visible={isSubmitting}/>
                <Box component="form" onSubmit={form.onSubmit(handleFormSubmit)}>
                    <Stack>
                        <Grid>
                            <Grid.Col span={{base: 12, sm: 6}}>
                                <TextInput withAsterisk label="Márka" {...form.getInputProps('brand')} />
                            </Grid.Col>
                            <Grid.Col span={{base: 12, sm: 6}}>
                                <TextInput withAsterisk label="Modell" {...form.getInputProps('model')} />
                            </Grid.Col>
                        </Grid>
                        <TextInput withAsterisk label="Rendszám" {...form.getInputProps('licencePlate')} />
                        <Select
                            withAsterisk
                            label="Üzemanyag típus"
                            data={fuelTypesData}
                            {...form.getInputProps('fuelType')}
                        />
                        <Select
                            withAsterisk
                            label="Szükséges jogosítvány"
                            data={licenceTypesData}
                            {...form.getInputProps('requiredLicence')}
                        />
                        <NumberInput
                            withAsterisk
                            label="Ár / nap (Ft)"
                            {...form.getInputProps('pricePerDay')}
                            min={0}
                            thousandSeparator=" "
                        />
                        <NumberInput
                            withAsterisk
                            label="Jelenlegi kilométeróra"
                            {...form.getInputProps('actualKilometers')}
                            min={0}
                            thousandSeparator=" "
                        />
                        <Checkbox
                            label="Automata váltó"
                            {...form.getInputProps('isAutomatic', {type: 'checkbox'})}
                        />
                        <Checkbox
                            label="Érvényes autópálya matrica"
                            {...form.getInputProps('hasValidVignette', {type: 'checkbox'})}
                        />
                        <Group justify="flex-end" mt="md">
                            <Button variant="default" onClick={closeModal} disabled={isSubmitting}>Mégse</Button>
                            <Button type="submit" loading={isSubmitting}
                                    leftSection={<IconDeviceFloppy size={16}/>}>Mentés</Button>
                        </Group>
                    </Stack>
                </Box>
            </Modal>
        </Container>
    );
};

export default UpdateCar;