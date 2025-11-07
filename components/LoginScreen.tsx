import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.tsx';

export const LoginScreen: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();

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
        <div className="flex items-center justify-center h-screen bg-slate-200 dark:bg-slate-900">
            <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Tidé Hotels PMS</h1>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">Staff Login</p>
                </div>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                        <div className="mt-1">
                            <input
                                id="username"
                                name="username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="password"  className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};