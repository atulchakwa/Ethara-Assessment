import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.email, form.password);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      const message = err?.response?.data?.message || err?.data?.message || err?.message || 'Login failed';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden font-sans selection:bg-primary-200 selection:text-primary-900">
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

      <div className="relative glass p-10 rounded-[2rem] w-full max-w-md mx-4 shadow-2xl animate-in zoom-in-95 duration-500 border border-white/50">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-gradient-to-tr from-primary-600 to-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/30">
              <span className="text-white text-3xl font-bold">T</span>
           </div>
           <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Welcome Back</h2>
           <p className="text-slate-500 font-medium mt-2">Sign in to continue to Task Manager</p>
        </div>
        
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl mb-6 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
             <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full p-3 bg-white/70 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800 shadow-sm"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 text-sm font-semibold mb-2">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full p-3 bg-white/70 border border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800 shadow-sm"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 text-white p-3 rounded-xl hover:bg-primary-700 font-bold shadow-lg shadow-primary-500/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center space-y-3">
          <p className="text-slate-500 text-sm font-medium">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-600 hover:text-primary-700 font-bold hover:underline transition-colors">
              Sign up
            </Link>
          </p>
          <p className="text-sm">
            <Link to="/forgot-password" className="text-slate-400 hover:text-primary-600 font-medium transition-colors">
              Forgot your password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;