import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // symulacja logowania
        console.log({ email, password });
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white shadow-lg w-full max-w-4xl flex flex-col md:flex-row rounded-sm overflow-hidden">

                <div className="w-full md:w-1/2 bg-green-50 flex items-center justify-center p-6">
                    <img
                        src="/logo-512.png"
                        alt="EduPlus"
                        className="w-2/3 h-auto object-contain"
                    />
                </div>

                <div className="w-full md:w-1/2 p-8 md:p-12">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">Witaj w EduPlus</h2>
                        <p className="text-gray-500 mt-2">Zaloguj się do swojego konta</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                Adres email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition duration-200"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                    Hasło
                                </label>
                                <a href="#" className="text-sm text-green-700 hover:underline">
                                    Zapomniałeś hasła?
                                </a>
                            </div>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition duration-200"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-700 text-white font-semibold py-3 rounded-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 transition duration-200"
                        >
                            Zaloguj się
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Masz problem?{' '}
                        <a href="#" className="text-green-700 hover:underline">
                            Skontaktuj się z nami
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;