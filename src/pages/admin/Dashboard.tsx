import { useState, useEffect } from 'react';
import { Plus, Users, Megaphone } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/apiService';
import type { DashboardSummary } from '../../types';
import { useNavigate } from 'react-router-dom';
import { UptimeCounter } from '../../components/ui/UptimeCounter';
import { useCMSContent } from '../../hooks/useCMSContent';
import {formatDateTime} from '../../utils/formatters';

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
    { id: 'users', label: getText('stats.users'), value: data?.stats.totalUsers ?? 0, link: '/users' },
    { id: 'students', label: getText('stats.students'), value: data?.stats.totalStudents ?? 0, link: '/users?role=student' },
    { id: 'teachers', label: getText('stats.teachers'), value: data?.stats.totalTeachers ?? 0, link: '/users?role=teacher' },
    { id: 'parents', label: getText('stats.parents'), value: data?.stats.totalParents ?? 0, link: '/users?role=parent' },
    { id: 'classes', label: getText('stats.classes'), value: data?.stats.totalClasses ?? 0, link: '/class-management' },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-800">{getText('title')}</h1>
          <p className="text-neutral-500 text-sm mt-1">
            {getText('schoolYear')}: <span className="font-semibold text-neutral-700">{data?.status.schoolYear ?? '-'}</span>,
            <span className="font-semibold text-neutral-700 ml-1">{data?.status.semester ?? '-'}</span>
          </p>
        </div>
        {uptimeSeconds !== null && <UptimeCounter initialSeconds={uptimeSeconds} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <a key={stat.id} href={stat.link} className="bg-white p-5 border border-neutral-300 flex flex-col hover:border-primary transition-colors group">
            <p className="text-xs font-bold text-neutral-500 mb-1 tracking-wider uppercase group-hover:text-primary transition-colors">{stat.label}</p>
            <h3 className="text-2xl font-bold text-neutral-800">{loading ? '-' : stat.value}</h3>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white border border-neutral-300 p-6">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-800">{getText('tickets.title')}</h3>
              <a href="/tickets" className="text-xs font-medium text-primary hover:text-primary-hover hover:underline">{getText('tickets.viewAll')}</a>
            </div>
            <div className="space-y-3">
              {!data?.recentTickets?.length && !loading && <p className="text-sm text-neutral-400 p-4 text-center border border-dashed border-neutral-200">{getText('tickets.empty')}</p>}
              {data?.recentTickets?.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => navigate(`/tickets?id=${ticket.id}`)}
                  className="w-full text-left block pb-3 border-b border-neutral-100 last:border-0 last:pb-0 hover:bg-neutral-50 px-2 -mx-2 py-2 rounded transition-colors"
                >
                  <h4 className="text-sm font-semibold text-neutral-800">{ticket.reasonName}</h4>
                  <div className="flex justify-between items-center mt-1.5">
                    <span className="text-xs text-neutral-400">{formatDateTime(ticket.createdAt)}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-600 border border-neutral-200 uppercase font-bold tracking-wide">{ticket.email}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-300 p-6 h-fit">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wide mb-2">{getText('quickActions.title')}</h3>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/users')}>
              <Users size={16} className="mr-2" /> {getText('quickActions.manageUsers')}
            </Button>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/announcements')}>
              <Plus size={16} className="mr-2" /> {getText('quickActions.newAnnouncement')}
            </Button>
            <Button variant="secondary" className="justify-start text-neutral-600 border-neutral-200 hover:bg-neutral-50 hover:border-primary hover:text-primary transition-all" onClick={() => navigate('/tickets')}>
              <Megaphone size={16} className="mr-2" /> {getText('quickActions.tickets')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

