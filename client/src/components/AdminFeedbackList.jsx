import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../../config/api.js';
import axios from 'axios';

const StarRating = ({ rating }) => {
  return (
    <div className="admin-rating-stars">
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        return (
          <span key={index} className={starValue <= rating ? 'star-filled' : 'star-empty'}>
            ★
          </span>
        );
      })}
    </div>
  );
};

const AdminFeedbackList = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('userToken'));
        const config = { headers: { 'x-auth-token': token } };
        const res = await axios.get(`${API_BASE_URL}/api/support/feedback`, config);
        setFeedback(res.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  if (loading) return <p>Завантаження відгуків...</p>;
  if (feedback.length === 0) return <p>Нових відгуків немає.</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>Користувач</th>
          <th>Рейтинг (1-5)</th>
          <th>Коментар</th>
        </tr>
      </thead>
      <tbody>
        {feedback.map(item => (
          <tr key={item._id}>
            <td>{item.user ? item.user.username : 'Анонім'}</td>
            <td>
              <StarRating rating={item.rating} />
            </td>
            <td>{item.comment || '---'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default AdminFeedbackList;