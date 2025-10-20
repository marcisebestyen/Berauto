import {useEffect, useState, useCallback} from 'react';
import {
    Title,
    Text,
    Button,
    Group,
    TextInput,
    Stack,
    Table,
    Grid,
    Center,
    Container,
    Paper,
    LoadingOverlay,
    Alert,
    SimpleGrid,
    ScrollArea,
    Badge,
} from '@mantine/core';
import {useForm} from '@mantine/form';
import {
    IconEdit,
    IconDeviceFloppy,
    IconX,
    IconAlertCircle,
    IconUser,
    IconMail,
    IconPhone,
    IconLicense,
    IconHome,
    IconUserCircle,
    IconHistory,
} from '@tabler/icons-react';
import useAuth from '../hooks/useAuth';
import api from '../api/api';
import {IUserProfile, IUserUpdateDto} from '../interfaces/IUser';
import {ISimpleRent} from '../interfaces/IRent';
import {notifications} from '@mantine/notifications';
import dayjs from 'dayjs';

interface JsonPatchOperation {
    op: "replace" | "add" | "remove" | "copy" | "move" | "test";
    path: string;
    value?: any;
    from?: string;
}

const InfoItem = ({icon, label, value}: { icon: React.ReactNode; label: string; value: string | null | undefined }) => (
    <Group wrap="nowrap" gap="sm">
        {icon}
        <Stack gap={0}>
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="sm">{value || '-'}</Text>
        </Stack>
    </Group>
);

const ProfilePage = () => {
    const {user} = useAuth();
    const [profileData, setProfileData] = useState<IUserProfile | null>(null);
    const [originalProfileDataForPatch, setOriginalProfileDataForPatch] = useState<IUserProfile | null>(null);
    const [userRents, setUserRents] = useState<ISimpleRent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<IUserUpdateDto>({
            initialValues: {firstName: '', lastName: '', email: '', phoneNumber: '', licenceId: '', address: ''},
            validate:
                {
                    firstName: (value) => {
                        if (!value || value.trim().length === 0) {
                            return 'A keresztnév megadása kötelező.';
                        }
                        if (value.trim().length < 2) {
                            return 'A keresztnévnek legalább 2 karakter hosszúnak kell lennie.';
                        }
                        return null;
                    },
                    lastName:
                        (value) => {
                            if (!value || value.trim().length === 0) {
                                return 'A vezetéknév megadása kötelező.';
                            }
                            if (value.trim().length < 2) {
                                return 'A vezetéknévnek legalább 2 karakter hosszúnak kell lennie.';
                            }
                            return null;
                        },
                    email:
                        (value) => {
                            if (!value || value.trim().length === 0) {
                                return 'Az e-mail cím megadása kötelező.';
                            }
                            if (!/^\S+@\S+$/.test(value)) {
                                return 'Érvénytelen e-mail formátum.';
                            }
                            return null;
                        },
                }
            ,
        })
    ;
    const {setValues, resetDirty} = form;
    const setAndResetForm = useCallback((data: IUserProfile) => {
        const values = {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phoneNumber: data.phoneNumber || undefined,
            licenceId: data.licenceId || undefined,
            address: data.address || undefined,
        };
        setValues(values);
        resetDirty(values);
        setOriginalProfileDataForPatch(data);
    }, [setValues, resetDirty]);

    useEffect(() => {
        if (!user?.id) {
            setIsLoading(false);
            setError("A profil megtekintéséhez be kell jelentkeznie.");
            return;
        }
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [profileRes, rentsRes] = await Promise.all([
                    api.Users.getProfileDetails(),
                    api.Users.getUserRents(user.id.toString())
                ]);
                setProfileData(profileRes.data);
                setAndResetForm(profileRes.data);
                setUserRents(rentsRes.data);
            } catch (err: any) {
                const errorMsg = 'Hiba történt a profiladatok betöltése közben.';
                setError(errorMsg);
                notifications.show({title: 'Betöltési Hiba', message: errorMsg, color: 'red'});
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
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

            const currentNormalized = (currentValue === null || currentValue === undefined) ? '' : String(currentValue).trim();
            const originalNormalized = (originalValue === null || originalValue === undefined) ? '' : String(originalValue).trim();

            if (currentNormalized !== originalNormalized) {
                const path = `/${key.charAt(0).toUpperCase() + key.slice(1)}`;
                patchOps.push({op: "replace", path: path, value: currentValue || null});
            }
        });

        if (patchOps.length === 0) {
            notifications.show({
                title: "Nincs változás",
                message: "Nem történt módosítás a profiladatokban.",
                color: "blue"
            });
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            await api.Users.updateProfile(patchOps);

            const sanitizedFormValues: Partial<IUserProfile> = {};

            (Object.keys(currentFormValues) as Array<keyof IUserUpdateDto>).forEach(key => {
                if (currentFormValues[key] === null) {
                    (sanitizedFormValues as any)[key] = undefined;
                } else {
                    (sanitizedFormValues as any)[key] = currentFormValues[key];
                }
            });

            const updatedProfile: IUserProfile = {
                ...originalProfileDataForPatch,
                ...sanitizedFormValues,
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
            console.error("Hiba profil mentése közben:", err);
            const errorMsg = err.response?.data?.errors
                ? Object.values(err.response.data.errors).flat().join('; ')
                : err.response?.data?.message || err.response?.data?.title || 'Hiba történt a profil mentése közben.';

            notifications.show({
                title: 'Mentési Hiba',
                message: errorMsg,
                color: 'red',
                icon: <IconAlertCircle/>,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <LoadingOverlay visible={true} overlayProps={{radius: "sm", blur: 2}}/>;
    }

    if (error) {
        return (
            <Container size="md" py={40}>
                <Center>
                    <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md" w="100%">
                        {error}
                        <Button component="a" href="/login" color="red" variant="light" mt="md">
                            Ugrás a bejelentkezéshez
                        </Button>
                    </Alert>
                </Center>
            </Container>
        );
    }

    if (!profileData) {
        return <Container size="md"><Text>Nincsenek megjeleníthető profiladatok.</Text></Container>;
    }

    return (
        <Container my="md">
            <Stack gap="lg">
                <Paper shadow="sm" p="lg" withBorder>
                    <Group justify="space-between" mb="md">
                        <Group gap="sm">
                            <IconUserCircle size={24}/>
                            <Title order={3}>Saját Profil</Title>
                        </Group>
                        {!isEditing && (
                            <Button
                                leftSection={<IconEdit size={16}/>}
                                onClick={() => setIsEditing(true)}
                                variant="light"
                            >
                                Szerkesztés
                            </Button>
                        )}
                    </Group>

                    {!isEditing ? (
                        <SimpleGrid cols={{base: 1, sm: 2}} spacing="md">
                            <InfoItem icon={<IconUser size={20}/>} label="Teljes Név"
                                      value={`${profileData.firstName} ${profileData.lastName}`}/>
                            <InfoItem icon={<IconUserCircle size={20}/>} label="Felhasználónév"
                                      value={profileData.userName}/>
                            <InfoItem icon={<IconMail size={20}/>} label="Email cím"
                                      value={profileData.email}/>
                            <InfoItem icon={<IconPhone size={20}/>} label="Telefonszám"
                                      value={profileData.phoneNumber}/>
                            <InfoItem icon={<IconLicense size={20}/>} label="Jogosítvány"
                                      value={profileData.licenceId}/>
                            <InfoItem icon={<IconHome size={20}/>} label="Lakcím"
                                      value={profileData.address}/>
                        </SimpleGrid>
                    ) : (
                        <form onSubmit={form.onSubmit(handleUpdateProfile)}>
                            <Stack>
                                <Grid>
                                    <Grid.Col span={{base: 12, md: 6}}><TextInput
                                        label="Vezetéknév" {...form.getInputProps('lastName')} /></Grid.Col>
                                    <Grid.Col span={{base: 12, md: 6}}><TextInput
                                        label="Keresztnév" {...form.getInputProps('firstName')} /></Grid.Col>
                                </Grid>
                                <TextInput label="Email cím" {...form.getInputProps('email')} />
                                <TextInput label="Telefonszám" {...form.getInputProps('phoneNumber')} />
                                <TextInput label="Jogosítvány száma" {...form.getInputProps('licenceId')} />
                                <TextInput label="Lakcím" {...form.getInputProps('address')} />
                                <Group justify="flex-start" mt="md">
                                    <Button type="submit" leftSection={<IconDeviceFloppy size={16}/>}
                                            loading={isLoading}>
                                        Mentés
                                    </Button>
                                    <Button variant="default" onClick={() => {
                                        setIsEditing(false);
                                        setAndResetForm(profileData);
                                    }} leftSection={<IconX size={16}/>}>
                                        Mégse
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    )}
                </Paper>

                <Paper shadow="sm" p="lg" withBorder>
                    <Group gap="sm" mb="md">
                        <IconHistory size={24}/>
                        <Title order={3}>Bérlési Előzmények</Title>
                    </Group>
                    {userRents.length > 0 ? (
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder miw={600}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Jármű</Table.Th>
                                        <Table.Th>Kezdet</Table.Th>
                                        <Table.Th>Vég</Table.Th>
                                        <Table.Th>Költség</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {userRents.map(rent => (
                                        <Table.Tr key={rent.id}>
                                            <Table.Td>{rent.carBrand} {rent.carModel}</Table.Td>
                                            <Table.Td>{rent.actualStart ? dayjs(rent.actualStart).format('YYYY.MM.DD') : '-'}</Table.Td>
                                            <Table.Td>{rent.actualEnd ? dayjs(rent.actualEnd).format('YYYY.MM.DD') : '-'}</Table.Td>
                                            <Table.Td>
                                                <Badge color="green" variant="light">
                                                    {rent.totalCost ? `${rent.totalCost.toLocaleString('hu-HU')} Ft` : 'N/A'}
                                                </Badge>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    ) : (
                        <Text c="dimmed">Nincsenek korábbi bérléseid.</Text>
                    )}
                </Paper>
            </Stack>
        </Container>
    );
};

export default ProfilePage;