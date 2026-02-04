import {useEffect, useState} from 'react';
import {
    Container,
    Title,
    Paper,
    Table,
    LoadingOverlay,
    Group,
    ActionIcon,
    Box,
    Center,
    Text,
    Alert,
    Badge,
    ScrollArea,
    Button,
    rem,
    ThemeIcon,
    Divider,
} from '@mantine/core';
import {notifications} from '@mantine/notifications';
import {
    IconRefresh,
    IconListCheck,
    IconAlertCircle,
    IconCarOff,
    IconCar,
    IconUser,
    IconDashboard,
    IconCalendarEvent,
} from '@tabler/icons-react';
import api from '../api/api';
import {IRentGetDto} from '../interfaces/IRent';
import dayjs from 'dayjs';
import 'dayjs/locale/hu';

dayjs.locale('hu');

export function CompletedRents() {
    const [rents, setRents] = useState<IRentGetDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadRents = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.Staff.completedRents();
            setRents(response.data);
        } catch (error) {
            const errorMsg = 'A lezárt kölcsönzések betöltése sikertelen';
            notifications.show({
                title: 'Hiba',
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle/>,
            });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRents();
    }, []);

    const rows = rents.map((rent) => (
        <Table.Tr
            key={rent.id}
            style={{
                transition: 'all 0.2s ease',
                background: 'rgba(15, 23, 42, 0.4)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(30, 41, 59, 0.5)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(15, 23, 42, 0.4)';
            }}
        >
            <Table.Td>
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                        <IconCar size={20}/>
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{rent.carBrand}</Text>
                        <Text size="xs" c="dimmed">{rent.carModel}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color="gray">
                        <IconUser size={20}/>
                    </ThemeIcon>
                    <Box>
                        <Text fw={600} size="sm">{rent.renterName}</Text>
                        <Text size="xs" c="dimmed">ID: {rent.renterId}</Text>
                    </Box>
                </Group>
            </Table.Td>
            <Table.Td>
                {rent.actualStart ? (
                    <Badge
                        color="cyan"
                        variant="light"
                        size="lg"
                        tt="none"
                        leftSection={<IconCalendarEvent size={14}/>}
                    >
                        {dayjs(rent.actualStart).format('YYYY.MM.DD HH:mm')}
                    </Badge>
                ) : <Badge color="gray" variant="light">-</Badge>}
            </Table.Td>
            <Table.Td>
                {rent.actualEnd ? (
                    <Badge
                        color="cyan"
                        variant="light"
                        size="lg"
                        tt="none"
                        leftSection={<IconCalendarEvent size={14}/>}
                    >
                        {dayjs(rent.actualEnd).format('YYYY.MM.DD HH:mm')}
                    </Badge>
                ) : <Badge color="gray" variant="light">-</Badge>}
            </Table.Td>
            <Table.Td>
                <Badge
                    color="blue"
                    variant="filled"
                    size="lg"
                    tt="none"
                    leftSection={<IconDashboard size={14}/>}
                >
                    {/* JAVÍTVA: Ellenőrzés, hogy az érték létezik-e (nem null/undefined) */}
                    {rent.endingKilometer
                        ? `${rent.endingKilometer.toLocaleString('hu-HU')} km`
                        : '-'}
                </Badge>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center py={60} style={{flexDirection: 'column'}}>
            <ThemeIcon size={80} radius="xl" variant="light" color="gray" mb="md"
                       style={{
                           background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.15) 0%, rgba(51, 65, 85, 0.15) 100%)',
                       }}
            >
                <IconCarOff size={40} stroke={1.5}/>
            </ThemeIcon>
            <Title order={3} fw={700} mb="xs">Nincsenek lezárt kölcsönzések</Title>
            <Text c="dimmed" size="sm" ta="center" maw={400}>
                Még egyetlen kölcsönzés sem zárult le a rendszerben.
            </Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%" maw={600}
                   variant="light">
                {error}
                <Button color="red" variant="light" onClick={loadRents} mt="md">
                    Próbálja újra
                </Button>
            </Alert>
        </Center>
    );

    const showEmptyState = !loading && !error && rents.length === 0;
    const showErrorState = !loading && error;
    const showTable = !loading && !error && rents.length > 0;

    return (
        <Container size="xl" my="xl">
            <Box mb="xl">
                <Title order={1} size="h2" fw={900} style={{
                    background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem',
                }}>
                    Adminisztráció
                </Title>
                <Text c="dimmed" size="sm">Lezárt kölcsönzések áttekintése</Text>
            </Box>

            <Paper
                shadow="xl" p="xl" withBorder
                style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}
            >
                <Box style={{position: 'relative', minHeight: '300px'}}>
                    <LoadingOverlay visible={loading} overlayProps={{radius: 'sm', blur: 2}}/>

                    <Group justify="space-between" mb="lg">
                        <Group gap="sm">
                            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                <IconListCheck size={28}/>
                            </ThemeIcon>
                            <Box>
                                <Title order={3} size="h4">Lezárt Kölcsönzések</Title>
                                <Text size="sm" c="dimmed">
                                    {loading ? 'Adatok töltése...' : `${rents.length} befejezett bérlés`}
                                </Text>
                            </Box>
                        </Group>
                        <ActionIcon
                            variant="default"
                            onClick={loadRents}
                            loading={loading}
                            aria-label="Adatok frissítése"
                            size="lg"
                        >
                            <IconRefresh style={{width: rem(18)}}/>
                        </ActionIcon>
                    </Group>

                    <Divider mb="xl" opacity={0.1}/>

                    {showErrorState && errorState}
                    {showEmptyState && emptyState}

                    {showTable && (
                        <ScrollArea>
                            <Table striped={false} highlightOnHover={false} miw={1000} style={{
                                borderRadius: '8px',
                                overflow: 'hidden',
                            }}>
                                <Table.Thead style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                }}>
                                    <Table.Tr>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Jármű</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Bérlő</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Tényleges
                                            kezdés</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Tényleges
                                            befejezés</Table.Th>
                                        <Table.Th
                                            style={{fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem'}}>Záró
                                            km óra</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>{rows}</Table.Tbody>
                            </Table>
                        </ScrollArea>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}