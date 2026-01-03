import React from 'react';
import { MapPin, Phone, Mail, Clock, User, Building } from 'lucide-react';

const ContactPage: React.FC = () => {
  const schoolData = {
    name: "I Liceum Ogólnokształcące im. Adama Mickiewicza",
    address: "ul. Szkolna 12, 00-123 Warszawa",
    secretariat: {
      phone: "22 876 54 32",
      email: "sekretariat@szkola.edu.pl",
      hours: [
        { day: "Poniedziałek - Piątek", time: "7:30 - 15:30" }
      ]
    }
  };

  const management = [
    { role: "Dyrektor szkoły", name: "Placeholder", email: "placeholder@szkola.edu.pl" },
    { role: "Wicedyrektor", name: "Placeholder1", email: "placeholder1@szkola.edu.pl" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Kontakt</h1>
        <p className="text-sm text-gray-500 mt-1">Dane oraz godziny pracy Twojej szkoły</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="space-y-6">
            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Building size={20} className="text-green-600" />
                    Dane szkoły
                </h2>
                <div className="flex gap-4 items-start">
                    <div>
                        <h3 className="text-gray-800">{schoolData.name}</h3>
                        <p className="text-gray-600 mt-1">{schoolData.address}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-green-600" />
                    Sekretariat
                </h2>

                <div className="bg-gray-50 p-4 rounded-sm border border-gray-100 mb-6 space-y-2">
                    {schoolData.secretariat.hours.map((h, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-600">{h.day}</span>
                            <span className="font-semibold text-gray-800">{h.time}</span>
                        </div>
                    ))}
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-sm text-gray-600">
                            <Phone size={18} />
                        </div>
                        <div>
                            <span className="block text-xs text-gray-400 uppercase tracking-wide">Telefon</span>
                            <a href={`tel:${schoolData.secretariat.phone.replace(/\s/g, '')}`} className="font-medium text-gray-800 hover:text-green-700 transition-colors">
                                {schoolData.secretariat.phone}
                            </a>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-sm text-gray-600">
                            <Mail size={18} />
                        </div>
                        <div>
                            <span className="block text-xs text-gray-400 uppercase tracking-wide">Email</span>
                            <a href={`mailto:${schoolData.secretariat.email}`} className="font-medium text-gray-800 hover:text-green-700 transition-colors">
                                {schoolData.secretariat.email}
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-200 h-fit">
            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <User size={20} className="text-green-600" />
                Dyrekcja
            </h2>

            <div className="space-y-6">
                {management.map((person, index) => (
                    <div key={index} className="flex gap-4 items-start pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 font-bold">
                            {person.name.split(' ').slice(1).map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-bold text-green-700 uppercase tracking-wide block mb-0.5">
                                {person.role}
                            </span>
                            <h3 className="font-medium text-gray-800">{person.name}</h3>
                            <a href={`mailto:${person.email}`} className="text-sm text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1 mt-1">
                                <Mail size={12} />
                                {person.email}
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;