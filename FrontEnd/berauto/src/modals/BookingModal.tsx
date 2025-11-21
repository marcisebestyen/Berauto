import {
    Modal,
    Button,
    TextInput,
    Stack,
    Group,
    Checkbox,
    LoadingOverlay,
    Grid,
    Text,
    Divider,
    Accordion,
    Select,
} from '@mantine/core';
import {useForm} from '@mantine/form';
import {DatePickerInput} from '@mantine/dates';
import useAuth from '../hooks/useAuth';
import api from '../api/api.ts';
import {useEffect, useState, useCallback} from 'react';
import {notifications} from '@mantine/notifications';
import {
    IconUser,
    IconAt,
    IconPhone,
    IconLicense,
    IconCalendarEvent,
    IconCheck,
    IconUserCheck,
    IconBookmark,
    IconMapPin,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/hu';
import {IGuestRentCreateDto, IRentCreateDto} from '../interfaces/IRent';
import {IDepot} from "../interfaces/IDepot.ts";

dayjs.locale('hu');

interface BookingModalProps {
    carId: number;
    opened: boolean;
    onClose: () => void;
    initialStartDate: Date | null;
    initialEndDate: Date | null;
    initialDepotId: number | null;
    depots: IDepot[];
}

interface UserForBooking {
    id?: string | number;
    firstName?: string;
    lastName?: string;
    email?: string;
    licenceId?: string;
    phoneNumber?: string;
}

const BookingModal = ({
                          carId,
                          opened,
                          onClose,
                          initialStartDate,
                          initialEndDate,
                          initialDepotId,
                          depots
                      }: BookingModalProps) => {
    const {user}: { user: UserForBooking | null | undefined } = useAuth();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            licenceId: '',
            phoneNumber: '',
            plannedStart: null as Date | null,
            plannedEnd: null as Date | null,
            pickUpDepotId: '',
            invoiceRequest: false,
        },
        validate: {
            firstName: (v) => (!user && (!v || v.trim() === '') ? 'Keresztnév kötelező' : null),
            lastName: (v) => (!user && (!v || v.trim() === '') ? 'Vezetéknév kötelező' : null),
            email: (v) => (!user && !/^\S+@\S+$/.test(v) ? 'Hibás email cím' : null),
            plannedStart: (v) => (v ? null : 'Kezdési időpont kötelező'),
            plannedEnd: (v, values) => {
                if (!v) return 'Befejezési időpont kötelező';
                if (values.plannedStart && v < values.plannedStart) return 'A befejezés nem lehet korábbi a kezdésnél.';
                return null;
            },
            pickUpDepotId: (v) => (!v || v.trim() === '' ? 'Telephely kiválasztása kötelező' : null),
        },
    });

    const initializeForm = useCallback(() => {
        form.setValues({
            firstName: user?.firstName || '',
            lastName: user?.lastName || '',
            email: user?.email || '',
            licenceId: user?.licenceId || '',
            phoneNumber: user?.phoneNumber || '',
            plannedStart: initialStartDate,
            plannedEnd: initialEndDate,
            pickUpDepotId: initialDepotId ? initialDepotId.toString() : '',
            invoiceRequest: false,
        });
    }, [user, initialStartDate, initialEndDate, initialDepotId]);

    useEffect(() => {
        if (opened) {
            initializeForm();
        }
    }, [opened, initializeForm]);

    const handleSubmit = async (values: typeof form.values) => {
        if (!values.plannedStart || !values.plannedEnd || !values.pickUpDepotId) return;

        setLoading(true);
        try {
            const utcStartDate = new Date(Date.UTC(
                values.plannedStart.getFullYear(),
                values.plannedStart.getMonth(),
                values.plannedStart.getDate()
            ));
            const utcEndDate = new Date(Date.UTC(
                values.plannedEnd.getFullYear(),
                values.plannedEnd.getMonth(),
                values.plannedEnd.getDate()
            ));

            const pickUpDepotId = parseInt(values.pickUpDepotId, 10);

            if (user?.id) {
                const rentData: IRentCreateDto = {
                    carId: carId,
                    renterId: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
                    plannedStart: utcStartDate.toISOString(),
                    plannedEnd: utcEndDate.toISOString(),
                    pickUpDepotId: pickUpDepotId,
                    invoiceRequest: values.invoiceRequest,
                };
                await api.Rents.createAuthenticatedRent(rentData);
            } else {
                const guestData: IGuestRentCreateDto = {
                    carId: carId,
                    plannedStart: utcStartDate.toISOString(),
                    plannedEnd: utcEndDate.toISOString(),
                    pickUpDepotId: pickUpDepotId,
                    invoiceRequest: values.invoiceRequest,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    email: values.email,
                    phoneNumber: values.phoneNumber,
                    licenceId: values.licenceId,
                };
                await api.Rents.createGuestRent(guestData);
            }

            notifications.show({
                title: 'Sikeres foglalás!',
                message: 'Kérésedet rögzítettük, hamarosan felvesszük veled a kapcsolatot.',
                color: 'green',
                icon: <IconCheck/>
            });
            form.reset();
            onClose();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'A foglalás nem sikerült. Kérjük, ellenőrizd az adatokat.';
            notifications.show({title: 'Hiba', message: errorMsg, color: 'red'});
        } finally {
            setLoading(false);
        }
    };

    const isGuest = !user;

    const inputStyles = {
        input: {
            background: 'rgba(15, 23, 42, 0.5)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
        }
    };

    const depotSelectData = depots.map(depot => ({
        value: depot.id.toString(),
        label: `${depot.name} - ${depot.city}, ${depot.street} ${depot.houseNumber}`
    }));

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="sm">
                    <IconBookmark size={20} />
                    <Text fw={700} size="lg">Foglalás részletei</Text>
                </Group>
            }
            centered
            size="lg"
            styles={{
                content: {
                    background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                },
                header: {
                    background: 'transparent',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                },
                title: {
                    color: '#FFF',
                },
                body: {
                    paddingBottom: 'var(--mantine-spacing-xl)',
                }
            }}
        >
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <LoadingOverlay visible={loading} overlayProps={{radius: 'sm', blur: 2}}/>
                <Stack>
                    {!isGuest ? (
                        <Accordion
                            variant="separated"
                            radius="md"
                            defaultValue="user-data"
                            styles={{
                                item: {
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderColor: 'rgba(255, 255, 255, 0.1)',
                                },
                                control: {
                                    '&:hover': {
                                        background: 'rgba(30, 41, 59, 0.5)',
                                    }
                                },
                                panel: {
                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                }
                            }}
                        >
                            <Accordion.Item value="user-data">
                                <Accordion.Control icon={<IconUserCheck size={20} color="var(--mantine-color-teal-6)"/>}>
                                    <Stack gap={0}>
                                        <Text size="sm" fw={500}>Bejelentkezve mint: {user.firstName} {user.lastName}</Text>
                                        <Text size="xs" c="dimmed">Az adataidat automatikusan kitöltöttük. Kattints a részletekért.</Text>
                                    </Stack>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="xs" p="xs">
                                        <Group gap="xs">
                                            <IconAt size={16} stroke={1.5}/>
                                            <Text size="sm">{user.email}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <IconPhone size={16} stroke={1.5}/>
                                            <Text size="sm">{user.phoneNumber || 'Nincs megadva'}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <IconLicense size={16} stroke={1.5}/>
                                            <Text size="sm">{user.licenceId || 'Nincs megadva'}</Text>
                                        </Group>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    ) : (
                        <Stack>
                            <Text size="sm" c="dimmed">Vendégként történő foglaláshoz kérjük, add meg az adataidat.</Text>
                            <Grid>
                                <Grid.Col span={{base: 12, sm: 6}}>
                                    <TextInput
                                        withAsterisk
                                        label="Vezetéknév"
                                        leftSection={<IconUser size={16}/>}
                                        {...form.getInputProps('lastName')}
                                        styles={inputStyles}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{base: 12, sm: 6}}>
                                    <TextInput
                                        withAsterisk
                                        label="Keresztnév"
                                        leftSection={<IconUser size={16}/>}
                                        {...form.getInputProps('firstName')}
                                        styles={inputStyles}
                                    />
                                </Grid.Col>
                            </Grid>
                            <TextInput
                                withAsterisk
                                label="Email"
                                type="email"
                                leftSection={<IconAt size={16}/>}
                                {...form.getInputProps('email')}
                                styles={inputStyles}
                            />
                            <Grid>
                                <Grid.Col span={{base: 12, sm: 6}}>
                                    <TextInput
                                        label="Telefonszám"
                                        leftSection={<IconPhone size={16}/>}
                                        {...form.getInputProps('phoneNumber')}
                                        styles={inputStyles}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{base: 12, sm: 6}}>
                                    <TextInput
                                        label="Jogosítvány"
                                        leftSection={<IconLicense size={16}/>}
                                        {...form.getInputProps('licenceId')}
                                        styles={inputStyles}
                                    />
                                </Grid.Col>
                            </Grid>
                        </Stack>
                    )}

                    <Divider my="xs" label="Bérlés részletei" labelPosition="center" opacity={0.1}/>

                    <Grid>
                        <Grid.Col span={{base: 12, sm: 6}}>
                            <DatePickerInput
                                withAsterisk
                                label="Bérlés kezdete"
                                leftSection={<IconCalendarEvent size={16}/>}
                                {...form.getInputProps('plannedStart')}
                                minDate={dayjs().startOf('day').toDate()}
                                valueFormat='YYYY.MM.DD'
                                locale='hu'
                                styles={inputStyles}
                            />
                        </Grid.Col>
                        <Grid.Col span={{base: 12, sm: 6}}>
                            <DatePickerInput
                                withAsterisk
                                label="Bérlés vége"
                                leftSection={<IconCalendarEvent size={16}/>}
                                {...form.getInputProps('plannedEnd')}
                                minDate={form.values.plannedStart || dayjs().startOf('day').toDate()}
                                valueFormat='YYYY.MM.DD'
                                locale='hu'
                                styles={inputStyles}
                            />
                        </Grid.Col>
                    </Grid>

                    <Select
                        withAsterisk
                        label="Átvételi telephely"
                        placeholder="Válassz telephelyet"
                        leftSection={<IconMapPin size={16}/>}
                        data={depotSelectData}
                        {...form.getInputProps('pickUpDepotId')}
                        styles={inputStyles}
                    />

                    <Checkbox
                        label="Számlát kérek a foglalásról"
                        {...form.getInputProps('invoiceRequest', {type: 'checkbox'})}
                        mt="sm"
                    />

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={onClose}>Mégsem</Button>
                        <Button
                            type="submit"
                            loading={loading}
                            style={{
                                background: 'linear-gradient(45deg, #3b82f6 0%, #06b6d4 100%)',
                                fontWeight: 600,
                            }}
                        >
                            Foglalás megerősítése
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default BookingModal;