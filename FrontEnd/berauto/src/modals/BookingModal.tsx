import {
    Modal,
    Button,
    TextInput,
    Stack,
    Group,
    Checkbox,
    LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePickerInput } from '@mantine/dates';
import useAuth from '../hooks/useAuth';
import api from '../api/api.ts';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/hu';

import { IGuestRentCreateDto, IRentCreateDto } from '../interfaces/IRent';

dayjs.extend(customParseFormat);
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

const BookingModal = ({ carId, opened, onClose, initialStartDate, initialEndDate }: BookingModalProps) => {
    const { user }: { user: UserForBooking | null | undefined } = useAuth();
    const [loading, setLoading] = useState(false);

    const dateFormat = 'YYYY.MM.DD';

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            licenceId: '',
            phoneNumber: '',
            plannedStart: null as Date | null,
            plannedEnd: null as Date | null,
            requiresReceipt: false,
        },
        validate: {
            firstName: (v: string) => (!v || v.trim() === '' ? 'Keresztnév kötelező' : null),
            lastName: (v: string) => (!v || v.trim() === '' ? 'Vezetéknév kötelező' : null),
            email: (v: string) => (/^\S+@\S+$/.test(v) ? null : 'Hibás email cím'),
            licenceId: (v: string) => (!v || v.trim() === '' ? 'Jogosítvány szám kötelező' : null),
            phoneNumber: (v: string) => (!v || v.trim() === '' ? 'Telefonszám kötelező' : null),
            plannedStart: (value: Date | null) => {
                if (!value) return 'Kezdési időpont kötelező';
                if (initialStartDate && dayjs(value).startOf('day').isBefore(dayjs(initialStartDate).startOf('day'))) {
                    return `A kezdés nem lehet korábbi, mint ${dayjs(initialStartDate).format(dateFormat)}`;
                }
                if (dayjs(value).startOf('day').isBefore(dayjs().startOf('day'))) {
                    return 'A kezdés nem lehet a mai napnál korábbi.';
                }
                return null;
            },
            plannedEnd: (value: Date | null, values: { plannedStart: Date | null }) => {
                if (!value) return 'Befejezési időpont kötelező';
                if (values.plannedStart && value < values.plannedStart) {
                    return 'A befejezés nem lehet korábbi a kezdésnél.';
                }
                if (initialEndDate && dayjs(value).startOf('day').isAfter(dayjs(initialEndDate).startOf('day'))) {
                    return `A befejezés nem lehet későbbi, mint ${dayjs(initialEndDate).format(dateFormat)}`;
                }
                return null;
            },
        },
    });

    useEffect(() => {
        if (opened) {
            let startToSet = initialStartDate;
            let endToSet = initialEndDate;


            if (startToSet && endToSet && startToSet > endToSet) {
                endToSet = startToSet;
            }

            if (user && user.id) {
                form.setValues({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    licenceId: user.licenceId || '',
                    phoneNumber: user.phoneNumber || '',
                    plannedStart: startToSet,
                    plannedEnd: endToSet,
                    requiresReceipt: form.values.requiresReceipt,
                });
            } else {
                form.setValues({
                    ...form.setInitialValues,
                    plannedStart: startToSet,
                    plannedEnd: endToSet,
                    requiresReceipt: false,
                });
            }
        } else {
            form.reset();
        }
    }, [opened, user, initialStartDate, initialEndDate, form.setValues, form.reset]);


    const handleSubmit = async (valuesToSubmit: typeof form.values) => {
        if (!valuesToSubmit.plannedStart || !valuesToSubmit.plannedEnd) {
            notifications.show({ title: 'Hiba', message: 'A kezdési és befejezési dátum megadása kötelező.', color: 'red', });
            return;
        }
        if (!(valuesToSubmit.plannedStart instanceof Date) || !(valuesToSubmit.plannedEnd instanceof Date)) {
            notifications.show({ title: 'Hiba', message: 'Belső hiba: érvénytelen dátum objektumok.', color: 'red', });
            return;
        }
        setLoading(true);
        try {
            const plannedStartISO = valuesToSubmit.plannedStart.toISOString();
            const plannedEndISO = valuesToSubmit.plannedEnd.toISOString();
            if (user && user.id) {
                const authenticatedRentData: IRentCreateDto = {
                    carId: carId,
                    renterId: typeof user.id === 'string' ? parseInt(user.id, 10) : user.id,
                    plannedStart: plannedStartISO,
                    plannedEnd: plannedEndISO,
                    invoiceRequest: valuesToSubmit.requiresReceipt,
                };
                await api.Rents.createAuthenticatedRent(authenticatedRentData);
                notifications.show({ title: 'Sikeres foglalás', message: 'Foglalásodat rögzítettük.', color: 'green', });
            } else {
                const guestRentData: IGuestRentCreateDto = {
                    firstName: valuesToSubmit.firstName, lastName: valuesToSubmit.lastName, email: valuesToSubmit.email,
                    phoneNumber: valuesToSubmit.phoneNumber, licenceId: valuesToSubmit.licenceId,
                    carId: carId, plannedStart: plannedStartISO, plannedEnd: plannedEndISO,
                    invoiceRequest: valuesToSubmit.requiresReceipt,
                };
                await api.Rents.createGuestRent(guestRentData);
                notifications.show({ title: 'Sikeres foglalás (vendég)', message: 'Foglalásodat rögzítettük.', color: 'green', });
            }
            form.reset();
            onClose();
        } catch (error: any) {
            console.error('Foglalás hiba:', error);
            const errorMsg = error.response?.data?.message ||
                (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join('; ') : null) ||
                error.message ||
                'Nem sikerült a foglalás. Kérlek próbáld újra.';
            notifications.show({ title: 'Hiba', message: errorMsg, color: 'red',});
        } finally { setLoading(false); }
    };

    const handlePlannedStartChange = (dateString: string | null): void => {
        if (dateString) {
            const parsedDate = dayjs(dateString, dateFormat, 'hu').toDate();
            form.setFieldValue('plannedStart', parsedDate);
            if (form.values.plannedEnd && parsedDate > form.values.plannedEnd) {
                form.setFieldValue('plannedEnd', null);
            }
        } else {
            form.setFieldValue('plannedStart', null);
        }
    };

    const handlePlannedEndChange = (dateString: string | null): void => {
        if (dateString) {
            const parsedDate = dayjs(dateString, dateFormat, 'hu').toDate();
            form.setFieldValue('plannedEnd', parsedDate);
        } else {
            form.setFieldValue('plannedEnd', null);
        }
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Foglalási adatok" centered size="md">
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <LoadingOverlay visible={loading} />
                <Stack>
                    <TextInput label="Vezetéknév" placeholder="Kovács" {...form.getInputProps('lastName')} />
                    <TextInput label="Keresztnév" placeholder="István" {...form.getInputProps('firstName')} />
                    <TextInput label="Email" type="email" placeholder="email@example.com" {...form.getInputProps('email')} />
                    <TextInput label="Jogosítvány szám" placeholder="AB123456" {...form.getInputProps('licenceId')} />
                    <TextInput label="Telefonszám" placeholder="06301234567" {...form.getInputProps('phoneNumber')} />

                    <DatePickerInput
                        label="Tervezett kezdés"
                        placeholder="Válassz dátumot"
                        value={form.values.plannedStart ? dayjs(form.values.plannedStart).format(dateFormat) : null}
                        onChange={handlePlannedStartChange}
                        valueFormat={dateFormat}
                        error={form.errors.plannedStart}
                        clearable={true}
                        minDate={initialStartDate ? dayjs(initialStartDate).startOf('day').toDate() : dayjs().startOf('day').toDate()}
                        locale="hu"
                    />
                    <DatePickerInput
                        label="Tervezett vége"
                        placeholder="Válassz dátumot"
                        value={form.values.plannedEnd ? dayjs(form.values.plannedEnd).format(dateFormat) : null}
                        onChange={handlePlannedEndChange}
                        valueFormat={dateFormat}
                        error={form.errors.plannedEnd}
                        clearable={true}
                        minDate={form.values.plannedStart ? dayjs(form.values.plannedStart).startOf('day').toDate() : (initialStartDate ? dayjs(initialStartDate).startOf('day').toDate() : dayjs().startOf('day').toDate())}
                        maxDate={initialEndDate ? dayjs(initialEndDate).endOf('day').toDate() : undefined}
                        locale="hu"
                    />
                    <Checkbox label="Számlát kérek" {...form.getInputProps('requiresReceipt', { type: 'checkbox' })} />
                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={onClose} mr="sm">Mégsem</Button>
                        <Button type="submit" loading={loading}>Foglalás megerősítése</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default BookingModal;
