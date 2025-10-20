import {
    Button,
    Table,
    Paper,
    LoadingOverlay,
    Group,
    Title,
    ActionIcon,
    ScrollArea,
    Center,
    Text,
    Alert,
    Badge,
    Box,
    rem,
} from '@mantine/core';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    IconRefresh,
    IconArrowRight,
    IconCarOff,
    IconAlertCircle,
} from '@tabler/icons-react';
import api from '../api/api.ts';
import {ICar} from '../interfaces/ICar.ts';
import {notifications} from '@mantine/notifications';

const CarListPage = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchAllCars = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const res = await api.Cars.getAllCars();
            setItems(res.data);
        } catch (error: any) {
            const errorMsg = 'Nem sikerült betölteni az autókat.';
            notifications.show({
                title: 'Hiba',
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle/>
            });
            setError(errorMsg);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAllCars();
    }, []);

    const navigateToCarDetails = (carId: number) => {
        navigate(`/admin/cars/${carId}`);
    };

    const rows = items.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>
                <Text fw={500}>{element.brand}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{element.model}</Text>
            </Table.Td>
            <Table.Td>
                <Badge variant="outline" color="gray">{element.licencePlate}</Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={element.isAutomatic ? 'blue' : 'gray'} variant="light">
                    {element.isAutomatic ? 'Automata' : 'Manuális'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Button
                    size="xs"
                    variant="light"
                    onClick={() => navigateToCarDetails(element.id)}
                    rightSection={<IconArrowRight size={14}/>}
                >
                    Részletek
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconCarOff size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek autók a rendszerben</Title>
            <Text c="dimmed" size="sm" mt={4}>Kezdje meg egy új autó felvételével a "Új Autó" oldalon.</Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%" maw={600}>
                {error}
                <Button color="red" variant="light" onClick={fetchAllCars} mt="md">
                    Próbálja újra
                </Button>
            </Alert>
        </Center>
    );

    const showEmptyState = !isLoading && !error && items.length === 0;
    const showErrorState = !isLoading && error;
    const showTable = !isLoading && !error && items.length > 0;

    return (
        <Paper shadow="sm" p="md" withBorder>
            <Group justify="space-between" mb="lg">
                <Title order={3}>Járművek listája</Title>
                <ActionIcon variant="light" onClick={fetchAllCars} loading={isLoading} aria-label="Autók frissítése">
                    <IconRefresh style={{width: rem(18)}}/>
                </ActionIcon>
            </Group>

            <Box style={{position: 'relative', minHeight: '300px'}}>
                <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

                {showErrorState && errorState}
                {showEmptyState && emptyState}

                {showTable && (
                    <ScrollArea>
                        <Table striped highlightOnHover withTableBorder miw={600}>
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
                    </ScrollArea>
                )}
            </Box>
        </Paper>
    );
};

export default CarListPage;