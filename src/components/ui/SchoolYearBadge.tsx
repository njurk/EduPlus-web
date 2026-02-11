import { useState, useEffect } from 'react';
import { api } from '../../services/apiService';

export const SchoolYearBadge = () => {
    const [schoolYear, setSchoolYear] = useState<string | null>(null);
    const [semester, setSemester] = useState<string | null>(null);

    useEffect(() => {
        api.dashboard.getSummary().then(data => {
            setSchoolYear(data.status.schoolYear);
            setSemester(data.status.semester);
        }).catch(() => { });
    }, []);

    if (!schoolYear) return null;

    return (
        <div className="hidden md:flex gap-1.5 text-sm text-neutral-500">
            <span className="font-semibold text-neutral-700">{schoolYear}</span>
            <span>-</span>
            <span className="font-semibold text-neutral-700">{semester}</span>
        </div>
    );
};
