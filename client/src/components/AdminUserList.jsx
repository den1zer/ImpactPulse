import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api.js';


const AdminUserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const token = JSON.parse(localStorage.getItem('userToken'));
    const config = { headers: { 'x-auth-token': token } };
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users`, config);
      setUsers(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (id, newRole) => {
    if (!window.confirm(`Впевнені, що хочете змінити роль цьому користувачу на ${newRole}?`)) {
      return;
    }
    
    const token = JSON.parse(localStorage.getItem('userToken'));
    const config = { headers: { 'x-auth-token': token } };
    try {
      await axios.put(`${API_BASE_URL}/api/users/role/${id}`, { role: newRole }, config);
      setUsers(users.map(user => user._id === id ? { ...user, role: newRole } : user));
      alert('Роль оновлено!');
    } catch (err) {
      alert('Помилка оновлення ролі');
    }
  };

  if (loading) return <p>Завантаження користувачів...</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Email</th>
          <th>Роль</th>
          <th>Дії</th>
        </tr>
      </thead>
      <tbody>
        {users.map(user => (
          <tr key={user._id}>
            <td>{user.username}{user.selectedBadge && user.selectedBadge.icon ? ` ${user.selectedBadge.icon}` : ''}</td>
            <td>{user.email}</td>
            <td>
              <select 
                value={user.role} 
                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                className="neumorph-select" 
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </td>
            <td>
              {user.role === 'user' ? (
                <button 
                  className="action-btn approve" 
                  onClick={() => handleRoleChange(user._id, 'admin')}
                >
                  Зробити Адміном
                </button>
              ) : (
                <button 
                  className="action-btn reject" 
                  onClick={() => handleRoleChange(user._id, 'user')}
                >
                  Зробити Юзером
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminUserList;