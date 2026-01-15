import { useState, useEffect } from 'react';
import { Plus, Users, Megaphone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/apiService';
import type { DashboardSummary, AttendanceChartData } from '../../types';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';
import { UptimeCounter } from '../../components/ui/UptimeCounter';

const formatDate = (date?: string) => date ? new Date(date).toLocaleString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';


export const Dashboard = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<AttendanceChartData[]>([]);
  const [uptimeSeconds, setUptimeSeconds] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryResult, chartResult, uptimeResult] = await Promise.all([
          api.dashboard.getSummary(),
          api.dashboard.getAttendanceChart(),
          api.dashboard.getUptime().catch(() => null)
        ]);
        setData(summaryResult);
        setChartData(chartResult);
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
    { label: 'Użytkownicy', value: data?.stats.totalUsers ?? 0, link: '/users' },
    { label: 'Uczniowie', value: data?.stats.totalStudents ?? 0, link: '/users?role=student' },
    { label: 'Nauczyciele', value: data?.stats.totalTeachers ?? 0, link: '/users?role=teacher' },
    { label: 'Rodzice', value: data?.stats.totalParents ?? 0, link: '/users?role=parent' },
    { label: 'Klasy', value: data?.stats.totalClasses ?? 0, link: '/class-management' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Pulpit</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Rok szkolny: <span className="font-semibold text-neutral-700">{data?.status.schoolYear ?? '-'}</span>,
            <span className="font-semibold text-neutral-700 ml-1">{data?.status.semester ?? '-'}</span>
          </p>
        </div>
        {uptimeSeconds !== null && <UptimeCounter initialSeconds={uptimeSeconds} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <a key={stat.label} href={stat.link} className="bg-white p-5 border border-neutral-300 flex flex-col hover:border-primary transition-colors group">
            <p className="text-xs font-bold text-neutral-500 mb-1 tracking-wider uppercase group-hover:text-primary transition-colors">{stat.label}</p>
            <h3 className="text-2xl font-bold text-neutral-800">{loading ? '-' : stat.value}</h3>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-white border border-neutral-300 p-6">
            <h3 className="text-lg font-bold text-neutral-800 mb-6">Frekwencja (ostatnie 7 dni)</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#737373', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#737373', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip cursor={{ fill: '#f5f5f5' }} formatter={(value) => [`${value}%`, 'Frekwencja']} />
                  <Bar dataKey="attendancePercentage" fill="#3b82f6" radius={[0, 0, 0, 0]} barSize={40}>
                    <LabelList dataKey="attendancePercentage" position="top" formatter={(value: any) => (typeof value === 'number' ? `${value}%` : '')} fill="#737373" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-neutral-300 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-800">Ostatnie zgłoszenia</h3>
              <a href="/tickets" className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">Zobacz wszystkie</a>
            </div>
            <div className="space-y-3">
              {!data?.recentTickets?.length && !loading && <p className="text-sm text-neutral-400 p-4 text-center border border-dashed border-neutral-200">Brak otwartych zgłoszeń</p>}
              {data?.recentTickets?.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => navigate(`/tickets?id=${ticket.id}`)}
                  className="w-full text-left block pb-3 border-b border-neutral-100 last:border-0 last:pb-0 hover:bg-neutral-50 px-2 -mx-2 py-2 rounded transition-colors"
                >
                  <h4 className="text-sm font-semibold text-neutral-800">{ticket.subject}</h4>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-neutral-400">{formatDate(ticket.createdAt)}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase font-bold tracking-wide">{ticket.userName}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-6 h-fit">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide mb-2">Szybkie akcje</h3>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/users')}>
              <Users size={16} className="mr-2" /> Zarządzaj użytkownikami
            </Button>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/announcements')}>
              <Plus size={16} className="mr-2" /> Nowe ogłoszenie
            </Button>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/tickets')}>
              <Megaphone size={16} className="mr-2" /> Zgłoszenia
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};