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
    Container,
    Paper,
    LoadingOverlay,
    Alert,
    SimpleGrid,
    ScrollArea,
    Badge,
    Card,
    ThemeIcon,
    Box,
    Divider,
    ActionIcon,
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
    IconCalendar,
    IconCurrencyForint,
    IconCar,
    IconDownload,
    IconCheck,
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

const StatCard = ({icon, label, value, color}: {icon: React.ReactNode; label: string; value: string; color: string}) => (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    }}
          onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.4)';
          }}
          onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '';
          }}>
        <Group justify="space-between" align="flex-start">
            <Box>
                <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
                <Text size="xl" fw={700} mt="xs">{value}</Text>
            </Box>
            <ThemeIcon size="lg" radius="md" variant="light" color={color}>
                {icon}
            </ThemeIcon>
        </Group>
    </Card>
);

const InfoItem = ({icon, label, value}: { icon: React.ReactNode; label: string; value: string | null | undefined }) => (
    <Group wrap="nowrap" gap="sm" p="sm" style={{
        borderRadius: '8px',
        transition: 'background 0.2s ease',
    }}
           onMouseEnter={(e) => {
               e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
           }}
           onMouseLeave={(e) => {
               e.currentTarget.style.background = 'transparent';
           }}>
        <ThemeIcon size="lg" radius="md" variant="light" color="blue">
            {icon}
        </ThemeIcon>
        <Stack gap={0}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>{label}</Text>
            <Text size="sm" fw={500}>{value || '-'}</Text>
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
    const [downloadingId, setDownloadingId] = useState<number | null>(null);

    const form = useForm<IUserUpdateDto>({
        initialValues: {firstName: '', lastName: '', email: '', phoneNumber: '', licenceId: '', address: ''},
        validate: {
            firstName: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'A keresztnév megadása kötelező.';
                }
                if (value.trim().length < 2) {
                    return 'A keresztnévnek legalább 2 karakter hosszúnak kell lennie.';
                }
                return null;
            },
            lastName: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'A vezetéknév megadása kötelező.';
                }
                if (value.trim().length < 2) {
                    return 'A vezetéknévnek legalább 2 karakter hosszúnak kell lennie.';
                }
                return null;
            },
            email: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'Az e-mail cím megadása kötelező.';
                }
                if (!/^\S+@\S+$/.test(value)) {
                    return 'Érvénytelen e-mail formátum.';
                }
                return null;
            },
        },
    });

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

    const handleDownloadReceipt = async (rentId: number, carModel: string) => {
        setDownloadingId(rentId);
        notifications.show({
            id: `download-${rentId}`,
            title: 'Letöltés indítása',
            message: `Számla letöltése (${carModel})...`,
            color: 'blue',
            loading: true,
            autoClose: false,
        });

        try {
            const response = await api.Receipts.downloadReceipt(rentId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const contentDisposition = response.headers['content-disposition'];
            let fileName = `szamla_${rentId}.pdf`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (fileNameMatch && fileNameMatch.length > 1) {
                    fileName = fileNameMatch[1];
                }
            }

            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();

            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);

            notifications.update({
                id: `download-${rentId}`,
                title: 'Sikeres letöltés',
                message: `A számla letöltve: ${fileName}`,
                color: 'green',
                icon: <IconCheck/>,
                loading: false,
                autoClose: 5000,
            });

        } catch (err: any) {
            console.error("Számla letöltési hiba:", err);
            notifications.update({
                id: `download-${rentId}`,
                title: 'Letöltési Hiba',
                message: 'A számla letöltése nem sikerült.',
                color: 'red',
                icon: <IconAlertCircle/>,
                loading: false,
                autoClose: 5000,
            });
        } finally {
            setDownloadingId(null);
        }
    };

    const totalRents = userRents.length;
    const totalSpent = userRents.reduce((sum, rent) => sum + (rent.totalCost || 0), 0);
    const activeRents = userRents.filter(rent => !rent.actualEnd).length;

    if (isLoading) {
        return <LoadingOverlay visible={true} overlayProps={{radius: "sm", blur: 2}}/>;
    }

    if (error) {
        return (
            <Container size="md" py={40}>
                <Alert icon={<IconAlertCircle size="1rem"/>} title="Hiba!" color="red" radius="md">
                    {error}
                    <Button component="a" href="/login" color="red" variant="light" mt="md">
                        Ugrás a bejelentkezéshez
                    </Button>
                </Alert>
            </Container>
        );
    }

    if (!profileData) {
        return <Container size="md"><Text>Nincsenek megjeleníthető profiladatok.</Text></Container>;
    }

    return (
        <Container size="xl" my="xl">
            <Stack gap="xl">
                <Box>
                    <Title order={1} size="h2" fw={900} style={{
                        background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem',
                    }}>
                        Saját Profil
                    </Title>
                    <Text c="dimmed" size="sm">Kezeld a profiladataidat és tekintsd meg a bérlési előzményeidet</Text>
                </Box>

                <SimpleGrid cols={{base: 1, sm: 3}} spacing="lg">
                    <StatCard
                        icon={<IconCar size={24} />}
                        label="Összes bérlés"
                        value={totalRents.toString()}
                        color="blue"
                    />
                    <StatCard
                        icon={<IconCurrencyForint size={24} />}
                        label="Összes költés"
                        value={`${totalSpent.toLocaleString('hu-HU')} Ft`}
                        color="green"
                    />
                    <StatCard
                        icon={<IconCalendar size={24} />}
                        label="Aktív bérlések"
                        value={activeRents.toString()}
                        color="cyan"
                    />
                </SimpleGrid>

                <Paper shadow="md" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Group justify="space-between" mb="xl">
                        <Group gap="sm">
                            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                                <IconUserCircle size={28}/>
                            </ThemeIcon>
                            <Box>
                                <Title order={3} size="h4">Személyes Adatok</Title>
                                <Text size="sm" c="dimmed">Frissítsd az adataidat</Text>
                            </Box>
                        </Group>
                        {!isEditing && (
                            <Button
                                leftSection={<IconEdit size={16}/>}
                                onClick={() => setIsEditing(true)}
                                variant="light"
                                size="sm"
                            >
                                Szerkesztés
                            </Button>
                        )}
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

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
                            <Stack gap="md">
                                <Grid>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <TextInput
                                            label="Vezetéknév"
                                            placeholder="Vezetéknév"
                                            {...form.getInputProps('lastName')}
                                        />
                                    </Grid.Col>
                                    <Grid.Col span={{base: 12, md: 6}}>
                                        <TextInput
                                            label="Keresztnév"
                                            placeholder="Keresztnév"
                                            {...form.getInputProps('firstName')}
                                        />
                                    </Grid.Col>
                                </Grid>
                                <TextInput
                                    label="Email cím"
                                    placeholder="email@example.com"
                                    {...form.getInputProps('email')}
                                />
                                <TextInput
                                    label="Telefonszám"
                                    placeholder="06301234567"
                                    {...form.getInputProps('phoneNumber')}
                                />
                                <TextInput
                                    label="Jogosítvány száma"
                                    placeholder="AB12345"
                                    {...form.getInputProps('licenceId')}
                                />
                                <TextInput
                                    label="Lakcím"
                                    placeholder="Budapest, Rákóczi út 76."
                                    {...form.getInputProps('address')}
                                />
                                <Group justify="flex-start" mt="md">
                                    <Button
                                        type="submit"
                                        leftSection={<IconDeviceFloppy size={16}/>}
                                        loading={isLoading}
                                        size="sm"
                                    >
                                        Mentés
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setAndResetForm(profileData);
                                        }}
                                        leftSection={<IconX size={16}/>}
                                        size="sm"
                                    >
                                        Mégse
                                    </Button>
                                </Group>
                            </Stack>
                        </form>
                    )}
                </Paper>

                <Paper shadow="md" p="xl" withBorder style={{
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.3) 0%, rgba(15, 23, 42, 0.5) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                }}>
                    <Group gap="sm" mb="xl">
                        <ThemeIcon size="xl" radius="md" variant="light" color="cyan">
                            <IconHistory size={28}/>
                        </ThemeIcon>
                        <Box>
                            <Title order={3} size="h4">Bérlési Előzmények</Title>
                            <Text size="sm" c="dimmed">Az összes korábbi bérlésed</Text>
                        </Box>
                    </Group>

                    <Divider mb="xl" opacity={0.1} />

                    {userRents.length > 0 ? (
                        <ScrollArea>
                            <Table striped highlightOnHover withTableBorder miw={700} style={{
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Jármű</Table.Th>
                                        <Table.Th>Kezdet</Table.Th>
                                        <Table.Th>Vég</Table.Th>
                                        <Table.Th>Költség</Table.Th>
                                        <Table.Th>Számla</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {userRents.map(rent => (
                                        <Table.Tr key={rent.id}>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <ThemeIcon size="sm" radius="sm" variant="light" color="blue">
                                                        <IconCar size={14} />
                                                    </ThemeIcon>
                                                    <Text fw={500}>{rent.carBrand} {rent.carModel}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">
                                                    {rent.actualStart ? dayjs(rent.actualStart).format('YYYY.MM.DD') : '-'}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text size="sm">
                                                    {rent.actualEnd ? dayjs(rent.actualEnd).format('YYYY.MM.DD') :
                                                        <Badge color="orange" variant="light" size="sm">Folyamatban</Badge>}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Badge color="green" variant="light" size="lg">
                                                    {rent.totalCost ? `${rent.totalCost.toLocaleString('hu-HU')} Ft` : 'N/A'}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                {rent.totalCost ? (
                                                    <ActionIcon
                                                        variant="light"
                                                        color="blue"
                                                        size="sm"
                                                        onClick={() => handleDownloadReceipt(rent.id, `${rent.carBrand} ${rent.carModel}`)}
                                                        loading={downloadingId === rent.id}
                                                        title="Számla letöltése"
                                                    >
                                                        <IconDownload size={16} />
                                                    </ActionIcon>
                                                ) : (
                                                    <Text size="xs" c="dimmed">-</Text>
                                                )}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>
                    ) : (
                        <Box py="xl" style={{textAlign: 'center'}}>
                            <ThemeIcon size={64} radius="xl" variant="light" color="gray" mx="auto" mb="md">
                                <IconHistory size={32} />
                            </ThemeIcon>
                            <Text c="dimmed" fw={500}>Nincsenek korábbi bérléseid</Text>
                            <Text c="dimmed" size="sm" mt="xs">Bérelj egy autót, hogy itt megjelenjenek az előzményeid!</Text>
                        </Box>
                    )}
                </Paper>
            </Stack>
        </Container>
    );
};

export default ProfilePage;