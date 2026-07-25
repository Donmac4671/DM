'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check role and redirect
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/customer');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autofillUser = () => {
    setEmail('customer@test.com');
    setPassword('customer123');
  };

  const autofillAdmin = () => {
    setEmail('donmacdatahub@gmail.com');
    setPassword('admin123');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-700">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block bg-amber-500 text-slate-950 font-black px-3 py-1 rounded text-xl tracking-wider mb-2">
            DONMAC
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Welcome Back</h2>
          <p className="text-sm text-slate-400 mt-1">Access your secure telecom terminal</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded-lg text-sm mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="e.g. kojo@gmail.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:bg-amber-700 py-3 rounded-lg font-bold transition mt-2 cursor-pointer"
          >
            {loading ? 'Securing Connection...' : 'Secure Login'}
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-2 border-t border-slate-700 pt-6">
          <span className="text-xs text-slate-500 text-center font-semibold uppercase tracking-wider">
            Demo Autofill Profiles
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={autofillUser}
              className="bg-slate-700 hover:bg-slate-650 text-xs py-2 px-3 rounded-lg text-slate-200 transition cursor-pointer text-center"
            >
              Demo User
            </button>
            <button
              onClick={autofillAdmin}
              className="bg-slate-700 hover:bg-slate-650 text-xs py-2 px-3 rounded-lg text-slate-200 transition cursor-pointer text-center"
            >
              Demo Admin
            </button>
          </div>
        </div>

        <p className="text-sm text-center text-slate-400 mt-6">
          New user?{' '}
          <Link href="/register" className="text-amber-500 hover:underline">
            Register Account
          </Link>
        </p>
      </div>
    </div>
  );
}
