import {useEffect, useState} from "react";
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
} from "@mantine/core";
import {notifications} from "@mantine/notifications";
import {
    IconRefresh,
    IconReceiptOff,
    IconAlertCircle,
} from "@tabler/icons-react";
import api from "../api/api";
import {IReceipt} from "../interfaces/IReceipt";
import dayjs from "dayjs";

const ReceiptListPage = () => {
    const [receipts, setReceipts] = useState<IReceipt[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchReceipts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await api.Receipts.getAll();
            setReceipts(response.data);
        } catch (err: any) {
            const errorMsg = "A számlák betöltése sikertelen";
            notifications.show({
                title: "Hiba",
                message: errorMsg,
                color: "red",
                icon: <IconAlertCircle/>,
            });
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceipts();
    }, []);

    const rows = receipts.map((receipt) => (
        <Table.Tr key={receipt.id}>
            <Table.Td>
                <Text fw={500}>#{receipt.id}</Text>
                <Text size="xs" c="dimmed">Bérlés: #{receipt.rentId}</Text>
            </Table.Td>
            <Table.Td>
                <Text fw={500}>{receipt.carBrand} {receipt.carModel}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{receipt.renterName}</Text>
            </Table.Td>
            <Table.Td>
                <Badge color="green" size="lg" variant="light">
                    {receipt.totalCost.toLocaleString("hu-HU")} Ft
                </Badge>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{dayjs(receipt.issueDate).format("YYYY.MM.DD")}</Text>
            </Table.Td>
            <Table.Td>
                <Text size="sm">{receipt.issuerName}</Text>
            </Table.Td>
        </Table.Tr>
    ));

    const emptyState = (
        <Center p="xl" style={{flexDirection: 'column'}}>
            <IconReceiptOff size={48} stroke={1.5} style={{opacity: 0.5}}/>
            <Title order={4} mt="md" fw={500}>Nincsenek kiállított számlák</Title>
            <Text c="dimmed" size="sm" mt={4}>A rendszerben még nem került kiállításra egyetlen számla sem.</Text>
        </Center>
    );

    const errorState = (
        <Center p="xl">
            <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%" maw={600}>
                {error}
                <Button color="red" variant="light" onClick={fetchReceipts} mt="md">
                    Próbálja újra
                </Button>
            </Alert>
        </Center>
    );

    const showEmptyState = !loading && !error && receipts.length === 0;
    const showErrorState = !loading && error;
    const showTable = !loading && !error && receipts.length > 0;

    return (
        <Container size="xl" py="md">
            <Paper shadow="sm" p="lg" withBorder>
                <Group justify="space-between" mb="lg">
                    <Title order={3}>Összes Kiállított Számla</Title>
                    <ActionIcon variant="light" onClick={fetchReceipts} loading={loading}
                                aria-label="Számlák frissítése">
                        <IconRefresh style={{width: rem(18)}}/>
                    </ActionIcon>
                </Group>

                <Box style={{position: 'relative', minHeight: '300px'}}>
                    <LoadingOverlay visible={loading} overlayProps={{radius: 'sm', blur: 2}}/>

                    {showErrorState && errorState}
                    {showEmptyState && emptyState}

                    {showTable && (
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder miw={800}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Azonosítók</Table.Th>
                                        <Table.Th>Jármű</Table.Th>
                                        <Table.Th>Bérlő</Table.Th>
                                        <Table.Th>Végösszeg</Table.Th>
                                        <Table.Th>Kiállítás Dátuma</Table.Th>
                                        <Table.Th>Kiállító</Table.Th>
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
};

export default ReceiptListPage;