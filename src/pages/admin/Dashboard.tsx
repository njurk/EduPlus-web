import { useState, useEffect } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/apiService';
import type { DashboardSummary, AttendanceChartData } from '../../types';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [chartData, setChartData] = useState<AttendanceChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryResult, chartResult] = await Promise.all([
          api.dashboard.getSummary(),
          api.dashboard.getAttendanceChart()
        ]);
        setData(summaryResult);
        setChartData(chartResult);
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
    { label: 'Klasy', value: data?.stats.totalClasses ?? 0, link: '/classes' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Pulpit administratora</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Rok szkolny: <span className="font-semibold text-neutral-700">{data?.status.schoolYear ?? '-'}</span>,
            semestr: <span className="font-semibold text-neutral-700">{data?.status.semester ?? '-'}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <a key={stat.label} href={stat.link} className="bg-white p-6 border border-neutral-200 shadow-sm flex items-start justify-between rounded hover:shadow-md transition-all hover:border-neutral-300">
            <div>
              <p className="text-sm font-medium text-neutral-500 mb-1 tracking-wide">{stat.label}</p>
              <h3 className="text-3xl font-bold text-neutral-800">{loading ? '...' : stat.value}</h3>
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-2">
          <div className="bg-white border border-neutral-200 shadow-sm rounded p-6">
            <h3 className="text-lg font-bold text-neutral-800 mb-4">Frekwencja (ostatnie 7 dni)</h3>
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
                  <Bar dataKey="attendancePercentage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList dataKey="attendancePercentage" position="top" formatter={(value) => (typeof value === 'number' ? `${value}%` : '')} fill="#737373" fontSize={12} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-neutral-200 shadow-sm rounded p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-800">Ostatnie ogłoszenia</h3>
              <a href="/announcements" className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">Zobacz wszystkie</a>
            </div>
            <div className="space-y-4">
              {!data?.announcements.length && !loading && <p className="text-sm text-neutral-400">Brak ogłoszeń</p>}
              {data?.announcements.map((item) => (
                <Link key={item.id} to={`/announcements/${item.id}`} className="block pb-3 border-b border-neutral-50 last:border-0 last:pb-0 group hover:bg-neutral-50 transition-colors -mx-2 px-2 rounded">
                  <h4 className="text-sm font-semibold text-neutral-800 group-hover:text-primary transition-colors">{item.title}</h4>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-neutral-400">{item.date}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded-full font-medium border border-neutral-200">{item.author}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 shadow-sm rounded p-6 h-fit">
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-neutral-50 rounded border border-neutral-100 flex flex-col gap-1">
              <span className="text-sm text-neutral-600 font-medium">Średnia szkoły (aktualny semestr)</span>
              <span className="text-3xl font-bold text-primary">{loading ? '...' : data?.status.avgGrade}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-6 mt-6 border-t border-neutral-100">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide">Szybkie akcje</h3>
            <Button variant="ghost" className="justify-start text-neutral-600 border border-neutral-200 hover:bg-neutral-50" onClick={() => navigate('/users')}>
              <Plus size={16} className="mr-2 text-neutral-500" /> Dodaj użytkownika
            </Button>
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