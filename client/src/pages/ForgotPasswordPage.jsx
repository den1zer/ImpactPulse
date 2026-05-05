import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      setMessage(res.data.msg);
    } catch (err) {
      setError(err.response?.data?.msg || 'Сталася помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-700">
        <h2 className="text-3xl font-bold mb-6 text-indigo-400 text-center">Відновлення пароля</h2>
        {message && <div className="mb-4 p-3 bg-green-900/50 border border-green-500 text-green-300 rounded">{message}</div>}
        {error && <div className="mb-4 p-3 bg-red-900/50 border border-red-500 text-red-300 rounded">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1">Ваш Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
              placeholder="Введіть ваш email"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Відправка...' : 'Надіслати посилання'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
            Повернутись до логіну
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
