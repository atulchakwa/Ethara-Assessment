import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/projects', label: 'Projects', icon: '📁' },
    { path: '/tasks', label: 'Tasks', icon: '✓' },
    { path: '/team', label: 'Team', icon: '👥', roles: ['admin', 'manager'] },
    { path: '/settings', label: 'Settings', icon: '⚙️' }
  ];

  const filteredNavItems = navItems.filter(
    item => !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 font-sans selection:bg-primary-200 selection:text-primary-900">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col z-20`}>
        <div className="p-5 border-b border-slate-100 flex items-center h-16">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-indigo-400 flex items-center justify-center shadow-md shadow-primary-500/30 shrink-0">
             <span className="text-white font-bold text-lg leading-none">T</span>
          </div>
          {sidebarOpen && (
            <h1 className="text-xl font-bold ml-3 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 whitespace-nowrap">Task Manager</h1>
          )}
        </div>
        
        <nav className="p-3 flex-1 overflow-y-auto">
          {filteredNavItems.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center p-3 rounded-xl mb-2 transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 shadow-sm ring-1 ring-primary-500/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <span className={`text-xl transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'} ${sidebarOpen ? 'mr-3' : 'mx-auto'}`}>
                  {item.icon}
                </span>
                {sidebarOpen && <span className="font-medium whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 glass px-6 py-4 flex justify-between items-center border-b border-slate-200/50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:ring-2 focus:ring-primary-500/30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
          </button>

          <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-full py-1.5 pl-4 pr-1.5 shadow-sm">
            <span className="text-sm font-medium text-slate-700">{user?.username}</span>
            <span className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-semibold border border-indigo-100 uppercase tracking-wide">
              {user?.role}
            </span>
            <div className="h-4 w-px bg-slate-200 mx-1"></div>
            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-white hover:bg-red-500 px-3 py-1.5 rounded-full transition-all duration-200 focus:ring-2 focus:ring-red-500/30"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;