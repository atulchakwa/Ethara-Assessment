import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Team = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState({ role: 'member' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setUsers(response.data.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (e) => {
    e.preventDefault();
    try {
      await userAPI.update(selectedUser._id, form);
      setShowModal(false);
      loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLock = async (userId) => {
    try {
      await userAPI.lock(userId);
      loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const handleUnlock = async (userId) => {
    try {
      await userAPI.unlock(userId);
      loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const canManage = user?.role === 'admin';

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
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Team Members</h1>
      </div>

      <div className="glass rounded-2xl overflow-hidden border-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                {canManage && <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white/40">
              {users.map(member => (
                <tr key={member._id} className="hover:bg-white/80 transition-colors">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-inner">
                        {member.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{member.username}</p>
                        <p className="text-sm text-slate-500 font-medium">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                      member.role === 'admin' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                      member.role === 'manager' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {member.isLocked ? (
                      <span className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span> Locked
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Active
                      </span>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-6 py-5">
                      <div className="flex gap-3 justify-end">
                        {member._id !== user._id && (
                          <>
                            <button
                              onClick={() => { setSelectedUser(member); setForm({ role: member.role }); setShowModal(true); }}
                              className="text-primary-600 hover:text-primary-800 font-semibold text-sm transition-colors"
                            >
                              Edit
                            </button>
                            {member.isLocked ? (
                              <button
                                onClick={() => handleUnlock(member._id)}
                                className="text-emerald-600 hover:text-emerald-800 font-semibold text-sm transition-colors"
                              >
                                Unlock
                              </button>
                            ) : (
                              <button
                                onClick={() => handleLock(member._id)}
                                className="text-rose-600 hover:text-rose-800 font-semibold text-sm transition-colors"
                              >
                                Lock
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6">
              Edit {selectedUser.username}
            </h2>

            <form onSubmit={handleUpdateRole} className="space-y-5">
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
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
                  className="flex-1 bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 font-semibold shadow-md shadow-primary-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;