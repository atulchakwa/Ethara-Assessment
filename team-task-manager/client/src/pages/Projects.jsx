import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await projectAPI.getAll();
      setProjects(response.data.data.projects);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await projectAPI.create(form);
      setForm({ name: '', description: '' });
      setShowModal(false);
      loadProjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const canCreate = user?.role === 'admin' || user?.role === 'manager';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Projects</h1>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary-600 text-white px-5 py-2.5 rounded-full hover:bg-primary-700 font-semibold shadow-md shadow-primary-500/20 transition-all duration-200 transform hover:-translate-y-0.5"
          >
            + New Project
          </button>
        )}
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-slate-500 glass rounded-2xl">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <p className="text-2xl font-bold text-slate-700 mb-2">No projects yet</p>
          {canCreate && (
            <p className="text-slate-500">Create your first project to get started.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link
              key={project._id}
              to={`/projects/${project._id}`}
              className="glass p-6 rounded-2xl hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group flex flex-col h-full"
            >
              <div className="flex-1">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-primary-100 flex items-center justify-center text-primary-600 shadow-sm">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                    </div>
                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                       Workspace
                    </span>
                 </div>
                <h3 className="font-bold text-xl mb-2 text-slate-800 group-hover:text-primary-600 transition-colors">{project.name}</h3>
                <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed">
                  {project.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="flex justify-between items-center text-sm pt-4 border-t border-slate-100/60 mt-auto">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  {project.members?.length || 0}
                </span>
                {project.owner && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">By</span>
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-full">{project.owner.username}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6">New Project</h2>
            
            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-lg mb-6 text-sm font-medium flex items-center gap-2">
                 <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Project Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800"
                  placeholder="E.g., Website Redesign"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800 resize-none"
                  rows={3}
                  placeholder="What is this project about?"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 p-2.5 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 font-semibold shadow-md shadow-primary-500/20 transition-all transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;