import {
    Modal,
    Button,
    TextInput,
    Stack,
    Group,
    Checkbox,
    LoadingOverlay,
    Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePickerInput } from '@mantine/dates';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios.config.ts';
import { useEffect, useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';

interface BookingModalProps {
    carId: number;
    opened: boolean;
    onClose: () => void;
}

const BookingModal = ({ carId, opened, onClose }: BookingModalProps) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formFilled, setFormFilled] = useState(false);
    console.log('BookingModal rendered, user:', user, 'opened:', opened);

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            licenceId: '',
            plannedStart: null,
            plannedEnd: null,
            requiresReceipt: false,
        },
        validate: {
            firstName: (v: string) => (!v ? 'Keresztnév kötelező' : null),
            lastName: (v: string) => (!v ? 'Vezetéknév kötelező' : null),
            email: (v: string) => (/^\S+@\S+$/.test(v) ? null : 'Hibás email cím'),
            licenceId: (v: string) => (!v ? 'Jogosítvány szám kötelező' : null),
            plannedStart: (v: Date | null) => (!v ? 'Kezdési időpont kötelező' : null),
            plannedEnd: (value: Date | null, values: { plannedStart: Date | null }) =>
                !value
                    ? 'Befejezési időpont kötelező'
                    : value && values.plannedStart && value < values.plannedStart
                        ? 'A befejezés nem lehet korábbi a kezdésnél'
                        : null,
        },
    });

    // Az űrlap kitöltésének kezelése
    const fillFormWithUserData = useCallback(() => {
        if (user && Object.keys(user).length > 0) {
            console.log('Filling form with user data:', user);

            // Alapadatok beállítása a felhasználó adataival
            form.setFieldValue('firstName', user.firstName || '');
            form.setFieldValue('lastName', user.lastName || '');
            form.setFieldValue('email', user.email || '');
            form.setFieldValue('licenceId', user.licenceId || '');

            // Jelezzük, hogy az űrlap kitöltése megtörtént
            setFormFilled(true);
        } else {
            console.log('No user data available to fill the form');
        }
    }, [user, form]);

    // A modális megnyitásakor töltsük ki az űrlapot
    useEffect(() => {
        if (opened && user && !formFilled) {
            console.log('Modal opened, attempting to fill form with user data');
            fillFormWithUserData();
        }

        // Ha a modális bezáródik, állítsuk vissza a formFilled állapotot
        if (!opened) {
            setFormFilled(false);
        }
    }, [opened, user, fillFormWithUserData, formFilled]);

    // Ha a user adatok megváltoznak, miközben a modal nyitva van, frissítsük az űrlapot
    useEffect(() => {
        if (opened && user && !formFilled) {
            console.log('User data changed while modal is open, updating form');
            fillFormWithUserData();
        }
    }, [user, opened, fillFormWithUserData, formFilled]);

    const handleSubmit = async (values: typeof form.values) => {
        try {
            setLoading(true);
            console.log('Submitting booking form with values:', values);

            await axiosInstance.post('/rent/create', {
                carId,
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                licenceId: values.licenceId,
                plannedStart: values.plannedStart,
                plannedEnd: values.plannedEnd,
                requiresReceipt: values.requiresReceipt,
            });

            notifications.show({
                title: 'Sikeres foglalás',
                message: 'Az autó foglalása sikeresen rögzítve lett.',
                color: 'green',
            });

            form.reset();
            setFormFilled(false);
            onClose();
        } catch (error) {
            console.error('Foglalás hiba:', error);
            notifications.show({
                title: 'Hiba',
                message: 'Nem sikerült a foglalás. Kérlek próbáld újra.',
                color: 'red',
            });
        } finally {
            setLoading(false);
        }
    };

    // Segédfüggvény az űrlap állapotának ellenőrzésére
    const isFormAutofilled = () => {
        return (
            form.values.firstName !== '' &&
            form.values.lastName !== '' &&
            form.values.email !== '' &&
            form.values.licenceId !== ''
        );
    };

    return (
        <Modal opened={opened} onClose={onClose} title="Foglalási adatok" centered>
            <form onSubmit={form.onSubmit(handleSubmit)}>
                <LoadingOverlay visible={loading} />

                {user && !isFormAutofilled() && (
                    <Button
                        onClick={fillFormWithUserData}
                        fullWidth
                        variant="subtle"
                        mb="md"
                    >
                        Adatok automatikus kitöltése
                    </Button>
                )}

                {!user && (
                    <Text color="dimmed" size="sm" mb="md">
                        Bejelentkezés után az adataid automatikusan kitöltődnek
                    </Text>
                )}

                <Stack>
                    <TextInput label="Vezetéknév" {...form.getInputProps('lastName')} />
                    <TextInput label="Keresztnév" {...form.getInputProps('firstName')} />
                    <TextInput label="Email" {...form.getInputProps('email')} />
                    <TextInput label="Jogosítvány szám" {...form.getInputProps('licenceId')} />

                    <DatePickerInput
                        label="Tervezett kezdés"
                        valueFormat="YYYY.MM.DD"
                        clearable={false}
                        {...form.getInputProps('plannedStart')}
                    />
                    <DatePickerInput
                        label="Tervezett vége"
                        valueFormat="YYYY.MM.DD"
                        clearable={false}
                        minDate={form.values.plannedStart || undefined}
                        {...form.getInputProps('plannedEnd')}
                    />

                    <Checkbox
                        label="Számlát kérek"
                        {...form.getInputProps('requiresReceipt', { type: 'checkbox' })}
                    />

                    <Group justify="flex-end" mt="md">
                        <Button variant="outline" onClick={onClose} mr="sm">Mégsem</Button>
                        <Button type="submit">Foglalás megerősítése</Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
};

export default BookingModal;