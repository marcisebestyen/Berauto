// src/pages/admin/AddCarPage.tsx (vagy ahova szeretnéd helyezni)
import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Backend enumok frontend reprezentációja a Select komponenshez
// A 'value' itt stringként az enum nevét fogja tartalmazni.
// A backendnek képesnek kell lennie ezt stringként fogadni és enumra konvertálni.
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
    const navigate = useNavigate();
    const [formData, setFormData] = useState<CarFormData>({
        Brand: '',
        Model: '',
        FuelType: '', // Kezdetben üres, a felhasználó választ
        RequiredLicence: '', // Kezdetben üres, a felhasználó választ
        LicencePlate: '',
        HasValidVignette: true, // Alapértelmezett érték
        PricePerKilometer: '',
        IsAutomatic: false, // Alapértelmezett érték
        ActualKilometers: '',
        InProperCondition: true, // Alapértelmezett érték
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

    // Külön handler a Mantine Select és NumberInput komponensekhez,
    // mivel azok nem standard 'event.target.value'-t adnak vissza.
    const handleSelectChange = (name: keyof CarFormData, value: string | null) => {
        setFormData(prevData => ({
            ...prevData,
            [name]: value || '', // Ha a value null (pl. törlés), üres string legyen
        }));
    };

    const handleNumberChange = (name: keyof CarFormData, value: number | '') => {
        setFormData(prevData => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsLoading(true);

        // Frontend validáció
        if (!formData.Brand || !formData.Model || !formData.FuelType || !formData.RequiredLicence || !formData.LicencePlate || formData.PricePerKilometer === '' || formData.ActualKilometers === '') {
            setError('Minden csillaggal jelölt mező kitöltése kötelező.');
            setIsLoading(false);
            return;
        }
        if (Number(formData.PricePerKilometer) <= 0) {
            setError('A kilométerenkénti árnak pozitívnak kell lennie.');
            setIsLoading(false);
            return;
        }
        if (Number(formData.ActualKilometers) < 0) {
            setError('A futott kilométer nem lehet negatív.');
            setIsLoading(false);
            return;
        }

        // API végpont URL-je (módosítsd, ha szükséges)
        const apiUrl = 'https://localhost:7205/api/cars/createCar'; // Figyelj a controller nevére ('Cars' vagy 'Car')

        try {
            // A formData objektumot küldjük, a backendnek kell tudnia map-elni a CarCreateDto-ra.
            // A FuelType és RequiredLicence stringként megy át, a backend enum konverziónak kell működnie.
            const payload = {
                ...formData,
                PricePerKilometer: Number(formData.PricePerKilometer),
                ActualKilometers: Number(formData.ActualKilometers),
            };

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Ide jöhet az authentikációs token, ha szükséges
                    // 'Authorization': `Bearer YOUR_AUTH_TOKEN`,
                },
                body: JSON.stringify(payload),
            });

            const responseData = await response.json(); // A backend CreatedAtAction választ ad, a body-ban az új autóval

            if (!response.ok) { // Státuszkód 4xx vagy 5xx
                if (responseData.errors) { // ModelState hibák (ASP.NET Core default)
                    const modelErrors = Object.values(responseData.errors).flat() as string[];
                    setError(modelErrors.length > 0 ? modelErrors : ['Érvénytelen bemeneti adatok.']);
                } else if (responseData.title && responseData.status) { // ASP.NET Core default problem details
                    setError(`${responseData.title} (Státusz: ${responseData.status})`);
                } else if (responseData.Message) { // Egyedi hibaüzenet a backendtől
                    setError(responseData.Message);
                }
                else {
                    setError(`Hiba történt a szerveroldalon: ${response.statusText} (Státusz: ${response.status})`);
                }
            } else {
                // Sikeres létrehozás (HTTP 201)
                setSuccessMessage(`Az autó sikeresen hozzáadva! Azonosító: ${responseData.id}`);
                // Ürlap ürítése
                setFormData({
                    Brand: '', Model: '', FuelType: '', RequiredLicence: '', LicencePlate: '',
                    HasValidVignette: true, PricePerKilometer: '', IsAutomatic: false,
                    ActualKilometers: '', InProperCondition: true,
                });
                // Opcionálisan átirányíthatsz, pl. az autók listájára vagy a részletező oldalra
                // setTimeout(() => navigate(`/cars/${responseData.id}`), 2000);
            }
        } catch (err) {
            console.error("Autó hozzáadása API hiba:", err);
            setError('Ismeretlen hiba történt a kapcsolat során. Kérjük, próbáld újra később.');
        } finally {
            setIsLoading(false);
        }
    };

    // Hibaüzenetek megjelenítése
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
                        label="Ár / km (Ft)"
                        name="PricePerKilometer"
                        value={formData.PricePerKilometer}
                        onChange={(value) => handleNumberChange('PricePerKilometer', value)}
                        min={0}
                        step={0.1}
                        precision={2}
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
