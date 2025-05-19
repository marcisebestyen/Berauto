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
    Alert,
    Grid,
    Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconDeviceFloppy, IconX, IconAlertCircle } from '@tabler/icons-react';
import useAuth from '../hooks/useAuth';
import api from '../api/api';
// Győződj meg róla, hogy az ISimpleRent interfész itt a helyeset importálja,
// és hogy az tartalmazza az actualStart és actualEnd mezőket (lehetnek string | null).
import { IUserProfile, IUserUpdateDto, ISimpleRent } from '../interfaces/IUser';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

// JSON Patch művelet interfésze (egyszerűsített)
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
            phoneNumber: data.phoneNumber || null,
            licenceId: data.licenceId || null,
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
                    const profileRes = await api.Users.getProfileDetails(user.id.toString());
                    setProfileData(profileRes.data);
                    setAndResetForm(profileRes.data);

                    const rentsRes = await api.Users.getUserRents(user.id.toString());
                    console.log("Kapott bérlési adatok (userRents nyers):", rentsRes.data);
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
        if (!user?.id || !originalProfileDataForPatch) { /* ... */ return; }
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
        if (patchOps.length === 0) { /* ... */ return; }
        setIsLoading(true);
        try {
            await api.Users.updateProfile(user.id.toString(), patchOps);
            const updatedProfile: IUserProfile = {
                ...originalProfileDataForPatch, ...currentFormValues,
                id: originalProfileDataForPatch.id, userName: originalProfileDataForPatch.userName,
            };
            setProfileData(updatedProfile); setAndResetForm(updatedProfile); setIsEditing(false);
            notifications.show({ title: 'Sikeres Mentés', message: 'A profiladataid frissültek.', color: 'green', });
        } catch (err: any) { /* ... hibaüzenet ... */ } finally { setIsLoading(false); }
    };

    if (isLoading && !profileData && !error && !isEditing) { /* ... Loader ... */ }
    if (error && !profileData) { /* ... Error Alert ... */ }
    if (!user || !profileData) { if(!error) { /* ... Profiladatok nem elérhetők ... */ } }

    return (
        <Stack gap="lg">
            {profileData && (
                <>
                    {/* Profilom kártya (változatlan) */}
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
                            </Stack>
                        ) : (
                            <form onSubmit={form.onSubmit(handleUpdateProfile)}>
                                <Stack>
                                    {/* Form mezők (változatlanok) */}
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

                    {/* Korábbi Bérléseim kártya */}
                    <Card shadow="sm" padding="lg" radius="md" withBorder>
                        <Title order={4} mb="sm">Korábbi Bérléseim</Title>
                        {userRents.length > 0 ? (
                            <Table striped highlightOnHover withTableBorder withColumnBorders>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Autó</Table.Th>
                                        <Table.Th>Bérlés Kezdete (Tényleges)</Table.Th> {/* Fejléc módosítva */}
                                        <Table.Th>Bérlés Vége (Tényleges)</Table.Th>   {/* Fejléc módosítva */}
                                        <Table.Th>Költség</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {userRents.map(rent => {
                                        // Logoljuk ki a nyers dátum stringeket minden egyes bérlésnél, beleértve az actual-okat
                                        console.log(
                                            `Rent ID: ${rent.id}, ` +
                                            `Raw plannedStart: "${rent.plannedStart}", Raw plannedEnd: "${rent.plannedEnd}", ` +
                                            `Raw actualStart: "${rent.actualStart}", Raw actualEnd: "${rent.actualEnd}"`
                                        );

                                        // Parsoljuk a TÉNYLEGES dátumokat
                                        const parsedActualStartDate = rent.actualStart ? dayjs(rent.actualStart) : null;
                                        const parsedActualEndDate = rent.actualEnd ? dayjs(rent.actualEnd) : null;

                                        if (rent.actualStart && !parsedActualStartDate?.isValid()) {
                                            console.warn(`Rent ID: ${rent.id}, Invalid actualStart: "${rent.actualStart}"`);
                                        }
                                        if (rent.actualEnd && !parsedActualEndDate?.isValid()) {
                                            console.warn(`Rent ID: ${rent.id}, Invalid actualEnd: "${rent.actualEnd}"`);
                                        }

                                        return (
                                            <Table.Tr key={rent.id}>
                                                <Table.Td>{rent.carBrand} {rent.carModel}</Table.Td>
                                                <Table.Td>
                                                    {/* MÓDOSÍTVA: actualStart használata */}
                                                    {parsedActualStartDate && parsedActualStartDate.isValid()
                                                        ? parsedActualStartDate.format('YYYY.MM.DD HH:mm')
                                                        : (rent.actualStart || 'Még nem indult')}
                                                </Table.Td>
                                                <Table.Td>
                                                    {/* MÓDOSÍTVA: actualEnd használata */}
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
