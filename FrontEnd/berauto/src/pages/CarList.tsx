import {
    Button,
    Table,
    Paper,
    LoadingOverlay,
    Group,
    Title,
    ScrollArea,
    Center,
    Text,
    Badge,
    Box,
    Container,
    Stack,
    ThemeIcon,
    Divider,
} from '@mantine/core';
import {useState, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    IconRefresh,
    IconArrowRight,
    IconCarOff,
    IconCar,
    IconSparkles,
} from '@tabler/icons-react';
import api from '../api/api.ts';
import {ICar} from '../interfaces/ICar.ts';
import {notifications} from '@mantine/notifications';

const CarListPage = () => {
    const [items, setItems] = useState<ICar[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasLoaded, setHasLoaded] = useState(false);
    const navigate = useNavigate();

    const fetchAllCars = async () => {
        setIsLoading(true);
        try {
            const res = await api.Cars.getAllCars();
            setItems(res.data);
            setHasLoaded(true);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.message || 'Nem sikerült betölteni az autókat.';
            notifications.show({
                title: 'Hiba',
                message: errorMsg,
                color: 'red',
            });
            setItems([]);
            setHasLoaded(true);
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
        <Table.Tr key={element.id} style={{
            transition: 'all 0.2s ease',
            background: 'rgba(15, 23, 42, 0.4)',
        }}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
                  }}>
            <Table.Td>
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                        <IconCar size={20} />
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{element.brand}</Text>
                        <Text size="xs" c="dimmed">{element.model}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                <Badge variant="outline" color="gray" size="lg" tt="none" style={{fontWeight: 500}}>
                    {element.licencePlate}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge color={element.isAutomatic ? 'blue' : 'gray'} variant="filled" size="md" tt="uppercase">
                    {element.isAutomatic ? 'Automata' : 'Manuális'}
                </Badge>
            </Table.Td>
            <Table.Td>
                <Badge
                    color="cyan"
                    variant="filled"
                    size="lg"
                    tt="none"
                    style={{fontWeight: 600}}
                >
                    {element.pricePerDay.toLocaleString('hu-HU')} Ft/nap
                </Badge>
            </Table.Td>
            <Table.Td>
                <Button
                    size="sm"
                    variant="light"
                    color="blue"
                    onClick={() => navigateToCarDetails(element.id)}
                    rightSection={<IconArrowRight size={16}/>}
                >
                    Részletek
                </Button>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center py={60} style={{flexDirection: 'column'}}>
            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="md">
                <IconCarOff size={40} stroke={1.5} />
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek autók a rendszerben</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Kezdje meg egy új autó felvételével a "Új Autó" oldalon.
            </Text>
        </Center>
    );

    return (
        <Container size="xl" my="xl">
            <Stack gap="xl">
                {/* Fejléc */}
                <Box>
                    <Group justify="space-between" align="flex-start">
                        <Box>
                            <Title order={1} size="h2" fw={900} style={{
                                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                marginBottom: '0.5rem',
                            }}>
                                Járművek Listája
                            </Title>
                            <Text c="dimmed" size="sm">Kezeld a flotta összes járművét</Text>
                        </Box>
                        <Button
                            leftSection={<IconRefresh size={18}/>}
                            onClick={fetchAllCars}
                            loading={isLoading}
                            variant="light"
                            color="cyan"
                        >
                            Frissítés
                        </Button>
                    </Group>
                </Box>

                {/* Tartalom */}
                <Paper shadow="xl" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Box style={{position: 'relative', minHeight: '400px'}}>
                        <LoadingOverlay visible={isLoading} overlayProps={{radius: 'sm', blur: 2}}/>

                        {!isLoading && hasLoaded && items.length === 0 && emptyState}

                        {!isLoading && items.length > 0 && (
                            <>
                                <Group gap="sm" mb="xl">
                                    <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                        <IconSparkles size={28}/>
                                    </ThemeIcon>
                                    <Box>
                                        <Title order={3} size="h4">Járművek</Title>
                                        <Text size="sm" c="dimmed">{items.length} autó a rendszerben</Text>
                                    </Box>
                                </Group>

                                <Divider mb="xl" opacity={0.1} />

                                <ScrollArea>
                                    <Table striped={false} highlightOnHover={false} miw={700} style={{
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                    }}>
                                        <Table.Thead style={{
                                            background: 'rgba(15, 23, 42, 0.6)',
                                        }}>
                                            <Table.Tr>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Jármű</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Rendszám</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Váltó</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Ár</Table.Th>
                                                <Table.Th style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Műveletek</Table.Th>
                                            </Table.Tr>
                                        </Table.Thead>
                                        <Table.Tbody>{rows}</Table.Tbody>
                                    </Table>
                                </ScrollArea>
                            </>
                        )}
                    </Box>
                </Paper>
            </Stack>
        </Container>
    );
};

export default CarListPage;