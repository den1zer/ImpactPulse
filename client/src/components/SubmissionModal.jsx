import React, { useState } from 'react';
import axios from 'axios';
import '../styles/Dashboard.css'; 
import '../styles/AddHelpPage.css'; 
import API_BASE_URL from '../config/api.js';


const SubmissionModal = ({ task, onClose, onSuccess }) => {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return alert('Будь ласка, прикріпіть файл-доказ.');
    if (!description) return alert('Додайте короткий опис виконання.');

    setLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('userToken'));
      const config = { headers: { 'x-auth-token': token } }; 

      const data = new FormData();
      data.append('title', `Виконання: ${task.title}`);
      data.append('type', task.category);
      data.append('taskId', task._id);
      data.append('description', description);
      data.append('proofFile', file);

      await axios.post(`${API_BASE_URL}/api/contributions/add`, data, config);
      
      alert('Чудово! Звіт відправлено на перевірку.');
      onSuccess();
      onClose(); 

    } catch (err) {
      alert('Помилка: ' + (err.response?.data?.msg || 'Щось пішло не так'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        <h3 className="modal-title">Підтвердити виконання</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Опис виконання (Що було зроблено?)</label>
            <textarea 
              className="neumorph-textarea" 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Я виконав завдання..."
              required 
            />
          </div>

          <div className="form-group">
            <label>Файл-доказ (Фото/PDF)</label>
            <label className={`neumorph-file-input ${file ? 'file-selected' : ''}`}>
               <span>{file ? '✅ Файл обрано' : '📁 Натисніть, щоб додати файл'}</span>
               <input type="file" onChange={e => setFile(e.target.files[0])} style={{display: 'none'}} />
            </label>
            {file && <p style={{fontSize: '0.8em', marginTop: '5px'}}>{file.name}</p>}
          </div>

          <button type="submit" className="neumorph-button" disabled={loading}>
            {loading ? 'Відправка...' : 'Відправити на перевірку'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default SubmissionModal;