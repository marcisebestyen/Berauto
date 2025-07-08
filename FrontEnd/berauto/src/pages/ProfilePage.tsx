import { useState, useEffect, useCallback } from 'react';
import {
    Card,
    Title,
    Text,
    Button,
    Group,
    TextInput,
    Stack,
    Loader,
    Table,
    Grid,
    Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconDeviceFloppy, IconX, IconAlertCircle } from '@tabler/icons-react';
import useAuth from '../hooks/useAuth';
import api from '../api/api';
import { IUserProfile, IUserUpdateDto } from '../interfaces/IUser';
import {ISimpleRent} from '../interfaces/IRent';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

interface JsonPatchOperation {
    op: "replace" | "add" | "remove" | "copy" | "move" | "test";
    path: string;
    value?: any;
    from?: string;
}

const ProfilePage = () => {
    const { user } = useAuth();
    const [profileData, setProfileData] = useState<IUserProfile | null>(null);
    const [originalProfileDataForPatch, setOriginalProfileDataForPatch] = useState<IUserProfile | null>(null);
    const [userRents, setUserRents] = useState<ISimpleRent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<IUserUpdateDto>({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            licenceId: '',
            address: '',
        },
        validate: {
            firstName: (value) => {
                if (value == null || typeof value !== 'string') { return null; }
                return value.trim().length < 2 ? 'A keresztnév legalább 2 karakter legyen' : null;
            },
            lastName: (value) => {
                if (value == null || typeof value !== 'string') { return null; }
                return value.trim().length < 2 ? 'A vezetéknév legalább 2 karakter legyen' : null;
            },
            email: (value) => {
                if (value == null || typeof value !== 'string') { return null; }
                if (value.trim() === '') { return null; }
                return /^\S+@\S+$/.test(value) ? null : 'Érvénytelen email formátum';
            },
        },
    });

    const { setValues, resetDirty } = form;

    const setAndResetForm = useCallback((data: IUserProfile) => {
        const currentFormValues = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || undefined,
            licenceId: data.licenceId || undefined,
            address: data.address || undefined,
        };
        setValues(currentFormValues);
        resetDirty(currentFormValues);
        setOriginalProfileDataForPatch(data);
    }, [setValues, resetDirty]);

    useEffect(() => {
        if (user?.id) {
            const fetchData = async () => {
                setIsLoading(true);
                setError(null);
                try {
                    const profileRes = await api.Users.getProfileDetails();
                    setProfileData(profileRes.data);
                    setAndResetForm(profileRes.data);

                    const rentsRes = await api.Users.getUserRents(user.id.toString());
                    setUserRents(rentsRes.data);

                } catch (err: any) {
                    console.error("Hiba adatbetöltés közben (useEffect):", err);
                    setError('Hiba történt a profiladatok betöltése közben.');
                    notifications.show({
                        title: 'Betöltési Hiba',
                        message: err.response?.data?.message || err.message || 'Ismeretlen hiba a profiladatok lekérésekor.',
                        color: 'red',
                        icon: <IconAlertCircle />,
                    });
                    setProfileData(null);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        } else {
            setProfileData(null);
            setUserRents([]);
            setIsLoading(false);
        }
    }, [user?.id, setAndResetForm]);

    const handleUpdateProfile = async (currentFormValues: IUserUpdateDto) => {
        if (!user?.id || !originalProfileDataForPatch) {
            notifications.show({
                title: 'Hiba',
                message: 'A felhasználói adatok nem érhetők el a frissítéshez.',
                color: 'red',
            });
            return;
        }
        const patchOps: JsonPatchOperation[] = [];
        type UserUpdateDtoKey = keyof IUserUpdateDto;
        (Object.keys(currentFormValues) as UserUpdateDtoKey[]).forEach(key => {
            const currentValue = currentFormValues[key];
            const originalValue = originalProfileDataForPatch[key as keyof IUserProfile];
            const currentNormalized = currentValue === null || currentValue === undefined ? null : String(currentValue).trim();
            const originalNormalized = originalValue === null || originalValue === undefined ? null : String(originalValue).trim();
            if (currentNormalized !== originalNormalized) {
                const path = `/${key.charAt(0).toUpperCase() + key.slice(1)}`;
                patchOps.push({ op: "replace", path: path, value: currentValue });
            }
        });

        if (patchOps.length === 0) {
            notifications.show({ title: "Nincs változás", message: "Nem történt módosítás a profiladatokban.", color: "blue" });
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await api.Users.updateProfile(patchOps);

            const updatedProfile: IUserProfile = {
                ...originalProfileDataForPatch,
                ...Object.fromEntries(
                    Object.entries(currentFormValues)
                        .map(([key, value]) => [key, value === null ? undefined : value])
                ),
                id: originalProfileDataForPatch.id,
                userName: originalProfileDataForPatch.userName,
            };

            setProfileData(updatedProfile);
            setAndResetForm(updatedProfile);
            setIsEditing(false);

            notifications.show({
                title: 'Sikeres Mentés',
                message: 'A profiladataid frissültek.',
                color: 'green',
            });
        } catch (err: any) {
            console.error("Hiba profil mentése közben:", err, err.response?.data);
            const errorMsg = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join('; ')
                : err.response?.data?.message || err.response?.data?.title || err.message || 'Hiba történt a profil mentése közben.';
            notifications.show({
                title: 'Mentési Hiba',
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle />,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !profileData && !error && !isEditing) { return <Center><Loader /></Center>; }
    if (error && !profileData) { /* ... Error Alert ... */ }
    if (!user || !profileData) { if(!error) { /* ... Profiladatok nem elérhetők ... */ } }

    return (
        <Stack gap="lg">
            {profileData && (
                <>
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Group justify="space-between" mb="md">
                            <Title order={3}>Profilom</Title>
                            {!isEditing && (
                                <Button leftSection={<IconEdit size={16} />} onClick={() => {
                                    setAndResetForm(profileData);
                                    setIsEditing(true);
                                }} variant="outline">
                                    Szerkesztés
                                </Button>
                            )}
                        </Group>
                        {!isEditing ? (
                            <Stack>
                                <Text><strong>Név:</strong> {profileData.firstName} {profileData.lastName}</Text>
                                <Text><strong>Felhasználónév:</strong> {profileData.userName}</Text>
                                <Text><strong>Email:</strong> {profileData.email}</Text>
                                <Text><strong>Telefonszám:</strong> {profileData.phoneNumber || '-'}</Text>
                                <Text><strong>Jogosítvány száma:</strong> {profileData.licenceId || '-'}</Text>
                                <Text><strong>Lakcím:</strong> {profileData.address|| '-'}</Text>
                            </Stack>
                        ) : (
                            <form onSubmit={form.onSubmit(handleUpdateProfile)}>
                                <Stack>
                                    <Grid>
                                        <Grid.Col span={{ base: 12, md: 6 }}>
                                            <TextInput label="Vezetéknév" placeholder="Vezetéknév" {...form.getInputProps('lastName')} />
                                        </Grid.Col>
                                        <Grid.Col span={{ base: 12, md: 6 }}>
                                            <TextInput label="Keresztnév" placeholder="Keresztnév" {...form.getInputProps('firstName')} />
                                        </Grid.Col>
                                    </Grid>
                                    <TextInput label="Email cím" placeholder="Email" {...form.getInputProps('email')} />
                                    <TextInput label="Telefonszám" placeholder="Telefonszám" {...form.getInputProps('phoneNumber')} />
                                    <TextInput label="Jogosítvány száma" placeholder="Jogosítvány száma" {...form.getInputProps('licenceId')} />
                                    <TextInput label="Lakcím" placeholder="Lakcím" {...form.getInputProps('address')} />
                                    <Group mt="md">
                                        <Button type="submit" leftSection={<IconDeviceFloppy size={16} />} loading={isLoading}>
                                            Mentés
                                        </Button>
                                        <Button variant="default" onClick={() => {
                                            setIsEditing(false);
                                            setAndResetForm(profileData);
                                        }} leftSection={<IconX size={16} />}>
                                            Mégse
                                        </Button>
                                    </Group>
                                </Stack>
                            </form>
                        )}
                    </Card>

                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="sm">Korábbi Bérléseim</Title>
                        {userRents.length > 0 ? (
                            <Table striped highlightOnHover withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Autó</Table.Th>
                                        <Table.Th>Bérlés Kezdete (Tényleges)</Table.Th>
                                        <Table.Th>Bérlés Vége (Tényleges)</Table.Th>
                                        <Table.Th>Költség</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {userRents.map(rent => {
                                        const parsedActualStartDate = rent.actualStart ? dayjs(rent.actualStart) : null;
                                        const parsedActualEndDate = rent.actualEnd ? dayjs(rent.actualEnd) : null;
                                        return (
                                            <Table.Tr key={rent.id}>
                                                <Table.Td>{rent.carBrand} {rent.carModel}</Table.Td>
                                                <Table.Td>
                                                    {parsedActualStartDate && parsedActualStartDate.isValid()
                                                        ? parsedActualStartDate.format('YYYY.MM.DD HH:mm')
                                                        : (rent.actualStart || 'Még nem indult')}
                                                </Table.Td>
                                                <Table.Td>
                                                    {parsedActualEndDate && parsedActualEndDate.isValid()
                                                        ? parsedActualEndDate.format('YYYY.MM.DD HH:mm')
                                                        : (rent.actualEnd || 'Még nem zárult le')}
                                                </Table.Td>
                                                <Table.Td>{rent.totalCost ? `${rent.totalCost} Ft` : '-'}</Table.Td>
                                            </Table.Tr>
                                        );
                                    })}
                                </Table.Tbody>
                            </Table>
                        ) : (
                            <Text>Nincsenek korábbi bérléseid.</Text>
                        )}
                    </Card>
                </>
            )}
        </Stack>
    );
};

export default ProfilePage;
