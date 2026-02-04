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
    Alert,
    Container,
    ThemeIcon,
    Divider,
    Box,
} from '@mantine/core';
import {
    IconCar,
    IconLicense,
    IconGasStation,
    IconCash,
    IconRoad,
    IconAlertCircle,
    IconCheck,
    IconSparkles,
    IconSettings,
} from '@tabler/icons-react';
import {CarFormData} from "../interfaces/ICar.ts";
import api from "../api/api.ts";
import {notifications} from '@mantine/notifications';

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
            notifications.show({
                title: 'Sikeres mentés',
                message: `Az autó sikeresen hozzáadva! Azonosító: ${createdCar.id}`,
                color: 'green',
                icon: <IconCheck size={18} />
            });
            setSuccessMessage(`Az autó sikeresen hozzáadva! Azonosító: ${createdCar.id}`);
            setFormData({
                Brand: '', Model: '', FuelType: '', RequiredLicence: '', LicencePlate: '',
                HasValidVignette: true, PricePerDay: '', IsAutomatic: false,
                ActualKilometers: '', InProperCondition: true,
            });
        } catch (err: any) {
            console.error("Autó hozzáadása API hiba:", err);
            let errorMsg = 'Ismeretlen hiba történt a kapcsolat során.';
            if (err.response && err.response.data) {
                const responseData = err.response.data;
                if (responseData.errors) {
                    const modelErrors = Object.values(responseData.errors).flat() as string[];
                    errorMsg = modelErrors.length > 0 ? modelErrors.join(', ') : 'Érvénytelen bemeneti adatok.';
                    setError(modelErrors.length > 0 ? modelErrors : ['Érvénytelen bemeneti adatok.']);
                } else {
                    errorMsg = responseData.Message || responseData.message || `Hiba: ${err.response.statusText}`;
                    setError(errorMsg);
                }
            } else {
                setError(errorMsg);
            }
            notifications.show({
                title: 'Hiba',
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle size={18} />
            });
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
        <Container size="xl" my="xl">
            <Stack gap="xl">
                {/* Fejléc */}
                <Box>
                    <Title order={1} size="h2" fw={900} style={{
                        background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>
                        Új Autó Felvétele
                    </Title>
                    <Text c="dimmed" size="sm">Adj hozzá egy új járművet a flottához</Text>
                </Box>

                {/* Form */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <form onSubmit={handleSubmit}>
                        <Stack gap="xl">
                            {/* Alapadatok szekció */}
                            <Box>
                                <Group gap="sm" mb="xl">
                                    <ThemeIcon size="xl" radius="md" variant="light" color="cyan">
                                        <IconCar size={28}/>
                                    </ThemeIcon>
                                    <Box>
                                        <Title order={3} size="h4">Alapadatok</Title>
                                        <Text size="sm" c="dimmed">Jármű azonosító információk</Text>
                                    </Box>
                                </Group>

                                <Divider mb="xl" opacity={0.1} />

                                <Grid>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <TextInput
                                            label="Márka"
                                            name="Brand"
                                            value={formData.Brand}
                                            onChange={handleChange}
                                            required
                                            withAsterisk
                                            disabled={isLoading}
                                            leftSection={<IconCar size={16}/>}
                                            size="md"
                                            styles={{
                                                input: {
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <TextInput
                                            label="Modell"
                                            name="Model"
                                            value={formData.Model}
                                            onChange={handleChange}
                                            required
                                            withAsterisk
                                            disabled={isLoading}
                                            leftSection={<IconCar size={16}/>}
                                            size="md"
                                            styles={{
                                                input: {
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <TextInput
                                            label="Rendszám"
                                            name="LicencePlate"
                                            value={formData.LicencePlate}
                                            onChange={handleChange}
                                            required
                                            withAsterisk
                                            disabled={isLoading}
                                            leftSection={<IconLicense size={16}/>}
                                            size="md"
                                            styles={{
                                                input: {
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <NumberInput
                                            label="Aktuális kilométeróra állás"
                                            name="ActualKilometers"
                                            value={formData.ActualKilometers}
                                            onChange={(value) => handleNumberChange('ActualKilometers', value)}
                                            min={0}
                                            required
                                            withAsterisk
                                            disabled={isLoading}
                                            leftSection={<IconRoad size={16}/>}
                                            suffix=" km"
                                            thousandSeparator=" "
                                            size="md"
                                            styles={{
                                                input: {
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            }}
                                        />
                                    </Grid.Col>
                                </Grid>
                            </Box>

                            {/* Műszaki adatok szekció */}
                            <Box>
                                <Group gap="sm" mb="xl">
                                    <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                        <IconSettings size={28}/>
                                    </ThemeIcon>
                                    <Box>
                                        <Title order={3} size="h4">Műszaki Adatok</Title>
                                        <Text size="sm" c="dimmed">Technikai specifikációk</Text>
                                    </Box>
                                </Group>

                                <Divider mb="xl" opacity={0.1} />

                                <Grid>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <Select
                                            label="Üzemanyag típus"
                                            name="FuelType"
                                            placeholder="Válassz típust"
                                            data={fuelTypeOptions}
                                            value={formData.FuelType}
                                            onChange={(value) => handleSelectChange('FuelType', value)}
                                            required
                                            withAsterisk
                                            disabled={isLoading}
                                            clearable
                                            leftSection={<IconGasStation size={16}/>}
                                            size="md"
                                            styles={{
                                                input: {
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <Select
                                            label="Szükséges jogosítvány"
                                            name="RequiredLicence"
                                            placeholder="Válassz kategóriát"
                                            data={requiredLicenceOptions}
                                            value={formData.RequiredLicence}
                                            onChange={(value) => handleSelectChange('RequiredLicence', value)}
                                            required
                                            withAsterisk
                                            disabled={isLoading}
                                            clearable
                                            leftSection={<IconLicense size={16}/>}
                                            size="md"
                                            styles={{
                                                input: {
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            }}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={12}>
                                        <NumberInput
                                            label="Ár / nap"
                                            name="PricePerDay"
                                            value={formData.PricePerDay}
                                            onChange={(value) => handleNumberChange('PricePerDay', value)}
                                            min={1}
                                            required
                                            withAsterisk
                                            disabled={isLoading}
                                            leftSection={<IconCash size={16}/>}
                                            suffix=" Ft"
                                            thousandSeparator=" "
                                            size="md"
                                            styles={{
                                                input: {
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                                }
                                            }}
                                        />
                                    </Grid.Col>
                                </Grid>

                                <Paper p="lg" mt="xl" style={{
                                    background: 'rgba(15, 23, 42, 0.3)',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                }}>
                                    <Text size="sm" fw={600} mb="md" c="dimmed">Jármű tulajdonságai</Text>
                                    <Group grow>
                                        <Checkbox
                                            label="Érvényes matrica"
                                            name="HasValidVignette"
                                            checked={formData.HasValidVignette}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            size="md"
                                        />
                                        <Checkbox
                                            label="Automata váltó"
                                            name="IsAutomatic"
                                            checked={formData.IsAutomatic}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            size="md"
                                        />
                                        <Checkbox
                                            label="Megfelelő műszaki állapot"
                                            name="InProperCondition"
                                            checked={formData.InProperCondition}
                                            onChange={handleChange}
                                            disabled={isLoading}
                                            size="md"
                                        />
                                    </Group>
                                </Paper>
                            </Box>

                            {/* Üzenetek */}
                            {error && (
                                <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba történt!" color="red" withCloseButton
                                       onClose={() => setError('')} variant="light">
                                    {renderErrorContent()}
                                </Alert>
                            )}
                            {successMessage && (
                                <Alert icon={<IconCheck size="1rem"/>} title="Siker!" color="green" withCloseButton
                                       onClose={() => setSuccessMessage('')} variant="light">
                                    {successMessage}
                                </Alert>
                            )}

                            {/* Submit gomb */}
                            <Button
                                type="submit"
                                loading={isLoading}
                                leftSection={<IconSparkles size={20}/>}
                                size="lg"
                                fullWidth
                                style={{
                                    background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                    fontWeight: 600,
                                }}
                            >
                                Autó hozzáadása
                            </Button>
                        </Stack>
                    </form>
                </Paper>
            </Stack>
        </Container>
    );
};

export default AddCarPage;