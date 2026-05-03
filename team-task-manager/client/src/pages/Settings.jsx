import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Settings = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [questions, setQuestions] = useState([{ question: '', answer: '' }]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const securityQuestionsList = [
    "What was your first pet's name?",
    "What city were you born in?",
    "What was the name of your first school?",
    "What is your mother's maiden name?",
    "What was your first car's brand?",
    "What is your favorite movie?"
  ];

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    try {
      await authAPI.changePassword(form);
      setMessage('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    }
  };

  const handleSetSecurityQuestions = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    
    if (questions.filter(q => q.question && q.answer).length < 2) {
      setError('Please answer at least 2 questions');
      return;
    }
    
    try {
      await authAPI.setSecurityQuestions({ questions });
      setMessage('Security questions set successfully');
      setQuestions([{ question: '', answer: '' }, { question: '', answer: '' }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set security questions');
    }
  };

  const handleLogoutAll = async () => {
    try {
      await authAPI.logoutAll();
      await logout();
      window.location.href = '/login';
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-2 px-4 ${activeTab === 'profile' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
        >
          Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-2 px-4 ${activeTab === 'security' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
        >
          Security
        </button>
        <button
          onClick={() => setActiveTab('account')}
          className={`pb-2 px-4 ${activeTab === 'account' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'}`}
        >
          Account
        </button>
      </div>

      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-semibold mb-4">Profile Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-500 text-sm">Username</label>
              <p className="font-medium">{user?.username}</p>
            </div>
            <div>
              <label className="block text-gray-500 text-sm">Email</label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <label className="block text-gray-500 text-sm">Role</label>
              <p className="font-medium capitalize">{user?.role}</p>
            </div>
            <div>
              <label className="block text-gray-500 text-sm">Member Since</label>
              <p className="font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-semibold mb-4">Change Password</h2>
            {message && <div className="bg-green-50 text-green-600 p-3 rounded mb-4">{message}</div>}
            {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}
            
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={form.currentPassword}
                  onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                  className="w-full p-3 border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={form.newPassword}
                  onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                  className="w-full p-3 border rounded"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Change Password
              </button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="font-semibold mb-4">Security Questions</h2>
            <p className="text-gray-500 text-sm mb-4">
              Set security questions to help recover your account
            </p>
            
            <form onSubmit={handleSetSecurityQuestions}>
              {questions.map((q, index) => (
                <div key={index} className="mb-4">
                  <select
                    value={q.question}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].question = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="w-full p-3 border rounded mb-2"
                  >
                    <option value="">Select question {index + 1}</option>
                    {securityQuestionsList.map(sq => (
                      <option key={sq} value={sq}>{sq}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={q.answer}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].answer = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    className="w-full p-3 border rounded"
                  />
                </div>
              ))}
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Save Security Questions
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="font-semibold mb-4">Account Actions</h2>
          
          <div className="space-y-4">
            <button
              onClick={handleLogoutAll}
              className="w-full text-left p-4 border rounded hover:bg-gray-50"
            >
              <p className="font-medium">Logout from all devices</p>
              <p className="text-sm text-gray-500">Sign out from all active sessions</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;