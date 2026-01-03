import React, { useState } from 'react';
import { Save, User, Lock, KeyRound } from 'lucide-react';

const Settings: React.FC = () => {
  const [profileData, setProfileData] = useState({
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan.kowalski@szkola.pl',
    phone: '500 123 456'
  });

  const [passData, setPassData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Dane profilowe zostały zaktualizowane.');
  };

  const handlePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      alert('Nowe hasła nie są identyczne!');
      return;
    }
    alert('Hasło zostało zmienione.');
    setPassData({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row gap-6">
        <div className="flex-1 bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-green-50 rounded-sm text-green-700">
                    <User size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Dane osobowe</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="flex flex-col h-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Imię</label>
                        <input 
                            type="text" 
                            value={profileData.firstName}
                            onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nazwisko</label>
                        <input 
                            type="text" 
                            value={profileData.lastName}
                            onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adres Email</label>
                        <input 
                            type="email" 
                            value={profileData.email}
                            onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numer telefonu</label>
                        <input 
                            type="tel" 
                            value={profileData.phone}
                            onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-start">
                    <button 
                        type="submit"
                        className="flex items-center px-6 py-2 bg-green-700 text-white font-medium rounded-sm hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
                    >
                        <Save size={18} className="mr-2" />
                        Zapisz zmiany
                    </button>
                </div>
            </form>
        </div>

        <div className="flex-1 bg-white p-6 rounded-sm shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                <div className="p-2 bg-green-50 rounded-sm text-green-700">
                    <Lock size={20} />
                </div>
                <h2 className="text-lg font-bold text-gray-800">Zmiana hasła</h2>
            </div>

            <form onSubmit={handlePassSubmit}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Obecne hasło</label>
                        <div className="relative">
                            <input 
                                type="password" 
                                value={passData.current}
                                onChange={(e) => setPassData({...passData, current: e.target.value})}
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow"
                            />
                            <KeyRound size={16} className="absolute left-3 top-3 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nowe hasło</label>
                        <input 
                            type="password" 
                            value={passData.new}
                            onChange={(e) => setPassData({...passData, new: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Potwierdź nowe hasło</label>
                        <input 
                            type="password" 
                            value={passData.confirm}
                            onChange={(e) => setPassData({...passData, confirm: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-shadow"
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-start">
                    <button 
                        type="submit"
                        className="flex items-center px-6 py-2 bg-green-700 border border-gray-300 text-white font-medium rounded-sm hover:bg-green-800 transition-colors focus:outline-none focus:ring-2 focus:ring-green-600"
                    >
                        Zmień hasło
                    </button>
                </div>
            </form>
        </div>

      </div>
    </div>
  );
};

export default Settings;