import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Clock, AlertTriangle } from 'lucide-react';
import { mockAnnouncements } from './Announcements';

const AnnouncementDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const announcement = mockAnnouncements.find(a => a.id === Number(id));

  // mechanizm odczytania
  useEffect(() => {
    if (announcement) {
      markAsRead(announcement.id);
    }
  }, [id, announcement]);

  const markAsRead = async (announcementId: number) => {
    console.log(`📡 FRONTEND: Wysyłam sygnał do API: Oznacz ID=${announcementId} jako przeczytane.`);
    
    // try {
    //   await fetch(`/api/announcements/${announcementId}/read`, { method: 'POST' });
    // } catch (error) {
    //   console.error("Błąd połączenia", error);
    // }
  };

  if (!announcement) {
    return (
        <div className="text-center py-12">
            <h2 className="text-xl font-bold text-gray-700">Ogłoszenie nie zostało znalezione</h2>
            <button onClick={() => navigate(-1)} className="mt-4 text-green-600 hover:underline">Wróć</button>
        </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-500 hover:text-green-700 mb-6 transition-colors font-medium text-sm"
      >
        <ArrowLeft size={18} className="mr-2" />
        Wróć do listy
      </button>

      <div className="bg-white rounded-sm shadow-md border border-gray-200 overflow-hidden">
        <div className={`p-6 border-b border-gray-100 ${announcement.priority === 'high' ? 'bg-yellow-50/50' : 'bg-white'}`}>
            
            {announcement.priority === 'high' && (
                <div className="flex items-center text-yellow-700 font-bold text-xs uppercase tracking-wider mb-3">
                    <AlertTriangle size={14} className="mr-2" />
                    Ważny komunikat
                </div>
            )}

            <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-tight">
                {announcement.title}
            </h1>

            <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center">
                    <div className="bg-gray-100 p-1.5 rounded-full mr-2">
                        <User size={16} className="text-gray-600" />
                    </div>
                    <div>
                        <span className="block text-xs text-gray-400">Autor</span>
                        <span className="font-medium text-gray-700">{announcement.author}</span>
                    </div>
                </div>

                <div className="flex items-center">
                    <div className="bg-gray-100 p-1.5 rounded-full mr-2">
                        <Clock size={16} className="text-gray-600" />
                    </div>
                    <div>
                        <span className="block text-xs text-gray-400">Data publikacji</span>
                        <span className="font-medium text-gray-700">{announcement.date}</span>
                    </div>
                </div>
            </div>
        </div>

        <div className="p-8 text-gray-800 leading-relaxed text-lg">
            {announcement.content}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementDetails;