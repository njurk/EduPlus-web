import { useState, useEffect } from 'react';
import { api } from '../services/apiService';
import type { SchoolYear, SemesterDto, ClassEntity } from '../types';

interface UseSchoolYearSelectorOptions {
    withClasses?: boolean;
    withCurrentSemester?: boolean;
}

export const useSchoolYearSelector = (options?: UseSchoolYearSelectorOptions) => {
    const [years, setYears] = useState<SchoolYear[]>([]);
    const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
    const [semesters, setSemesters] = useState<SemesterDto[]>([]);
    const [selectedSemesterOrder, setSelectedSemesterOrder] = useState<number | null>(null);
    const [classes, setClasses] = useState<ClassEntity[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

    useEffect(() => {
        api.schoolYears.getAll().then(data => {
            setYears(data);
            const today = new Date().toISOString().split('T')[0];
            const current = data.find(y => y.startDate <= today && y.endDate >= today)
                || data.find(y => y.isActive) || data[0];
            if (current) setSelectedYearId(current.id);
        });
    }, []);

    useEffect(() => {
        if (!selectedYearId) return;

        const promises: Promise<any>[] = [
            api.schoolYears.getSemesters(selectedYearId)
        ];

        if (options?.withClasses) {
            promises.push(api.classManagement.getClassesByYear(selectedYearId, { pageSize: 1000 }));
        }

        if (options?.withCurrentSemester) {
            promises.push(api.grades.getCurrentSemester(selectedYearId).catch(() => 1));
        }

        Promise.all(promises).then(results => {
            const sem = results[0] as SemesterDto[];
            setSemesters(sem);

            let idx = 1;
            if (options?.withClasses) {
                setClasses(results[idx]?.data || []);
                idx++;
            }

            const currentSemOrder = options?.withCurrentSemester ? results[idx] : null;
            const target = currentSemOrder
                ? sem.find(s => s.order === currentSemOrder) || sem[0]
                : sem[0];

            if (target) setSelectedSemesterOrder(target.order);
            setSelectedClassId(null);
        });
    }, [selectedYearId]);

    const selectedSemester = semesters.find(s => s.order === selectedSemesterOrder);

    return {
        years,
        selectedYearId,
        setSelectedYearId,
        semesters,
        selectedSemesterOrder,
        setSelectedSemesterOrder,
        selectedSemester,
        classes,
        selectedClassId,
        setSelectedClassId
    };
};
