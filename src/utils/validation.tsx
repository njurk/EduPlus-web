import type { ChangePasswordDto, GradeDto, UserUpdateDto } from "../types";

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

export const isPasswordValid = (password: string): boolean => {
    if (!password) return false;
    return PASSWORD_RULES.every(rule => rule.test(password));
};

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

export const validateUserProfileUpdate = (data: Partial<UserUpdateDto>): string | null => {
    if (!data.firstName?.trim()) return "Imię jest wymagane.";
    if (!data.lastName?.trim()) return "Nazwisko jest wymagane.";

    if (data.postalCode && !REGEX.POSTAL_CODE.test(data.postalCode)) {
        return "Kod pocztowy musi mieć format XX-XXX (np. 00-001).";
    }

    if (data.phone && !REGEX.PHONE.test(data.phone)) {
        return "Numer telefonu jest nieprawidłowy.";
    }

    return null;
};

export const validatePasswordChange = (data: ChangePasswordDto & { confirmPassword: string }): string | null => {
    if (!data.currentPassword) return "Wprowadź aktualne hasło.";
    if (data.newPassword !== data.confirmPassword) return "Nowe hasła nie są identyczne.";
    if (!isPasswordValid(data.newPassword)) return "Nowe hasło nie spełnia wymagań bezpieczeństwa.";

    return null;
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