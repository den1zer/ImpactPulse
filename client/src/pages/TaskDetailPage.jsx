import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import SubmissionModal from '../components/SubmissionModal'; 
import '../styles/Dashboard.css'; 
import '../styles/TasksPage.css'; 

const TaskDetailPage = () => {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    const userIdFromStorage = localStorage.getItem('userId');
    if (userIdFromStorage) {
      setCurrentUserId(userIdFromStorage.replace(/"/g, ''));
    }
  }, []);

  const fetchTask = async () => {
    try {
      setLoading(true); 
      const token = localStorage.getItem('userToken') ? JSON.parse(localStorage.getItem('userToken')) : '';
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get(`http://localhost:5000/api/tasks/${id}`, config);
      setTask(res.data);
      setLoading(false);
    } catch (err) {
      setError('Не вдалося завантажити завдання');
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  const handleClaim = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.put(`http://localhost:5000/api/tasks/${id}/claim`, {}, config);
      alert('Завдання "взято в опрацювання"!');
      fetchTask(); 
    } catch (err) {
      alert('Помилка: ' + (err.response?.data?.msg || ''));
    }
  };

  const handleAbandon = async () => {
    const reason = prompt('Вкажіть причину відхилення:');
    if (!reason) {
      alert('Причина є "обов\'язковою"');
      return;
    }
    
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } };
      await axios.put(`http://localhost:5000/api/tasks/${id}/abandon`, { reason }, config);
      alert('Ви відхилили завдання.');
      fetchTask();
    } catch (err) {
      alert('Помилка: ' + (err.response?.data?.msg || ''));
    }
  };

  const handleSuccessSubmission = () => {
    fetchTask(); 
  };

  if (loading) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><p>Завантаження...</p></main></div>;
  if (error) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><p>{error}</p></main></div>;
  if (!task) return <div className="dashboard-layout"><Sidebar /><main className="dashboard-main"><p>Завдання не знайдено.</p></main></div>;

  const isAssignedToMe = (task.assignedTo && task.assignedTo._id === currentUserId) || (task.assignedTo === currentUserId);
  const isOpen = task.status === 'open';
  const isInProgress = task.status === 'in_progress';
  const isPendingProof = task.submission !== null; 
  const isCompleted = task.status === 'completed'; 

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="tasks-container">
            <div className="task-card">
              <div className="task-header">
                <h3>{task.title}</h3>
                <span className="task-points">+{task.points} балів</span>
              </div>
              <div className="task-meta">
                <span><strong>Категорія:</strong> {task.category}</span>
                <span><strong>Статус:</strong> {task.status}</span>
              </div>
              <p className="task-body">{task.description}</p>
              
              {task.filePath && (
                <a href={`http://localhost:5000/${task.filePath}`} target="_blank" rel="noopener noreferrer" className="proof-link">
                  Завантажити прикрілений файл
                </a>
              )}
              
              
              {isOpen && localStorage.getItem('userRole') !== 'guest' && (
                <button className="task-button" onClick={handleClaim}>
                  Взяти в опрацювання
                </button>
              )}
              {isOpen && localStorage.getItem('userRole') === 'guest' && (
                <p style={{ marginTop: '20px', fontWeight: 600, color: '#ffc107', textAlign: 'center' }}>
                  Увійдіть, щоб взяти завдання в опрацювання.
                </p>
              )}
              
              {isInProgress && isAssignedToMe && !isPendingProof && (
                <>
                  <button 
                    className="task-button"
                    style={{ backgroundColor: '#28a745', marginRight: '10px' }}
                    onClick={() => setIsModalOpen(true)}
                  >
                    Підтвердити виконання
                  </button>

                  <button 
                    className="task-button" 
                    onClick={handleAbandon}
                    style={{ backgroundColor: '#dc3545' }}
                  >
                    Відмовитись
                  </button>
                </>
              )}
              
              {isCompleted && isPendingProof && (
                <p style={{ fontWeight: 600, color: '#ffc107', marginTop: '20px' }}>
                  Ваш звіт відправлено. Очікуйте перевірки адміном.
                </p>
              )}
              
              {isCompleted && !isPendingProof && (
                 <p style={{ fontWeight: 600, color: '#28a745', marginTop: '20px' }}>
                  Завдання виконано! Бали нараховано.
                </p>
              )}
              {isInProgress && !isAssignedToMe && (
                 <p style={{ fontWeight: 600, color: '#777', marginTop: '20px' }}>
                  Завдання вже в роботі в іншого користувача.
                </p>
              )}

            </div>
          </div>
        </AnimatedPage>

        {isModalOpen && (
          <SubmissionModal 
            task={task}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSuccessSubmission}
          />
        )}

      </main>
    </div>
  );
};

export default TaskDetailPage;