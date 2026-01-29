import { useState, useEffect } from 'react';
import { Plus, FileText, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/apiService';
import type { DashboardSummary } from '../../types';
import { useNavigate } from 'react-router-dom';
import { UptimeCounter } from '../../components/ui/UptimeCounter';
import { useCMSContent } from '../../hooks/useCMSContent';
import { formatDateTime } from '../../utils/formatters';

export const Dashboard = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { getText } = useCMSContent('dashboard');

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryResult, uptimeResult] = await Promise.all([
          api.dashboard.getSummary(),
          api.dashboard.getUptime().catch(() => null)
        ]);
        setData(summaryResult);
        if (uptimeResult?.uptimeSeconds) setUptimeSeconds(uptimeResult.uptimeSeconds);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = [
    { id: 'users', label: 'Użytkownicy', value: data?.stats.totalUsers ?? 0, link: '/admin/users' },
    { id: 'students', label: 'Uczniowie', value: data?.stats.totalStudents ?? 0, link: '/admin/users' },
    { id: 'teachers', label: 'Nauczyciele', value: data?.stats.totalTeachers ?? 0, link: '/admin/users' },
    { id: 'parents', label: 'Rodzice', value: data?.stats.totalParents ?? 0, link: '/admin/users' },
    { id: 'classes', label: 'Klasy', value: data?.stats.totalClasses ?? 0, link: '/admin/class-management' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Rok szkolny: <span className="font-semibold text-neutral-700">{data?.status.schoolYear ?? '-'}</span>,
            <span className="font-semibold text-neutral-700 ml-1">{data?.status.semester ?? '-'}</span>
          </p>
        </div>
        {uptimeSeconds !== null && <UptimeCounter initialSeconds={uptimeSeconds} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <button key={stat.id} onClick={() => navigate(stat.link)} className="bg-white p-5 border border-neutral-300 flex flex-col hover:border-primary transition-colors group text-left">
            <p className="text-xs font-bold text-neutral-500 mb-1 tracking-wider uppercase group-hover:text-primary transition-colors">{stat.label}</p>
            <h3 className="text-2xl font-bold text-neutral-800">{loading ? '-' : stat.value}</h3>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-neutral-300 p-4">
            <div className="flex items-center justify-between mb-2 pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">{getText('tickets.title')}</h3>
              <button onClick={() => navigate('/admin/tickets')} className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">Zobacz wszystkie</button>
            </div>
            <div className="divide-y divide-neutral-100">
              {!data?.recentTickets?.length && !loading && <p className="text-sm text-neutral-400 py-4 text-center">Brak zgłoszeń</p>}
              {data?.recentTickets?.map((ticket) => (
                <button key={ticket.id} onClick={() => navigate(`/admin/tickets`)} className="w-full text-left flex items-center justify-between py-2 hover:bg-neutral-50 px-2 -mx-2 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-neutral-400 whitespace-nowrap">{formatDateTime(ticket.createdAt)}</span>
                    <span className="text-sm font-medium text-neutral-800 truncate">{ticket.reasonName}</span>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 border border-neutral-200 uppercase font-medium whitespace-nowrap ml-2">{ticket.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-4 h-fit">
          <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide mb-3">{getText('quickActions.title')}</h3>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/admin/users?new=true')}>
              <UserPlus size={16} className="mr-2" /> Dodaj użytkownika
            </Button>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/admin/announcements?new=true')}>
              <Plus size={16} className="mr-2" /> Nowe ogłoszenie
            </Button>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => alert('Funkcja w przygotowaniu')}>
              <FileText size={16} className="mr-2" /> Generuj raport...
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

