import type { GradeDto, SchoolYearFormData } from "../types";

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

    if (!isHour && activeTab !== 'gradingScale' && !data.name) {
        errors.name = "Nazwa jest wymagana";
    }

    if (activeTab === 'gradingScale') {
        if (!data.minAverage && data.minAverage !== 0) errors.minAverage = "Średnia od jest wymagana";
        if (!data.maxAverage && data.maxAverage !== 0) errors.maxAverage = "Średnia do jest wymagana";
        if (Number(data.minAverage) >= Number(data.maxAverage)) errors.maxAverage = "Średnia do musi być większa od średniej od";
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

export interface SchoolYearSemesterData {
    schoolYear: { id: number; name: string; startDate: string; endDate: string };
    semester1: { id: number; name: string; startDate: string; endDate: string };
    semester2: { id: number; name: string; startDate: string; endDate: string };
}

export const validateSchoolYearSemesters = (data: SchoolYearSemesterData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.schoolYear.startDate) errors.schoolYearStart = "Data początku roku jest wymagana";
    if (!data.schoolYear.endDate) errors.schoolYearEnd = "Data końca roku jest wymagana";
    if (!data.semester1.endDate) errors.semester1End = "Data końca I semestru jest wymagana";

    if (data.schoolYear.startDate && data.schoolYear.endDate) {
        if (new Date(data.schoolYear.startDate) >= new Date(data.schoolYear.endDate)) {
            errors.schoolYearEnd = "Data końca musi być po dacie początku";
        }
    }

    if (data.semester1.endDate && data.schoolYear.startDate) {
        if (new Date(data.semester1.endDate) <= new Date(data.schoolYear.startDate)) {
            errors.semester1End = "Koniec I semestru musi być po początku roku";
        }
    }

    if (data.semester1.endDate && data.schoolYear.endDate) {
        if (new Date(data.semester1.endDate) >= new Date(data.schoolYear.endDate)) {
            errors.semester1End = "Koniec I semestru musi być przed końcem roku";
        }
    }

    return errors;
};

export const validateProfileField = (field: string, value: string): string => {
    const val = value ? value.trim() : '';
    switch (field) {
        case 'firstName':
            return !val ? "Imię jest wymagane." : "";
        case 'lastName':
            return !val ? "Nazwisko jest wymagane." : "";
        case 'postalCode':
            return (val && !REGEX.POSTAL_CODE.test(val)) ? "Niepoprawny format" : "";
        case 'phone':
            return (val && !REGEX.PHONE.test(val)) ? "Nieprawidłowy numer telefonu." : "";
        default:
            return "";
    }
};

export const validateSchoolYearForm = (data: SchoolYearFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) errors.name = 'Nazwa jest wymagana';
    if (!data.startDate) errors.startDate = 'Data rozpoczęcia jest wymagana';
    if (!data.endDate) errors.endDate = 'Data zakończenia jest wymagana';
    if (!data.semester1.endDate) errors.semester1End = 'Data zakończenia semestru 1 jest wymagana';
    if (!data.semester2.startDate) errors.semester2Start = 'Data rozpoczęcia semestru 2 jest wymagana';

    if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
        errors.endDate = 'Data zakończenia musi być po dacie rozpoczęcia';
    }
    if (data.semester1.endDate && data.startDate && new Date(data.semester1.endDate) <= new Date(data.startDate)) {
        errors.semester1End = 'Data zakończenia semestru 1 musi być po rozpoczęciu roku';
    }
    if (data.semester2.startDate && data.endDate && new Date(data.semester2.startDate) >= new Date(data.endDate)) {
        errors.semester2Start = 'Data rozpoczęcia semestru 2 musi być przed końcem roku';
    }
    if (data.semester1.endDate && data.semester2.startDate && new Date(data.semester1.endDate) >= new Date(data.semester2.startDate)) {
        errors.semester2Start = 'Semestr 2 musi zaczynać się po zakończeniu semestru 1';
    }

    return errors;
};

export const validateTicketForm = (email: string, reasonId: number | '', content: string): string | null => {
    if (!email.trim() || !reasonId || !content.trim()) {
        return 'Wszystkie pola są wymagane';
    }
    if (!REGEX.EMAIL.test(email)) {
        return 'Podaj poprawny adres email';
    }
    return null;
};

export const validateGradingScale = (entries: { gradeTypeId: number; minAverage: number; maxAverage: number }[]): string | null => {
    for (const e of entries) {
        if (isNaN(e.minAverage) || isNaN(e.maxAverage)) {
            return 'Wszystkie pola muszą być wypełnione';
        }
        if (e.minAverage >= e.maxAverage) {
            return `Minimum (${e.minAverage.toFixed(2)}) musi być mniejsze od maximum (${e.maxAverage.toFixed(2)})`;
        }
    }

    const sorted = [...entries].sort((a, b) => a.minAverage - b.minAverage);
    for (let i = 1; i < sorted.length; i++) {
        if (sorted[i].minAverage <= sorted[i - 1].maxAverage) {
            return `Zakresy się pokrywają: ${sorted[i - 1].minAverage.toFixed(2)}-${sorted[i - 1].maxAverage.toFixed(2)} i ${sorted[i].minAverage.toFixed(2)}-${sorted[i].maxAverage.toFixed(2)}`;
        }
    }

    return null;
};