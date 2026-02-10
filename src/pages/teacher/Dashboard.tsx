import { useCMSContent } from '../../hooks/useCMSContent';

export const TeacherDashboard = () => {
    const { getText } = useCMSContent('teacherLayout');

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-neutral-800">{getText('title.dashboard')}</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-700 mb-2">Dzisiejsze lekcje</h2>
                    <p className="text-neutral-500 text-sm">Wkrótce dostępne</p>
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-700 mb-2">Moje klasy</h2>
                    <p className="text-neutral-500 text-sm">Wkrótce dostępne</p>
                </div>

                <div className="bg-white rounded-lg border border-neutral-200 p-6">
                    <h2 className="text-lg font-semibold text-neutral-700 mb-2">Ostatnie oceny</h2>
                    <p className="text-neutral-500 text-sm">Wkrótce dostępne</p>
                </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-emerald-800 mb-2">Panel Nauczyciela</h2>
                <p className="text-emerald-700 text-sm">
                    Witaj w panelu nauczyciela. Tutaj znajdziesz dostęp do swoich lekcji, ocen i frekwencji.
                </p>
            </div>
        </div>
    );
};
