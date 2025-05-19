import {
    Modal,
    Button,
    TextInput,
    Stack,
    Group,
    Checkbox,
    LoadingOverlay,
    Alert,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePickerInput } from '@mantine/dates';
import useAuth from '../hooks/useAuth'; // Ellenőrizd az útvonalat
import api from '../api/api.ts';
import { useEffect, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
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
}

interface UserForBooking {
    id?: string | number;
    firstName?: string;
    lastName?: string;
    email?: string;
    licenceId?: string;
    phoneNumber?: string; // Hozzáadva a phoneNumber
}

const BookingModal = ({ carId, opened, onClose }: BookingModalProps) => {
    const { user }: { user: UserForBooking | null | undefined } = useAuth();
    const [loading, setLoading] = useState(false);

    const dateFormat = 'YYYY.MM.DD';

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            licenceId: '',
            phoneNumber: '', // Hozzáadva a phoneNumber
            plannedStart: null as Date | null,
            plannedEnd: null as Date | null,
            requiresReceipt: false,
        },
        validate: (values) => { // Átállás függvényszerű validációra a dinamikus szabályokhoz
            const errors: Record<string, string | null> = {
                firstName: (!values.firstName || values.firstName.trim() === '') ? 'Keresztnév kötelező' : null,
                lastName: (!values.lastName || values.lastName.trim() === '') ? 'Vezetéknév kötelező' : null,
                email: (/^\S+@\S+$/.test(values.email) ? null : 'Hibás email cím'),
                plannedStart: !values.plannedStart ? 'Kezdési időpont kötelező' : null,
                plannedEnd: !values.plannedEnd
                    ? 'Befejezési időpont kötelező'
                    : values.plannedStart && values.plannedEnd && values.plannedEnd < values.plannedStart
                        ? 'A befejezés nem lehet korábbi a kezdésnél'
                        : null,
                // A licenceId és phoneNumber kötelező, ha nincs bejelentkezett felhasználó (vendég)
                // Ha be van jelentkezve, akkor az ő adatai alapján töltődik, és lehet, hogy nem kötelező módosítani.
                // Most egységesen kötelezővé tesszük őket a formon, a kitöltést a user adatai segítik.
                licenceId: (!values.licenceId || values.licenceId.trim() === '') ? 'Jogosítvány szám kötelező' : null,
                phoneNumber: (!values.phoneNumber || values.phoneNumber.trim() === '') ? 'Telefonszám kötelező' : null,
            };
            // Távolítsuk el a null értékű hibákat, hogy csak a tényleges hibák maradjanak
            return Object.fromEntries(Object.entries(errors).filter(([_, v]) => v !== null));
        },
    });

    useEffect(() => {
        if (opened) {
            if (user && user.id) {
                form.setValues({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
                    email: user.email || '',
                    licenceId: user.licenceId || '',
                    phoneNumber: user.phoneNumber || '', // phoneNumber hozzáadva
                    plannedStart: form.values.plannedStart,
                    plannedEnd: form.values.plannedEnd,
                    requiresReceipt: form.values.requiresReceipt,
                });
            } else {
                // Vendég esetén az initialValues (üres stringek) érvényesülnek.
                // Ha a modal nyitva maradna és a user kijelentkezne, akkor reseteljük.
                // A modal bezárásakor történő reset ezt általában lefedi.
                if (form.values.firstName !== '' || form.values.lastName !== '' || form.values.email !== '') {
                    // form.reset(); // Csak akkor reset, ha tényleg volt benne adat és kijelentkezett a user
                }
            }
        } else {
            form.reset();
        }
    }, [opened, user, form.setValues, form.reset]); // form.values kivéve a függőségekből


    const handleSubmit = async (valuesToSubmit: typeof form.values) => {
        // A form.onSubmit már lefuttatta a validációt.
        // Ha ide eljut a kód, a mezőknek érvényesnek kell lenniük a 'validate' szabályok szerint.

        if (!valuesToSubmit.plannedStart || !valuesToSubmit.plannedEnd) {
            // Ez az ellenőrzés redundáns lehet, ha a validáció már kezeli, de biztonsági plusz.
            notifications.show({
                title: 'Hiba',
                message: 'A kezdési és befejezési dátum megadása kötelező.',
                color: 'red',
            });
            return;
        }
        if (!(valuesToSubmit.plannedStart instanceof Date) || !(valuesToSubmit.plannedEnd instanceof Date)) {
            notifications.show({
                title: 'Hiba',
                message: 'Belső hiba: érvénytelen dátum objektumok a form állapotában.',
                color: 'red',
            });
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
                notifications.show({
                    title: 'Sikeres foglalás',
                    message: 'Foglalásodat rögzítettük.',
                    color: 'green',
                });
            } else {
                // Vendég felhasználó foglalása
                // A validáció már biztosította, hogy a szükséges mezők ki vannak töltve.
                const guestRentData: IGuestRentCreateDto = {
                    firstName: valuesToSubmit.firstName,
                    lastName: valuesToSubmit.lastName,
                    email: valuesToSubmit.email,
                    phoneNumber: valuesToSubmit.phoneNumber, // Itt már nem kell || null, mert a validáció miatt nem lehet üres
                    licenceId: valuesToSubmit.licenceId,     // Itt már nem kell || null
                    carId: carId,
                    plannedStart: plannedStartISO,
                    plannedEnd: plannedEndISO,
                    invoiceRequest: valuesToSubmit.requiresReceipt,
                };
                await api.Rents.createGuestRent(guestRentData);
                notifications.show({
                    title: 'Sikeres foglalás (vendég)',
                    message: 'Foglalásodat rögzítettük. Hamarosan felvesszük veled a kapcsolatot.',
                    color: 'green',
                });
            }

            form.reset();
            onClose();
        } catch (error: any) {
            console.error('Foglalás hiba:', error);
            const errorMsg = error.response?.data?.message ||
                (error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join('; ') : null) ||
                error.message ||
                'Nem sikerült a foglalás. Kérlek próbáld újra.';
            notifications.show({
                title: 'Hiba',
                message: errorMsg,
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePlannedStartChange = (dateString: string | null): void => {
        if (dateString) {
            const parsedDate = dayjs(dateString, dateFormat, 'hu').toDate();
            form.setFieldValue('plannedStart', parsedDate);
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
                {!user && (
                    <Alert icon={<IconAlertCircle size="1rem" />} title="Vendégként foglalsz" color="blue" variant="light" mb="md">
                        Kérjük, add meg az adataidat a foglaláshoz. Adataidat csak a foglalás kezeléséhez használjuk.
                    </Alert>
                )}
                <Stack>
                    <TextInput label="Vezetéknév" placeholder="Kovács" {...form.getInputProps('lastName')} />
                    <TextInput label="Keresztnév" placeholder="István" {...form.getInputProps('firstName')} />
                    <TextInput label="Email" type="email" placeholder="email@example.com" {...form.getInputProps('email')} />
                    <TextInput label="Jogosítvány szám" placeholder="AB123456" {...form.getInputProps('licenceId')} />
                    {/* Telefonszám TextInput hozzáadva */}
                    <TextInput label="Telefonszám" placeholder="+36 30 123 4567" {...form.getInputProps('phoneNumber')} />

                    <DatePickerInput
                        label="Tervezett kezdés"
                        placeholder="Válassz dátumot"
                        value={form.values.plannedStart ? dayjs(form.values.plannedStart).format(dateFormat) : null}
                        onChange={handlePlannedStartChange}
                        valueFormat={dateFormat}
                        error={form.errors.plannedStart}
                        clearable={true}
                        minDate={new Date()}
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
                        minDate={form.values.plannedStart ? dayjs(form.values.plannedStart).add(0, 'day').toDate() : new Date()}
                        locale="hu"
                    />
                    <Checkbox
                        label="Számlát kérek"
                        {...form.getInputProps('requiresReceipt', { type: 'checkbox' })}
                    />
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
