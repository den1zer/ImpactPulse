import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api.js';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { Link } from 'react-router-dom'; 
import '../styles/Dashboard.css'; 
import '../styles/TasksPage.css'; 

const TasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const token = localStorage.getItem('userToken') ? JSON.parse(localStorage.getItem('userToken')) : '';
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`${API_BASE_URL}/api/tasks`, config);
        setTasks(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);
  

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="tasks-container">
            <h2>Актуальні Завдання</h2>
            
            {loading && <p>Завантаження завдань...</p>}
            {!loading && tasks.length === 0 && <p>Нових завдань немає.</p>}

            {!loading && tasks.map(task => (
              <div key={task._id} className="task-card">
                <div className="task-header">
                  <h3>{task.title}</h3>
                  <span className="task-points">+{task.points} балів</span>
                </div>
                <div className="task-meta">
                  <span>
                    <strong>Категорія:</strong> {task.category}
                  </span>
                  <span>
                    <strong>Дедлайн:</strong> {task.endDate ? new Date(task.endDate).toLocaleDateString() : 'Немає'}
                  </span>
                  <span>
                    <strong>Статус:</strong> {task.status === 'open' ? '🟢 Відкрите' : task.status === 'in_progress' ? '🟡 В процесі' : '🟢 Завершено'}
                  </span>
                  <span style={{fontSize: '0.85em', color: '#777'}}>
                    📅 Створено: {new Date(task.createdAt).toLocaleDateString('uk-UA')}
                  </span>
                  {task.status === 'completed' && task.updatedAt && (
                    <span style={{fontSize: '0.85em', color: '#28a745'}}>
                      ✅ Закрито: {new Date(task.updatedAt).toLocaleDateString('uk-UA')}
                    </span>
                  )}
                </div>
                <p className="task-body">{task.description}</p>
                {task.filePath && (
                  <a 
                    href={`${API_BASE_URL}/${task.filePath}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="proof-link" 
                  >
                    Завантажити інструкцію
                  </a>
                )}
                
                <Link 
                  to={`/tasks/${task._id}`} 
                  className="task-button" 
                  style={{ textDecoration: 'none', marginTop: '20px' }}
                >
                  Переглянути Деталі
                </Link>
              </div>
            ))}
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default TasksPage;