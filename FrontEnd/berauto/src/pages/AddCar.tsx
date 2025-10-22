import React, {useState, FormEvent} from 'react';
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
    Text,
    Grid,
    Fieldset,
    Alert
} from '@mantine/core';
import {
    IconCar,
    IconLicense,
    IconGasStation,
    IconCash,
    IconRoad,
    IconAlertCircle,
    IconCheck
} from '@tabler/icons-react';
import {CarFormData} from "../interfaces/ICar.ts";
import api from "../api/api.ts";

const fuelTypeOptions = [
    {value: 'Diesel', label: 'Dízel'},
    {value: 'Petrol', label: 'Benzin'},
    {value: 'Hybrid', label: 'Hibrid'},
    {value: 'Electric', label: 'Elektromos'},
];

const requiredLicenceOptions = [
    {value: 'AM', label: 'AM'},
    {value: 'A1', label: 'A1'},
    {value: 'A2', label: 'A2'},
    {value: 'A', label: 'A'},
    {value: 'B', label: 'B'},
];

const AddCarPage = () => {
    const [formData, setFormData] = useState<CarFormData>({
        Brand: '', Model: '', FuelType: '', RequiredLicence: '', LicencePlate: '',
        HasValidVignette: true, PricePerDay: '', IsAutomatic: false,
        ActualKilometers: '', InProperCondition: true,
    });

    const [error, setError] = useState<string | string[]>('');
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = e.target;
        setFormData(prevData => ({...prevData, [name]: type === 'checkbox' ? checked : value}));
    };

    const handleSelectChange = (name: keyof CarFormData, value: string | null) => {
        setFormData(prevData => ({...prevData, [name]: value || ''}));
    };

    const handleNumberChange = (name: keyof CarFormData, value: string | number) => {
        setFormData(prevData => ({...prevData, [name]: value}));
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
            setError('A napidíjnak pozitívnak kell lennie.');
            setIsLoading(false);
            return;
        }
        if (Number(formData.ActualKilometers) < 0) {
            setError('A futott kilométer nem lehet negatív.');
            setIsLoading(false);
            return;
        }

        try {
            const createdCar = await api.Cars.createCar(formData);
            setSuccessMessage(`Az autó sikeresen hozzáadva! Azonosító: ${createdCar.id}`);
            setFormData({
                Brand: '', Model: '', FuelType: '', RequiredLicence: '', LicencePlate: '',
                HasValidVignette: true, PricePerDay: '', IsAutomatic: false,
                ActualKilometers: '', InProperCondition: true,
            });
        } catch (err: any) {
            console.error("Autó hozzáadása API hiba:", err);
            if (err.response && err.response.data) {
                const responseData = err.response.data;
                if (responseData.errors) {
                    const modelErrors = Object.values(responseData.errors).flat() as string[];
                    setError(modelErrors.length > 0 ? modelErrors : ['Érvénytelen bemeneti adatok.']);
                } else {
                    setError(responseData.Message || responseData.message || `Hiba: ${err.response.statusText}`);
                }
            } else {
                setError('Ismeretlen hiba történt a kapcsolat során.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const renderErrorContent = () => {
        if (!error) return null;
        const messages = Array.isArray(error) ? error : [error];
        if (messages.length === 1) {
            return messages[0];
        }
        return (
            <Stack gap="xs">
                {messages.map((err, index) => <Text key={index} size="sm">{err}</Text>)}
            </Stack>
        );
    };

    return (
        <Paper withBorder shadow="md" p={30} mt={30} radius="md" style={{maxWidth: 800, margin: 'auto'}}>
            <Title order={2} ta="center" mb="xl">Új autó felvétele</Title>
            <form onSubmit={handleSubmit}>
                <Stack>
                    <Grid>
                        <Grid.Col span={{base: 12, md: 6}}>
                            <TextInput label="Márka" name="Brand" value={formData.Brand} onChange={handleChange}
                                       required withAsterisk disabled={isLoading} leftSection={<IconCar size={16}/>}/>
                        </Grid.Col>
                        <Grid.Col span={{base: 12, md: 6}}>
                            <TextInput label="Modell" name="Model" value={formData.Model} onChange={handleChange}
                                       required withAsterisk disabled={isLoading} leftSection={<IconCar size={16}/>}/>
                        </Grid.Col>

                        <Grid.Col span={{base: 12, md: 6}}>
                            <Select label="Üzemanyag típus" name="FuelType" placeholder="Válassz típust"
                                    data={fuelTypeOptions} value={formData.FuelType}
                                    onChange={(value) => handleSelectChange('FuelType', value)} required withAsterisk
                                    disabled={isLoading} clearable leftSection={<IconGasStation size={16}/>}/>
                        </Grid.Col>
                        <Grid.Col span={{base: 12, md: 6}}>
                            <Select label="Szükséges jogosítvány" name="RequiredLicence"
                                    placeholder="Válassz kategóriát" data={requiredLicenceOptions}
                                    value={formData.RequiredLicence}
                                    onChange={(value) => handleSelectChange('RequiredLicence', value)} required
                                    withAsterisk disabled={isLoading} clearable leftSection={<IconLicense size={16}/>}/>
                        </Grid.Col>

                        <Grid.Col span={{base: 12, md: 6}}>
                            <TextInput label="Rendszám" name="LicencePlate" value={formData.LicencePlate}
                                       onChange={handleChange} required withAsterisk disabled={isLoading}
                                       leftSection={<IconLicense size={16}/>}/>
                        </Grid.Col>
                        <Grid.Col span={{base: 12, md: 6}}>
                            <NumberInput label="Ár / nap" name="PricePerDay" value={formData.PricePerDay}
                                         onChange={(value) => handleNumberChange('PricePerDay', value)} min={1} required
                                         withAsterisk disabled={isLoading} leftSection={<IconCash size={16}/>}
                                         suffix=" Ft" thousandSeparator=" "/>
                        </Grid.Col>

                        <Grid.Col span={12}>
                            <NumberInput label="Aktuális kilométeróra állás" name="ActualKilometers"
                                         value={formData.ActualKilometers}
                                         onChange={(value) => handleNumberChange('ActualKilometers', value)} min={0}
                                         required withAsterisk disabled={isLoading} leftSection={<IconRoad size={16}/>}
                                         suffix=" km" thousandSeparator=" "/>
                        </Grid.Col>
                    </Grid>

                    <Fieldset legend="Jármű állapota" mt="sm">
                        <Group grow>
                            <Checkbox label="Érvényes matrica" name="HasValidVignette"
                                      checked={formData.HasValidVignette} onChange={handleChange} disabled={isLoading}/>
                            <Checkbox label="Automata váltó" name="IsAutomatic" checked={formData.IsAutomatic}
                                      onChange={handleChange} disabled={isLoading}/>
                            <Checkbox label="Megfelelő műszaki állapot" name="InProperCondition"
                                      checked={formData.InProperCondition} onChange={handleChange}
                                      disabled={isLoading}/>
                        </Group>
                    </Fieldset>

                    {error && (
                        <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba történt!" color="red" withCloseButton
                               onClose={() => setError('')} mt="md">
                            {renderErrorContent()}
                        </Alert>
                    )}
                    {successMessage && (
                        <Alert icon={<IconCheck size="1rem"/>} title="Siker!" color="green" withCloseButton
                               onClose={() => setSuccessMessage('')} mt="md">
                            {successMessage}
                        </Alert>
                    )}

                    <Group justify="flex-end" mt="xl">
                        <Button type="submit" loading={isLoading} leftSection={<IconCar size={18}/>}>
                            Autó hozzáadása
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Paper>
    );
};

export default AddCarPage;