import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { projectAPI, taskAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [memberForm, setMemberForm] = useState({ userId: '', role: 'member' });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProject();
    loadAvailableUsers();
  }, [id]);

  const loadProject = async () => {
    try {
      const [projectRes, tasksRes] = await Promise.all([
        projectAPI.getById(id),
        projectAPI.getTasks(id)
      ]);
      setProject(projectRes.data.data.project);
      setTasks(tasksRes.data.data.tasks);
    } catch (error) {
      console.error(error);
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableUsers = async () => {
    try {
      const response = await userAPI.getAll();
      setAvailableUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      await taskAPI.create({ ...taskForm, projectId: id });
      setTaskForm({ title: '', description: '', priority: 'medium', dueDate: '' });
      setShowTaskModal(false);
      loadProject();
      setSuccess('Task created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!memberForm.userId) {
      setError('Please select a user to add');
      return;
    }
    
    try {
      await projectAPI.addMember(id, {
        userId: memberForm.userId,
        role: memberForm.role
      });
      setMemberForm({ userId: '', role: 'member' });
      setShowMemberModal(false);
      loadProject();
      setSuccess('Member added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      try {
        await projectAPI.removeMember(id, userId);
        loadProject();
        setSuccess('Member removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'done': return 'bg-green-100 text-green-600';
      case 'in-progress': return 'bg-blue-100 text-blue-600';
      case 'review': return 'bg-yellow-100 text-yellow-600';
      default: return 'bg-gray-100';
    }
  };

  const getAvailableUsers = () => {
    if (!project || !availableUsers) return [];
    const memberIds = project.members?.map(m => m.user._id) || [];
    return availableUsers.filter(u => !memberIds.includes(u._id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!project) return null;

  const memberRole = project.members?.find(m => m.user._id === user._id)?.role;
  const canAddMembers = user?.role === 'admin' || memberRole === 'owner' || memberRole === 'manager';

  return (
    <div>
      <Link to="/projects" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Projects
      </Link>

      {success && (
        <div className="bg-green-50 text-green-600 p-3 rounded mb-4">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-gray-500">{project.description || 'No description'}</p>
        </div>
        
        <button
          onClick={() => setShowTaskModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Add Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-gray-500 text-sm">To Do</p>
          <p className="text-2xl font-bold">
            {tasks.filter(t => t.status === 'todo').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-gray-500 text-sm">In Progress</p>
          <p className="text-2xl font-bold">
            {tasks.filter(t => t.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-gray-500 text-sm">Review</p>
          <p className="text-2xl font-bold">
            {tasks.filter(t => t.status === 'review').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <p className="text-gray-500 text-sm">Done</p>
          <p className="text-2xl font-bold">
            {tasks.filter(t => t.status === 'done').length}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="font-semibold mb-4">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task._id} className="bg-white p-4 rounded shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{task.title}</h3>
                      <p className="text-sm text-gray-500">{task.description}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${getStatusColor(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className={task.priority === 'high' ? 'text-red-600' : 'text-gray-500'}>
                      {task.priority}
                    </span>
                    {task.assignee && (
                      <span className="text-gray-500">
                        👤 {task.assignee.username}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`${new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'text-red-600' : 'text-gray-500'}`}>
                        📅 Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-4">Team Members</h2>
          <div className="bg-white p-4 rounded shadow-sm">
            {project.members?.map(member => (
              <div key={member.user._id} className="flex justify-between items-center py-2 border-b last:border-0">
                <div>
                  <p className="font-medium">{member.user.username}</p>
                  <p className="text-sm text-gray-500">{member.user.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-sm px-2 py-1 rounded ${
                    member.role === 'owner' ? 'bg-purple-100 text-purple-600' :
                    member.role === 'manager' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {member.role}
                  </span>
                  {canAddMembers && member.user._id !== user._id && member.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveMember(member.user._id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                      title="Remove member"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {canAddMembers && (
              <button
                onClick={() => setShowMemberModal(true)}
                className="w-full mt-4 p-2 border-2 border-dashed border-gray-300 text-gray-500 rounded hover:border-blue-400 hover:text-blue-600 transition"
              >
                + Add Member
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">New Task</h2>
            
            <form onSubmit={handleCreateTask}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowTaskModal(false);
                    setError('');
                  }}
                  className="flex-1 bg-gray-200 p-3 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add Team Member</h2>
            
            <form onSubmit={handleAddMember}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Select User</label>
                <select
                  value={memberForm.userId}
                  onChange={(e) => setMemberForm({ ...memberForm, userId: e.target.value })}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select a user...</option>
                  {getAvailableUsers().map(u => (
                    <option key={u._id} value={u._id}>
                      {u.username} ({u.email}) - {u.role}
                    </option>
                  ))}
                </select>
                {getAvailableUsers().length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No users available to add. All users are already members.
                  </p>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Role</label>
                <select
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Owner role can only be assigned by creating the project
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowMemberModal(false);
                    setMemberForm({ userId: '', role: 'member' });
                    setError('');
                  }}
                  className="flex-1 bg-gray-200 p-3 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={getAvailableUsers().length === 0}
                  className="flex-1 bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;