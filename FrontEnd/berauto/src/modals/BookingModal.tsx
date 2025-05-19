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
import { useEffect, useState } from 'react'; // useCallback és useRef kivéve, ha később kellenek
import { notifications } from '@mantine/notifications';

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import 'dayjs/locale/hu';

import { IGuestRentCreateDto, IRentCreateDto } from '../interfaces/IRent';

dayjs.extend(customParseFormat);
dayjs.locale('hu');

// Props interfész kiegészítése az initialStartDate és initialEndDate mezőkkel
interface BookingModalProps {
    carId: number;
    opened: boolean;
    onClose: () => void;
    initialStartDate: Date | null; // <-- HOZZÁADVA
    initialEndDate: Date | null;   // <-- HOZZÁADVA
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
            // A form kezdeti értékei null-ok, a useEffect tölti fel őket az initial propokból, ha vannak
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

    // useEffect a form kitöltésére/resetelésére és a kezdeti dátumok beállítására
    useEffect(() => {
        if (opened) {
            let startToSet = initialStartDate;
            let endToSet = initialEndDate;

            // Ha a startToSet későbbi, mint az endToSet (az initial értékek miatt), akkor az endToSet-et is a startToSet-re állítjuk.
            if (startToSet && endToSet && startToSet > endToSet) {
                endToSet = startToSet;
            }

            if (user && user.id) { // Ha be van jelentkezve felhasználó
                form.setValues({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    licenceId: user.licenceId || '',
                    phoneNumber: user.phoneNumber || '',
                    plannedStart: startToSet, // Az átvett érték
                    plannedEnd: endToSet,     // Az átvett érték
                    requiresReceipt: form.values.requiresReceipt, // Megtartjuk a checkbox állapotát
                });
            } else { // Ha vendég
                form.setValues({
                    ...form.setInitialValues, // Visszaállítjuk a szöveges mezőket az alapra
                    plannedStart: startToSet, // De a dátumokat az átvett értékekre állítjuk
                    plannedEnd: endToSet,
                    requiresReceipt: false, // Alapértelmezett a checkbox-ra
                });
            }
        } else {
            form.reset(); // Modal bezárásakor ürítjük a formot
        }
    }, [opened, user, initialStartDate, initialEndDate, form.setValues, form.reset]);


    const handleSubmit = async (valuesToSubmit: typeof form.values) => {
        // ... (handleSubmit logika változatlan)
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
                    {/* ... TextInput mezők ... */}
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
                        maxDate={initialEndDate ? dayjs(initialEndDate).endOf('day').toDate() : undefined} // endOf('day') hogy az egész nap választható legyen
                        locale="hu"
                    />
                    {/* ... Checkbox és Gombok ... */}
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
