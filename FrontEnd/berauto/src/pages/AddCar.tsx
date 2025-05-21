import React, { useState, FormEvent } from 'react';
import {
    TextInput,
    NumberInput,
    Button,
    Paper,
    Title,
    Stack,
    Checkbox,
    Group,
    Select,
    Text
} from '@mantine/core';
import {CarFormData} from "../interfaces/ICar.ts";
import api from "../api/api.ts";

const fuelTypeOptions = [
    { value: 'Diesel', label: 'Dízel' },
    { value: 'Petrol', label: 'Benzin' },
    { value: 'Hybrid', label: 'Hibrid' },
    { value: 'Electric', label: 'Elektromos' },
];

const requiredLicenceOptions = [
    { value: 'AM', label: 'AM' },
    { value: 'A1', label: 'A1' },
    { value: 'A2', label: 'A2' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
];

const AddCarPage = () => {
    const [formData, setFormData] = useState<CarFormData>({
        Brand: '',
        Model: '',
        FuelType: '',
        RequiredLicence: '',
        LicencePlate: '',
        HasValidVignette: true,
        PricePerDay: '',
        IsAutomatic: false,
        ActualKilometers: '',
        InProperCondition: true,
    });

    const [error, setError] = useState<string | string[]>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSelectChange = (name: keyof CarFormData, value: string | null) => {
        setFormData(prevData => ({
            ...prevData,
            [name]: value || '',
        }));
    };

    const handleNumberChange = (name: keyof CarFormData, value: string | number) => {
        let processedValue: number | '';
        if (typeof value === 'string') {
            if (value === '') {
                processedValue = '';
            } else {
                const num = parseFloat(value);
                processedValue = isNaN(num) ? '' : num;
            }
        } else {
            processedValue = value;
        }
        setFormData(prevData => ({
            ...prevData,
            [name]: processedValue,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        if (!formData.Brand || !formData.Model || !formData.FuelType || !formData.RequiredLicence || !formData.LicencePlate || formData.PricePerDay === '' || formData.ActualKilometers === '') {
            setError('Minden csillaggal jelölt mező kitöltése kötelező.');
            setIsLoading(false);
            return;
        }
        if (Number(formData.PricePerDay) <= 0) {
            setError('A kilométerenkénti árnak pozitívnak kell lennie.');
            setIsLoading(false);
            return;
        }
        if (Number(formData.ActualKilometers) < 0) {
            setError('A futott kilométer nem lehet negatív.');
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
            };
            const createdCar = await api.Cars.createCar(payload);

            setSuccessMessage(`Az autó sikeresen hozzáadva! Azonosító: ${createdCar.id}`);
            setFormData({
                Brand: '', Model: '', FuelType: '', RequiredLicence: '', LicencePlate: '',
                HasValidVignette: true, PricePerDay: '', IsAutomatic: false,
                ActualKilometers: '', InProperCondition: true,
            });

        } catch (err: any) {
            console.error("Autó hozzáadása API hiba:", err);
            // Hibakezelés az axios válasz alapján (err.response.data)
            if (err.response && err.response.data) {
                const responseData = err.response.data;
                if (responseData.errors) {
                    const modelErrors = Object.values(responseData.errors).flat() as string[];
                    setError(modelErrors.length > 0 ? modelErrors : ['Érvénytelen bemeneti adatok.']);
                } else if (responseData.title && responseData.status) {
                    setError(`${responseData.title} (Státusz: ${responseData.status})`);
                } else if (responseData.Message || responseData.message) { // Kis-nagybetűs Message/message
                    setError(responseData.Message || responseData.message);
                } else {
                    setError(`Hiba történt a szerveroldalon: ${err.response.statusText} (Státusz: ${err.response.status})`);
                }
            } else {
                setError('Ismeretlen hiba történt a kapcsolat során. Kérjük, próbáld újra később.');
            }
        } finally {
            setIsLoading(false);
        }
    }

    const renderErrorMessages = () => {
        if (!error) return null;
        const messages = Array.isArray(error) ? error : [error];
        return (
            <Stack gap="xs" my="md">
                {messages.map((err, index) => (
                    <Text key={index} c="red" size="sm">{err}</Text>
                ))}
            </Stack>
        );
    };

    return (
        <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{maxWidth: 700, margin: 'auto'}}>
            <Title order={2} ta="center" mb="xl">Új autó felvétele</Title>
            <form onSubmit={handleSubmit}>
                <Stack>
                    <TextInput label="Márka" name="Brand" value={formData.Brand} onChange={handleChange} required withAsterisk disabled={isLoading} />
                    <TextInput label="Modell" name="Model" value={formData.Model} onChange={handleChange} required withAsterisk disabled={isLoading} />
                    <Select
                        label="Üzemanyag típus"
                        name="FuelType"
                        placeholder="Válassz üzemanyag típust"
                        data={fuelTypeOptions}
                        value={formData.FuelType}
                        onChange={(value) => handleSelectChange('FuelType', value)}
                        required
                        withAsterisk
                        disabled={isLoading}
                        clearable
                    />
                    <Select
                        label="Szükséges jogosítvány kategória"
                        name="RequiredLicence"
                        placeholder="Válassz kategóriát"
                        data={requiredLicenceOptions}
                        value={formData.RequiredLicence}
                        onChange={(value) => handleSelectChange('RequiredLicence', value)}
                        required
                        withAsterisk
                        disabled={isLoading}
                        clearable
                    />
                    <TextInput label="Rendszám" name="LicencePlate" value={formData.LicencePlate} onChange={handleChange} required withAsterisk disabled={isLoading} />
                    <NumberInput
                        label="Ár / nap (Ft)"
                        name="PricePerKilometer"
                        value={formData.PricePerDay}
                        onChange={(value) => handleNumberChange('PricePerDay', value as number | '')}
                        min={0}
                        step={0.1}
                        required
                        withAsterisk
                        disabled={isLoading}
                    />
                    <NumberInput
                        label="Aktuális kilométeróra állás"
                        name="ActualKilometers"
                        value={formData.ActualKilometers}
                        onChange={(value) => handleNumberChange('ActualKilometers', value)}
                        min={0}
                        required
                        withAsterisk
                        disabled={isLoading}
                    />
                    <Group grow>
                        <Checkbox label="Érvényes matrica" name="HasValidVignette" checked={formData.HasValidVignette} onChange={handleChange} disabled={isLoading} />
                        <Checkbox label="Automata váltó" name="IsAutomatic" checked={formData.IsAutomatic} onChange={handleChange} disabled={isLoading} />
                        <Checkbox label="Megfelelő műszaki állapot" name="InProperCondition" checked={formData.InProperCondition} onChange={handleChange} disabled={isLoading} />
                    </Group>

                    {renderErrorMessages()}
                    {successMessage && <Text c="green" ta="center" my="md">{successMessage}</Text>}

                    <Group justify="flex-end" mt="xl">
                        <Button type="submit" loading={isLoading}>
                            Autó hozzáadása
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Paper>
    );
};

export default AddCarPage;
