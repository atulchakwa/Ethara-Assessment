import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskAPI, projectAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['todo', 'in-progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: '',
    priority: 'medium',
    status: 'todo',
    assignee: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        taskAPI.getAll(),
        projectAPI.getAll()
      ]);
      setTasks(tasksRes.data.data.tasks);
      setProjects(projectsRes.data.data.projects);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const newStatus = destination.droppableId;

    const updatedTasks = tasks.map(t => 
      t._id === draggableId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);

    try {
      await taskAPI.update(draggableId, { status: newStatus });
    } catch (error) {
      loadData();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate project is selected
    if (!form.projectId) {
      alert('Please select a project');
      return;
    }
    
    try {
      if (editTask) {
        await taskAPI.update(editTask._id, form);
      } else {
        await taskAPI.create(form);
      }
      setShowModal(false);
      setEditTask(null);
      setForm({ title: '', description: '', projectId: '', priority: 'medium', status: 'todo', assignee: '' });
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      projectId: task.project._id || task.project,
      priority: task.priority,
      status: task.status,
      assignee: task.assignee?._id || ''
    });
    setShowModal(true);
  };

  const getTasksByStatus = (status) => 
    tasks.filter(t => t.status === status);

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return 'border-l-4 border-red-500';
      case 'medium': return 'border-l-4 border-yellow-500';
      default: return 'border-l-4 border-gray-300';
    }
  };

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
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Tasks Board</h1>
        <button
          onClick={() => { setEditTask(null); setForm({ title: '', description: '', projectId: '', priority: 'medium', status: 'todo', assignee: '' }); setShowModal(true); }}
          className="bg-primary-600 text-white px-5 py-2.5 rounded-full hover:bg-primary-700 font-semibold shadow-md shadow-primary-500/20 transition-all duration-200 transform hover:-translate-y-0.5 focus:ring-2 focus:ring-primary-500/50"
        >
          + New Task
        </button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {STATUSES.map(status => (
            <div key={status} className="bg-slate-100/50 p-5 rounded-2xl border border-slate-200/50 flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-slate-700 capitalize flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${status === 'todo' ? 'bg-slate-300' : status === 'in-progress' ? 'bg-blue-400' : status === 'review' ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  {status.replace('-', ' ')}
                </h3>
                <span className="bg-white text-slate-600 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">{getTasksByStatus(status).length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto min-h-64 space-y-3 transition-colors duration-200 ${snapshot.isDraggingOver ? 'bg-slate-100 rounded-xl' : ''}`}
                  >
                    {getTasksByStatus(status).map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => openEdit(task)}
                            className={`bg-white p-4 rounded-xl shadow-sm border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 ${snapshot.isDragging ? 'shadow-lg ring-2 ring-primary-500/20 rotate-1' : ''}`}
                          >
                            <div className="flex justify-between items-start mb-2">
                               <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' : task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-sky-50 text-sky-600 border border-sky-100'}`}>
                                 {task.priority || 'Medium'}
                               </span>
                            </div>
                            <h4 className="font-bold text-slate-800 leading-snug">{task.title}</h4>
                            <p className="text-xs font-medium text-slate-500 mt-2 truncate w-full">
                              {task.project?.name || 'No project'}
                            </p>
                            
                            {task.assignee && (
                              <div className="flex justify-end mt-3 border-t border-slate-50 pt-3">
                                 <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-full w-max">
                                    <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 font-bold text-[10px] flex items-center justify-center">
                                       {task.assignee.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-[11px] font-medium text-slate-600">{task.assignee.username}</span>
                                 </div>
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 mb-6">
              {editTask ? 'Edit Task' : 'New Task'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800"
                  placeholder="Task title"
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
                  placeholder="Add some details..."
                />
              </div>

              <div>
                <label className="block text-slate-700 text-sm font-semibold mb-2">Project</label>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800"
                  required
                >
                  <option value="">Select project</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800 capitalize"
                  >
                    {STATUSES.map(s => (
                      <option key={s} value={s}>{s.replace('-', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-semibold mb-2">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all text-slate-800 capitalize"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setEditTask(null); }}
                  className="flex-1 bg-white border border-slate-200 text-slate-700 p-2.5 rounded-xl hover:bg-slate-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white p-2.5 rounded-xl hover:bg-primary-700 font-semibold shadow-md shadow-primary-500/20 transition-all transform hover:-translate-y-0.5"
                >
                  {editTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;