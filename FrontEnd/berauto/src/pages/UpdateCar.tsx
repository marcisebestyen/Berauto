import React, { useState, useEffect, FormEvent } from 'react';
import api from '../api/api.ts';
import { ICar, FuelType, RequiredLicenceType } from '../interfaces/ICar';
import {
    Container, Title, Text, Stack, Card, Button, Modal, TextInput,
    NumberInput, Select, Checkbox, Group, Alert, Loader, List,
    ThemeIcon, Paper, Grid, LoadingOverlay
} from '@mantine/core';
import {
    IconAlertCircle, IconSettings, IconGasStation, IconLicense,
    IconCurrencyDollar, IconGauge, IconShieldCheck, IconCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';

interface JsonPatchOperation {
    op: "replace" | "add" | "remove";
    path: string;
    value?: any;
}

type CarPatchData = Partial<{ [K in keyof Omit<ICar, 'id'>]: ICar[K] | null }>;

const createPatchDocument = (originalCar: ICar, updatedFields: CarPatchData): JsonPatchOperation[] => {
    const patchDoc: JsonPatchOperation[] = [];
    for (const key in updatedFields) {
        if (Object.prototype.hasOwnProperty.call(updatedFields, key)) {
            const typedKey = key as keyof Omit<ICar, 'id'>;
            if (originalCar[typedKey] !== (updatedFields as CarPatchData)[typedKey]) {
                patchDoc.push({
                    op: "replace",
                    path: `/${typedKey}`,
                    value: (updatedFields as CarPatchData)[typedKey]
                });
            }
        }
    }
    return patchDoc;
};

function assignToCarPatchData<K extends keyof Omit<ICar, 'id'>>(
    patchData: CarPatchData,
    key: K,
    value: ICar[K] | null
) {
    patchData[key] = value;
}

const fuelTypesData: { value: FuelType; label: string }[] = [
    { value: "Diesel", label: "Dízel" },
    { value: "Petrol", label: "Benzin" },
    { value: "Hybrid", label: "Hibrid" },
    { value: "Electric", label: "Elektromos" },
];

const licenceTypesData: { value: RequiredLicenceType; label: string }[] = [
    { value: "AM", label: "AM" },
    { value: "A1", label: "A1" },
    { value: "A2", label: "A2" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
];

const getFuelTypeLabel = (fuelType: number): string => {
    switch (fuelType) {
        case 0: return 'Dízel';
        case 1: return 'Benzin';
        case 2: return 'Hibrid';
        case 3: return 'Elektromos';
        default: return 'Ismeretlen';
    }
}
const getLicenceTypeLabel = (licence: number): string => {
    switch (licence) {
        case 0: return 'AM';
        case 1: return 'A1';
        case 2: return 'A2';
        case 3: return 'A';
        case 4: return 'B';
        default: return 'Ismeretlen';
    }
}


const UpdateCar: React.FC = () => {
    const [cars, setCars] = useState<ICar[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [editingCar, setEditingCar] = useState<ICar | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Omit<ICar, 'id'>> & {
        pricePerKilometer?: number | '';
        actualKilometers?: number | '';
    }>({});

    useEffect(() => {
        fetchCars();
    }, []);

    const fetchCars = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await api.Cars.getAllCars();
            setCars(response.data);
        } catch (err) {
            console.error("Failed to fetch cars:", err);
            notifications.show({
                title: 'Hiba',
                message: 'Nem sikerült betölteni az autókat.',
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (car: ICar) => {
        setEditingCar(car);
        const { id, ...carDataForForm } = car;
        setFormData({
            ...carDataForForm,
            pricePerKilometer: carDataForForm.pricePerKilometer ?? '',
            actualKilometers: carDataForForm.actualKilometers ?? '',
        });
        setError(null);
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingCar(null);
        setFormData({});
        setError(null);
    };

    const handleFormInputChange = (name: keyof typeof formData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingCar) return;
        setIsSubmitting(true);
        setError(null);

        const changedValuesForPatch: CarPatchData = {};
        const formKeys = Object.keys(formData) as Array<keyof typeof formData>;

        for (const formKey of formKeys) {
            const carKey = formKey as keyof Omit<ICar, 'id'>;
            const formValue = formData[formKey];
            const originalCarValue = editingCar[carKey];

            let valueToPatch: ICar[typeof carKey] | null = null;

            if (carKey === 'pricePerKilometer' || carKey === 'actualKilometers') {
                const numFormValue = formValue as number | '';
                if (numFormValue === '' || numFormValue === null || numFormValue === undefined) {
                    valueToPatch = null;
                } else {
                    const parsedNum = parseFloat(String(numFormValue));
                    if (isNaN(parsedNum)) {
                        valueToPatch = null;
                    } else {
                        valueToPatch = parsedNum as number;
                    }
                }
            } else if (carKey === 'isAutomatic' || carKey === 'hasValidVignette') {
                if (formValue === null || formValue === undefined) {
                    valueToPatch = null;
                } else {
                    valueToPatch = Boolean(formValue) as ICar[typeof carKey];
                }
            } else {
                if (formValue === '' || formValue === null || formValue === undefined) {
                    valueToPatch = null;
                } else {
                    valueToPatch = formValue as ICar[typeof carKey];
                }
            }

            const comparableOriginalValue = (originalCarValue === undefined && !(carKey in editingCar)) ? null : originalCarValue;

            if (comparableOriginalValue !== valueToPatch) {
                assignToCarPatchData(changedValuesForPatch, carKey, valueToPatch);
            }
        }

        if (Object.keys(changedValuesForPatch).length === 0) {
            notifications.show({ title: 'Információ', message: 'Nincs érzékelt változás.', color: 'blue' });
            setIsSubmitting(false);
            return;
        }
        const patchDocument = createPatchDocument(editingCar, changedValuesForPatch);
        if (patchDocument.length === 0) {
            notifications.show({ title: 'Információ', message: 'Nincs generálandó módosítás (az értékek megegyeznek az eredetivel).', color: 'yellow' });
            setIsSubmitting(false);
            return;
        }
        try {
            await api.Cars.updateCar(editingCar.id, patchDocument);
            notifications.show({ title: 'Siker!', message: 'Autó sikeresen frissítve!', color: 'green', icon: <IconCheck /> });
            handleModalClose();
            fetchCars();
        } catch (err: any) {
            console.error("Failed to update car:", err);
            const errorMessage = err.response?.data?.message || err.message || `Hiba az autó frissítésekor: ${editingCar.brand} ${editingCar.model}.`;
            setError(errorMessage);
            notifications.show({ title: 'Hiba történt', message: errorMessage, color: 'red', icon: <IconAlertCircle /> });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading && !cars.length) {
        return <Container style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 200px)' }}><Loader size="xl" /></Container>;
    }

    return (
        <Container fluid p="md">
            <Title order={2} mb="xl" ta="center">Autók kezelése</Title>
            {cars.length === 0 && !isLoading && (
                <Paper p="xl" shadow="xs" ta="center"><Text>Nincsenek elérhető autók az adatbázisban.</Text></Paper>
            )}
            <Grid gutter="md">
                {cars.map(car => (
                    <Grid.Col key={car.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder style={{ height: '100%' }}>
                            <Stack justify="space-between" style={{ height: '100%' }}>
                                <div>
                                    <Title order={4}>{car.brand} {car.model}</Title>
                                    <Text c="dimmed" size="sm" mb="sm">{car.licencePlate}</Text>
                                    <List spacing={6} size="sm" center>
                                        <List.Item icon={<ThemeIcon color="teal" size={20} radius="xl"><IconGasStation size={12} /></ThemeIcon>}>
                                            Üzemanyag: {getFuelTypeLabel(parseInt(car.fuelType))}
                                        </List.Item>
                                        <List.Item icon={<ThemeIcon color="grape" size={20} radius="xl"><IconLicense size={12} /></ThemeIcon>}>
                                            Jogosítvány: {getLicenceTypeLabel(parseInt(car.requiredLicence))}
                                        </List.Item>
                                        <List.Item icon={<ThemeIcon color="orange" size={20} radius="xl"><IconCurrencyDollar size={12} /></ThemeIcon>}>
                                            Ár/km: {car.pricePerKilometer} Ft
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
                                <Button leftSection={<IconSettings size={16} />} variant="light" color="blue" fullWidth mt="md" onClick={() => handleEdit(car)}>
                                    Adatok módosítása
                                </Button>
                            </Stack>
                        </Card>
                    </Grid.Col>
                ))}
            </Grid>
            {editingCar && (
                <Modal
                    opened={isModalOpen} onClose={handleModalClose}
                    title={<Title order={3}>Autó szerkesztése: {editingCar.brand} {editingCar.model}</Title>}
                    size="lg" overlayProps={{ backgroundOpacity: 0.55, blur: 3 }} centered
                    closeOnClickOutside={!isSubmitting} withCloseButton={!isSubmitting}
                >
                    <LoadingOverlay visible={isSubmitting} zIndex={1000} overlayProps={{ blur: 2 }} />
                    <form onSubmit={handleSubmit}>
                        <Stack gap="md">
                            {error && (
                                <Alert icon={<IconAlertCircle size="1rem" />} title="Hiba!" color="red" withCloseButton onClose={() => setError(null)}>{error}</Alert>
                            )}
                            <TextInput label="Márka" placeholder="Pl. BMW" value={formData.brand || ''} onChange={(event) => handleFormInputChange('brand', event.currentTarget.value)} required disabled={isSubmitting} />
                            <TextInput label="Modell" placeholder="Pl. M3" value={formData.model || ''} onChange={(event) => handleFormInputChange('model', event.currentTarget.value)} required disabled={isSubmitting} />
                            <TextInput label="Rendszám" placeholder="Pl. ABC-123" value={formData.licencePlate || ''} onChange={(event) => handleFormInputChange('licencePlate', event.currentTarget.value)} required disabled={isSubmitting} />
                            <Select
                                label="Üzemanyag típus" placeholder="Válasszon típust" data={fuelTypesData}
                                value={formData.fuelType || null} onChange={(value) => handleFormInputChange('fuelType', value as FuelType | null)}
                                required searchable disabled={isSubmitting} allowDeselect={false}
                            />
                            <Select
                                label="Szükséges jogosítvány" placeholder="Válasszon kategóriát" data={licenceTypesData}
                                value={formData.requiredLicence || null} onChange={(value) => handleFormInputChange('requiredLicence', value as RequiredLicenceType | null)}
                                required searchable disabled={isSubmitting} allowDeselect={false}
                            />
                            <NumberInput
                                label="Ár per kilométer (Ft)" placeholder="Pl. 150" value={formData.pricePerKilometer ?? ''}
                                onChange={(value) => handleFormInputChange('pricePerKilometer', value)}
                                min={0} step={10} required disabled={isSubmitting}
                            />
                            <NumberInput
                                label="Jelenlegi kilométeróra állás" placeholder="Pl. 125000" value={formData.actualKilometers ?? ''}
                                onChange={(value) => handleFormInputChange('actualKilometers', value)}
                                min={0} required disabled={isSubmitting}
                            />
                            <Checkbox label="Automata váltó" checked={formData.isAutomatic || false} onChange={(event) => handleFormInputChange('isAutomatic', event.currentTarget.checked)} disabled={isSubmitting} />
                            <Checkbox label="Érvényes autópálya matrica" checked={formData.hasValidVignette || false} onChange={(event) => handleFormInputChange('hasValidVignette', event.currentTarget.checked)} disabled={isSubmitting} />
                            <Group justify="flex-end" mt="lg">
                                <Button variant="default" onClick={handleModalClose} disabled={isSubmitting}>Mégse</Button>
                                <Button type="submit" color="blue" loading={isSubmitting}>Mentés</Button>
                            </Group>
                        </Stack>
                    </form>
                </Modal>
            )}
        </Container>
    );
};

export default UpdateCar;