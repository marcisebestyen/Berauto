import { Badge, Button, Card, Group, Image, Table, Text } from "@mantine/core";
import {useEffect, useState} from "react";
import api from "../api/api.ts";
import {ICar} from "../interfaces/ICar.ts";

const Cars = () => {
    const[items,setItems] = useState<ICar[]>([]);
    useEffect(() => {
        api.Cars.getCars().then(res => {
            setItems(res.data);
        });
    }, []);



    const rows = items.map((element) => (
        <Table.Tr key={element.id}>
            <Table.Td>{element.brand}</Table.Td>
            <Table.Td>{element.model}</Table.Td>
            <Table.Td>{element.price}</Table.Td>
            <Table.Td>
                <Badge color={element.isAvailable ? 'green' : 'red'} variant="light">
                    {element.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
            </Table.Td>
        </Table.Tr>
    ));

    return <div>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Table>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Brand</Table.Th>
                        <Table.Th>Model</Table.Th>
                        <Table.Th>Price</Table.Th>
                        <Table.Th>Is Available</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
            </Table>
        </Card>
    </div>
};

export default Cars;