import { useState, useEffect } from 'react';
import { Plus, FileText, AlertCircle, Check, MessageCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/apiService';
import type { User } from '../../types';

interface Announcement {
  id: number;
  title: string;
  createdAt: string;
  author?: { firstName: string; lastName: string };
}

const ROLE_TEACHER_ID = 2;
const ROLE_STUDENT_ID = 4;

const errorReports = [
  { id: 1, user: 'Anna Nowak (Nauczyciel)', issue: 'Brak dostępu do dziennika ocen kl. 2A', date: '15 min temu' },
  { id: 2, user: 'Piotr Wiśniewski (Rodzic)', issue: 'Błąd logowania - nieprawidłowe hasło mimo resetu', date: '1 godz. temu' },
];

export const Dashboard = () => {
  const [counts, setCounts] = useState({ users: 0, students: 0, teachers: 0, classes: 0 });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [systemStatus, setSystemStatus] = useState({
    schoolYear: '2025/2026',
    semester: '1',
    avgAttendanceToday: '0%',
    gradeAvgThisSemester: '0.00'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const users: User[] = await api.users.getAll();
        const studentsCount = users.filter(u => u.userRoles.some(r => r.roleId === ROLE_STUDENT_ID && r.isActive)).length;
        const teachersCount = users.filter(u => u.userRoles.some(r => r.roleId === ROLE_TEACHER_ID && r.isActive)).length;
        let classesCount = 0;
        try {
            const classes = await api.classes.getAll(); 
            classesCount = classes.length;
        } catch (e) {
            console.warn("Brak endpointu klas lub błąd pobierania");
        }

        let recentAnnouncements: Announcement[] = [];
        try {
            const fetchedAnnouncements = await api.announcements.getAll();
            recentAnnouncements = fetchedAnnouncements
                .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3);
        } catch (e) {
            console.warn("Brak endpointu ogłoszeń");
        }

        setCounts({
          users: users.length,
          students: studentsCount,
          teachers: teachersCount,
          classes: classesCount
        });
        setAnnouncements(recentAnnouncements);        
      } catch (error) {
        console.error("Błąd ładowania dashboardu", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pl-PL');
  };

  const stats = [
    { label: 'Użytkownicy', value: counts.users.toString(), link: '/users' },
    { label: 'Uczniowie', value: counts.students.toString(), link: '/users?role=student' },
    { label: 'Nauczyciele', value: counts.teachers.toString(), link: '/users?role=teacher' },
    { label: 'Klasy', value: counts.classes.toString(), link: '/classes' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Pulpit administratora</h1>
          <p className="text-neutral-500 text-sm mt-1">
            rok szkolny: <span className="font-semibold text-neutral-700">{systemStatus.schoolYear}</span>,
            semestr: <span className="font-semibold text-neutral-700">{systemStatus.semester}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button>
            <Plus size={16} className="mr-2" /> Dodaj użytkownika
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <a
            key={stat.label}
            href={stat.link}
            className="bg-white p-6 border border-neutral-200 shadow-sm flex items-start justify-between rounded hover:shadow-md transition-all hover:border-neutral-300"
          >
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1 uppercase tracking-wide">{stat.label}</p>
              <h3 className="text-3xl font-bold text-neutral-800">
                {loading ? '...' : stat.value}
              </h3>
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-white border border-neutral-200 shadow-sm rounded p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-neutral-800 flex items-center gap-2">
                <AlertCircle className="text-red-600" size={20} />
                Problemy wymagające uwagi
              </h3>
              <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                {errorReports.length} nowe
              </span>
            </div>
            <div className="space-y-3">
              {errorReports.map((report) => (
                <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-neutral-50 border border-neutral-100 rounded gap-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">{report.issue}</p>
                      <p className="text-xs text-neutral-500 mt-0.5">{report.user} • {report.date}</p>
                    </div>
                  </div>
                  <button className="text-xs font-medium text-neutral-600 hover:text-green-700 hover:bg-green-50 px-3 py-1.5 rounded transition-colors border border-neutral-200 bg-white flex items-center shrink-0">
                    <MessageCircle size={14} className="mr-1.5" /> Odpowiedz
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-200 shadow-sm rounded p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-800">Ostatnie ogłoszenia</h3>
              <a href="/cms" className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">Zobacz wszystkie</a>
            </div>
            <div className="space-y-4">
              {loading && announcements.length === 0 ? (
                 <p className="text-sm text-neutral-400">Ładowanie ogłoszeń...</p>
              ) : announcements.length > 0 ? (
                announcements.map((item) => (
                  <div key={item.id} className="pb-3 border-b border-neutral-50 last:border-0 last:pb-0 group">
                    <h4 className="text-sm font-semibold text-neutral-800 group-hover:text-primary transition-colors">{item.title}</h4>
                    <div className="flex justify-between items-center mt-1.5">
                      <span className="text-xs text-neutral-400">{formatDate(item.createdAt)}</span>
                      <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full font-medium border border-neutral-200">
                        {item.author ? `${item.author.firstName} ${item.author.lastName}` : 'System'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-400">Brak ogłoszeń.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 shadow-sm rounded p-6 h-fit">
          <h3 className="text-lg font-bold text-neutral-800 mb-4">Statusy</h3>
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-neutral-50 rounded border border-neutral-100 flex flex-col gap-1">
              <span className="text-sm text-neutral-600 font-medium">Frekwencja dzisiaj</span>
              <span className="text-3xl font-bold text-primary">{systemStatus.avgAttendanceToday}</span>
            </div>
            <div className="p-4 bg-neutral-50 rounded border border-neutral-100 flex flex-col gap-1">
              <span className="text-sm text-neutral-600 font-medium">Średnia szkoły (semestr)</span>
              <span className="text-3xl font-bold text-primary">{systemStatus.gradeAvgThisSemester}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Szybkie akcje</h3>
            <Button variant="ghost" className="justify-start text-neutral-600 border border-neutral-200 hover:bg-neutral-50">
              <Plus size={16} className="mr-2 text-neutral-500" /> Dodaj ogłoszenie
            </Button>
            <Button variant="ghost" className="justify-start text-neutral-600 border border-neutral-200 hover:bg-neutral-50">
              <FileText size={16} className="mr-2 text-neutral-500" /> Generuj raport...
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};