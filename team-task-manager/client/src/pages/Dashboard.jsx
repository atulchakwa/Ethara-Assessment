import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dashboardAPI } from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getStats();
      setData(response.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const overdueTasks = data?.overdueTasks || [];
  const recentTasks = data?.recentTasks || [];

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Welcome back!</h1>
        <div className="text-sm bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-full text-slate-500 font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-2 relative z-10">Total Projects</p>
          <p className="text-4xl font-extrabold text-slate-800 relative z-10">{stats.totalProjects || 0}</p>
        </div>
        
        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-2 relative z-10">Total Tasks</p>
          <p className="text-4xl font-extrabold text-slate-800 relative z-10">{stats.totalTasks || 0}</p>
        </div>
        
        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-2 relative z-10">Completed This Week</p>
          <p className="text-4xl font-extrabold text-emerald-600 relative z-10">{stats.completedThisWeek || 0}</p>
        </div>
        
        <div className="glass rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-100 rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500"></div>
          <p className="text-slate-500 text-xs font-bold tracking-wider uppercase mb-2 relative z-10">Overdue</p>
          <p className="text-4xl font-extrabold text-rose-600 relative z-10">{stats.overdue || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
            <span className="w-2 h-6 rounded-full bg-indigo-500 mr-3"></span>Tasks by Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-slate-200"></span><span className="text-slate-700 font-medium">To Do</span></div>
              <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{stats.byStatus?.todo || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-blue-400"></span><span className="text-slate-700 font-medium">In Progress</span></div>
              <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{stats.byStatus?.['in-progress'] || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-amber-400"></span><span className="text-slate-700 font-medium">Review</span></div>
              <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{stats.byStatus?.review || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-emerald-400"></span><span className="text-slate-700 font-medium">Done</span></div>
              <span className="font-bold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-100 shadow-sm">{stats.byStatus?.done || 0}</span>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
            <span className="w-2 h-6 rounded-full bg-violet-500 mr-3"></span>Tasks by Priority
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-rose-500"></span><span className="text-slate-700 font-medium">High</span></div>
              <span className="font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100">{stats.byPriority?.high || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-amber-500"></span><span className="text-slate-700 font-medium">Medium</span></div>
              <span className="font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-100">{stats.byPriority?.medium || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center gap-3"><span className="w-3 h-3 rounded-full bg-sky-400"></span><span className="text-slate-700 font-medium">Low</span></div>
              <span className="font-bold text-sky-600 bg-sky-50 px-3 py-1 rounded-lg border border-sky-100">{stats.byPriority?.low || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {overdueTasks.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-8 border-l-4 border-l-rose-500">
          <h3 className="font-bold mb-4 text-rose-600 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Overdue Tasks
          </h3>
          <div className="space-y-3">
            {overdueTasks.slice(0, 5).map(task => (
              <div key={task._id} className="flex justify-between items-center p-4 bg-white/60 rounded-xl border border-rose-100 hover:bg-white transition-colors">
                <span className="font-medium text-slate-800">{task.title}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-rose-500 bg-rose-50 px-3 py-1 rounded-md">
                  {task.project?.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
          <span className="w-2 h-6 rounded-full bg-emerald-500 mr-3"></span>Recent Tasks
        </h3>
        <div className="space-y-3">
          {recentTasks.slice(0, 5).map((task, index) => (
            <div key={task._id} className="group flex justify-between items-center p-4 bg-white/40 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
              <div className="flex items-center gap-4">
                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">{index + 1}</div>
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-primary-600 transition-colors">{task.title}</p>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">{task.project?.name}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                task.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                task.status === 'in-progress' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                task.status === 'review' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                {task.status}
              </span>
            </div>
          ))}
          {recentTasks.length === 0 && (
            <div className="text-center py-8">
               <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
                 <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
               </div>
               <p className="text-slate-500 font-medium">No tasks yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;