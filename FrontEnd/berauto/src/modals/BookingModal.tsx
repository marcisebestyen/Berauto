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
} from '@mantine/core';
import {useForm} from '@mantine/form';
import {DatePickerInput} from '@mantine/dates';
import useAuth from '../hooks/useAuth';
import api from '../api/api.ts';
import {useEffect, useState} from 'react';
import {notifications} from '@mantine/notifications';
import {
    IconUser,
    IconAt,
    IconPhone,
    IconLicense,
    IconCalendarEvent,
    IconCheck, IconUserCheck,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import 'dayjs/locale/hu';
import {IGuestRentCreateDto, IRentCreateDto} from '../interfaces/IRent';

dayjs.locale('hu');

interface BookingModalProps {
    carId: number;
    opened: boolean;
    onClose: () => void;
    initialStartDate: Date | null;
    initialEndDate: Date | null;
}

interface UserForBooking {
    id?: string | number;
    firstName?: string;
    lastName?: string;
    email?: string;
    licenceId?: string;
    phoneNumber?: string;
}

const BookingModal = ({carId, opened, onClose, initialStartDate, initialEndDate}: BookingModalProps) => {
    const {user}: { user: UserForBooking | null | undefined } = useAuth();
    const [loading, setLoading] = useState(false);

    const form = useForm({
        initialValues: {
            firstName: '', lastName: '', email: '', licenceId: '', phoneNumber: '',
            plannedStart: null as Date | null,
            plannedEnd: null as Date | null,
            invoiceRequest: false,
        },
        validate: {
            firstName: (v, values) => (!user && (!v || v.trim() === '') ? 'Keresztnév kötelező' : null),
            lastName: (v, values) => (!user && (!v || v.trim() === '') ? 'Vezetéknév kötelező' : null),
            email: (v, values) => (!user && !/^\S+@\S+$/.test(v) ? 'Hibás email cím' : null),
            plannedStart: (v) => (v ? null : 'Kezdési időpont kötelező'),
            plannedEnd: (v, values) => {
                if (!v) return 'Befejezési időpont kötelező';
                if (values.plannedStart && v < values.plannedStart) return 'A befejezés nem lehet korábbi a kezdésnél.';
                return null;
            },
        },
    });

    useEffect(() => {
        if (opened) {
            form.setValues({
                firstName: user?.firstName || '',
                lastName: user?.lastName || '',
                email: user?.email || '',
                licenceId: user?.licenceId || '',
                phoneNumber: user?.phoneNumber || '',
                plannedStart: initialStartDate,
                plannedEnd: initialEndDate,
                invoiceRequest: false,
            });
        }
    }, [opened, user, initialStartDate, initialEndDate]);


    const handleSubmit = async (values: typeof form.values) => {
        if (!values.plannedStart || !values.plannedEnd) return;

        setLoading(true);
        try {
            const utcStartDate = new Date(Date.UTC(values.plannedStart.getFullYear(), values.plannedStart.getMonth(), values.plannedStart.getDate()));
            const utcEndDate = new Date(Date.UTC(values.plannedEnd.getFullYear(), values.plannedEnd.getMonth(), values.plannedEnd.getDate()));

            if (user?.id) {
                const rentData: IRentCreateDto = {
                    carId: carId,
                    renterId: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
                    plannedStart: utcStartDate.toISOString(),
                    plannedEnd: utcEndDate.toISOString(),
                    invoiceRequest: values.invoiceRequest,
                };
                await api.Rents.createAuthenticatedRent(rentData);
            } else { // Guest user flow
                const guestData: IGuestRentCreateDto = {
                    carId: carId,
                    plannedStart: utcStartDate.toISOString(),
                    plannedEnd: utcEndDate.toISOString(),
                    invoiceRequest: values.invoiceRequest,
                    firstName: values.firstName, lastName: values.lastName, email: values.email,
                    phoneNumber: values.phoneNumber, licenceId: values.licenceId,
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

    return (
        <Modal opened={opened} onClose={onClose} title="Foglalás részletei" centered size="lg">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <LoadingOverlay visible={loading}/>
                <Stack>
                    {!isGuest ? (
                        <Accordion variant="separated" radius="md" defaultValue="user-data">
                            <Accordion.Item value="user-data">
                                <Accordion.Control icon={<IconUserCheck size={20} color="var(--mantine-color-teal-6)" />}>
                                    <Stack gap={0}>
                                        <Text size="sm" fw={500}>Bejelentkezve mint: {user.firstName} {user.lastName}</Text>
                                        <Text size="xs" c="dimmed">Az adataidat automatikusan kitöltöttük. Kattints a részletekért.</Text>
                                    </Stack>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap="xs" p="xs">
                                        <Group gap="xs">
                                            <IconAt size={16} stroke={1.5} />
                                            <Text size="sm">{user.email}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <IconPhone size={16} stroke={1.5} />
                                            <Text size="sm">{user.phoneNumber || 'Nincs megadva'}</Text>
                                        </Group>
                                        <Group gap="xs">
                                            <IconLicense size={16} stroke={1.5} />
                                            <Text size="sm">{user.licenceId || 'Nincs megadva'}</Text>
                                        </Group>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    ) : (
                        <Stack>
                            <Text size="sm" c="dimmed">Vendégként történő foglaláshoz kérjük, add meg az
                                adataidat.</Text>
                            <Grid>
                                <Grid.Col span={{base: 12, sm: 6}}><TextInput withAsterisk label="Vezetéknév"
                                                                              leftSection={<IconUser
                                                                                  size={16}/>} {...form.getInputProps('lastName')} /></Grid.Col>
                                <Grid.Col span={{base: 12, sm: 6}}><TextInput withAsterisk label="Keresztnév"
                                                                              leftSection={<IconUser
                                                                                  size={16}/>} {...form.getInputProps('firstName')} /></Grid.Col>
                            </Grid>
                            <TextInput withAsterisk label="Email" type="email"
                                       leftSection={<IconAt size={16}/>} {...form.getInputProps('email')} />
                            <Grid>
                                <Grid.Col span={{base: 12, sm: 6}}><TextInput label="Telefonszám"
                                                                              leftSection={<IconPhone
                                                                                  size={16}/>} {...form.getInputProps('phoneNumber')} /></Grid.Col>
                                <Grid.Col span={{base: 12, sm: 6}}><TextInput label="Jogosítvány"
                                                                              leftSection={<IconLicense
                                                                                  size={16}/>} {...form.getInputProps('licenceId')} /></Grid.Col>
                            </Grid>
                        </Stack>
                    )}

                    <Divider my="xs" label="Bérlés időtartama" labelPosition="center"/>

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
                            />
                        </Grid.Col>
                    </Grid>

                    <Checkbox
                        label="Számlát kérek a foglalásról" {...form.getInputProps('invoiceRequest', {type: 'checkbox'})}
                        mt="sm"/>

                    <Group justify="flex-end" mt="xl">
                        <Button variant="default" onClick={onClose}>Mégsem</Button>
                        <Button type="submit" loading={loading}>Foglalás megerősítése</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default BookingModal;