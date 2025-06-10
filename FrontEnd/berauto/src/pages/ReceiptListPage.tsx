import { useEffect, useState } from "react";
import { Container, Title, Paper, Table, LoadingOverlay } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import api from "../api/api";
import { IReceipt } from "../interfaces/IReceipt";

const ReceiptListPage = () => {
    const [receipts, setReceipts] = useState<IReceipt[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchReceipts = async () => {
            try {
                const response = await api.Receipts.getAll();
                setReceipts(response.data);
            } catch (err: any) {
                console.error("Hiba a számlák lekérésekor:", err);
                notifications.show({
                    title: "Hiba",
                    message: "A számlák betöltése sikertelen",
                    color: "red",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchReceipts();
    }, []);

    const rows = receipts.map((receipt) => (
        <Table.Tr key={receipt.id}>
            <Table.Td>{receipt.id}</Table.Td>
            <Table.Td>{receipt.rentId}</Table.Td>
            <Table.Td>{receipt.carBrand} {receipt.carModel}</Table.Td>
            <Table.Td>{receipt.renterName}</Table.Td>
            <Table.Td>{receipt.totalCost.toLocaleString("hu-HU")} Ft</Table.Td>
            <Table.Td>{new Date(receipt.issueDate).toLocaleDateString("hu-HU")}</Table.Td>
            <Table.Td>{receipt.issuerName}</Table.Td>
        </Table.Tr>
    ));

    return (
        <Container size="xl">
            <LoadingOverlay visible={loading} />
            <Title order={2} mb="md">Kiállított Számlák</Title>

            <Paper p="md" withBorder>
                <Table>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>ID</Table.Th>
                            <Table.Th>Bérlés ID</Table.Th>
                            <Table.Th>Autó</Table.Th>
                            <Table.Th>Bérlő</Table.Th>
                            <Table.Th>Összeg</Table.Th>
                            <Table.Th>Kiállítás dátuma</Table.Th>
                            <Table.Th>Ügyintéző</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>{rows}</Table.Tbody>
                </Table>
            </Paper>
        </Container>
    );
};

export default ReceiptListPage;
