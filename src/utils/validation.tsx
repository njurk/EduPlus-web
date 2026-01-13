import type { GradeDto } from "../types";

export const REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    POSTAL_CODE: /^\d{2}-\d{3}$/,
    PHONE: /^[0-9+\- ]*$/,
    PHONE_LENGTH: 9,
    CLASS_LETTER: /^[A-Z]$/
};

export const PASSWORD_RULES = [
    { label: "Min. 8 znaków", test: (p: string) => p.length >= 8 },
    { label: "Min. 1 duża litera", test: (p: string) => /[A-Z]/.test(p) },
    { label: "Min. 1 cyfra", test: (p: string) => /[0-9]/.test(p) },
    { label: "Min. 1 znak specjalny", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

export const validateUserField = (name: string, value: any, isEdit: boolean): string | null => {
    const valStr = value?.toString().trim() || "";

    if (!valStr && !['password', 'phone', 'street', 'city', 'postalCode'].includes(name)) {
        return "Pole wymagane";
    }

    if (name === 'email' && !REGEX.EMAIL.test(valStr)) {
        return "Nieprawidłowy email";
    }

    if (name === 'password') {
        if (!isEdit && !valStr) return "Pole wymagane";
        if (valStr && !isPasswordValid(valStr)) return "Hasło nie spełnia wymogów";
    }

    if (name === 'postalCode' && valStr && !REGEX.POSTAL_CODE.test(valStr)) {
        return "Format: XX-XXX";
    }

    if (name === 'phone' && valStr) {
        if (!REGEX.PHONE.test(valStr)) return "Niedozwolone znaki";
        if (valStr.replace(/\D/g, '').length < REGEX.PHONE_LENGTH) return "Numer za krótki";
    }

    return null;
};

export const validateUserForm = (formData: any, isEdit: boolean) => {
    const errors: Record<string, string> = {};
    const fieldsToCheck = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'postalCode', 'password'];

    fieldsToCheck.forEach(field => {
        const error = validateUserField(field, formData[field], isEdit);
        if (error) errors[field] = error;
    });

    return errors;
};

export const validateSystemConfig = (activeTab: string, data: any) => {
    const errors: Record<string, string> = {};
    const isHour = activeTab === 'lessonHours';

    if (!isHour && !data.name) {
        errors.name = "Nazwa jest wymagana";
    }

    if (activeTab === 'gradeTypes') {
        if (!data.numeric) errors.numeric = "Symbol jest wymagany";
        if (!data.value) errors.value = "Wartość jest wymagana";
    }

    if (activeTab === 'gradeCategories') {
        if (!data.weight) errors.weight = "Waga jest wymagana";
    }

    if (activeTab === 'attendance' && !data.shortCode) {
        errors.shortCode = "Skrót jest wymagany";
    }

    if (isHour) {
        if (!data.startTime) errors.startTime = "Start jest wymagany";
        if (!data.endTime) errors.endTime = "Koniec jest wymagany";
        if (!data.orderNumber) errors.orderNumber = "Numer jest wymagany";
    }

    return errors;
};

export const isPasswordValid = (password: string): boolean => {
    return PASSWORD_RULES.every(rule => rule.test(password));
};

export const validateUserProfileUpdate = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.firstName?.trim()) errors.firstName = "Imię jest wymagane";
    if (!data.lastName?.trim()) errors.lastName = "Nazwisko jest wymagane";

    if (data.postalCode && data.postalCode.trim() !== '' && !REGEX.POSTAL_CODE.test(data.postalCode)) {
        errors.postalCode = "Kod pocztowy musi mieć format XX-XXX";
    }

    if (data.phone && data.phone.trim() !== '' && !REGEX.PHONE.test(data.phone)) {
        errors.phone = "Numer telefonu jest nieprawidłowy.";
    }

    return errors;
};

export const validatePasswordChange = (data: any): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.currentPassword) errors.currentPassword = "Wprowadź aktualne hasło";

    if (data.newPassword !== data.confirmPassword) {
        errors.confirmPassword = "Nowe hasła nie są identyczne";
    }

    if (data.newPassword && !isPasswordValid(data.newPassword)) {
        errors.newPassword = "Hasło nie spełnia wszystkich wymagań";
    }

    return errors;
};

export const validateClassForm = (data: any) => {
    const errors: Record<string, string> = {};

    if (!data.level) {
        errors.level = "Poziom jest wymagany";
    } else if (data.level < 1 || data.level > 8) {
        errors.level = "Poziom musi być cyfrą od 1 do 8";
    }

    if (!data.letter) {
        errors.letter = "Oddział jest wymagany";
    } else if (!REGEX.CLASS_LETTER.test(data.letter)) {
        errors.letter = "Oddział musi być literą A-Z";
    }

    return errors;
};

export const validateGradeForm = (data: Partial<GradeDto>): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.gradeTypeId) {
        errors.gradeTypeId = "Wybierz ocenę";
    }

    if (!data.gradeCategoryId) {
        errors.gradeCategoryId = "Wybierz kategorię oceny";
    }

    if (data.comment && data.comment.length > 255) {
        errors.comment = "Komentarz za długi (max 255 znaków)";
    }

    return errors;
};