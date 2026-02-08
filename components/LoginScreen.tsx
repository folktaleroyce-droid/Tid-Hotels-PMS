
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useHotelData } from '../hooks/useHotelData.ts';
import { Button } from './common/Button.tsx';

export const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();
    const { propertyInfo } = useHotelData();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!username || !password) {
            setError('Please enter both username and password.');
            return;
        }
        const success = await login(username, password);
        if (!success) {
            setError('Wrong username or password.');
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-slate-200 dark:bg-slate-900 font-sans">
            <div className="w-full max-w-md p-10 space-y-8 bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-fade-in-scale">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                        {propertyInfo.name}
                    </h1>
                    <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-indigo-600">Authoritative Staff Authentication</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Terminal ID (Username)</label>
                        <div className="mt-1">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-bold"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-[10px] font-black uppercase text-slate-500 mb-2 ml-1">Access Protocol (Password)</label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-slate-100 dark:border-slate-800 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                            />
                        </div>
                    </div>

                    {error && <p className="text-xs font-black uppercase text-red-600 text-center animate-pulse">{error}</p>}

                    <div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 uppercase font-black tracking-widest shadow-xl shadow-indigo-600/20"
                        >
                            {loading ? 'Validating...' : 'Initialize Session'}
                        </Button>
                    </div>
                </form>
                <div className="pt-6 border-t border-slate-100 dark:border-slate-900 text-center">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Industrial Node Connectivity Active</p>
                </div>
            </div>
        </div>
    );
};
