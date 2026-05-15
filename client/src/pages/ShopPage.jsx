import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedPage from '../components/AnimatedPage';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader';
import { FiTag, FiAward, FiImage } from 'react-icons/fi';
import API_BASE_URL from '../config/api.js';
import './ShopPage.css';

const ShopPage = () => {
  const [items, setItems] = useState([]);
  const [coins, setCoins] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState(null);
  const [animatingCoin, setAnimatingCoin] = useState(false);
  const token = localStorage.getItem('userToken');

  useEffect(() => {
    fetchUserData();
    fetchShopItems();
  }, []);

  const fetchUserData = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/me`, {
        headers: { 'x-auth-token': token }
      });
      setCoins(res.data.coins || 0);
    } catch (err) {
      console.error('Error fetching user data', err);
    }
  };

  const fetchShopItems = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/shop`, {
        headers: { 'x-auth-token': token }
      });
      // Filter out items that are out of stock
      const availableItems = res.data.filter(item => item.stock !== 0);
      setItems(availableItems);
      setLoading(false);
    } catch (err) {
      setError('Не вдалося завантажити товари.');
      setLoading(false);
    }
  };

  const handleBuy = async (item) => {
    if (coins < item.price) {
      setPurchaseMessage({ type: 'error', text: 'Недостатньо ImpactCoins!' });
      setTimeout(() => setPurchaseMessage(null), 3000);
      return;
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/api/shop/buy`, 
        { itemId: item._id },
        { headers: { 'x-auth-token': token } }
      );
      
      // Animate deduction
      setAnimatingCoin(true);
      setTimeout(() => setAnimatingCoin(false), 1000);

      setCoins(res.data.currentCoins);
      setPurchaseMessage({ type: 'success', text: 'Покупка успішна!' });
      setTimeout(() => setPurchaseMessage(null), 3000);
      
      // Update items (decrease stock visually if not infinite)
      setItems(prevItems => prevItems.map(i => {
        if (i._id === item._id && i.stock > 0) {
          return { ...i, stock: i.stock - 1 };
        }
        return i;
      }).filter(i => i.stock !== 0));

    } catch (err) {
      const errMsg = err.response?.data?.msg || 'Помилка при покупці';
      setPurchaseMessage({ type: 'error', text: errMsg });
      setTimeout(() => setPurchaseMessage(null), 3000);
    }
  };

  // Mock static layout for professional SaaS look if no items exist yet
  const displayItems = items.length > 0 ? items : [
    { _id: '1', name: 'Знижка ОККО', description: 'Знижка 15% на 20л будь-якого палива на АЗС ОККО', price: 10, type: 'partner_coupon', stock: -1 },
    { _id: '2', name: 'Кава в подарунок', description: 'Безкоштовна кава в мережі Aroma Kava', price: 5, type: 'partner_coupon', stock: 50 },
    { _id: '3', name: 'Premium Бейдж', description: 'Ексклюзивний бейдж мецената у профілі', price: 50, type: 'badge', stock: -1 },
    { _id: '4', name: 'Промокод Розетка', description: 'Знижка 10% на товари для дому', price: 20, type: 'partner_coupon', stock: 100 }
  ];

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <DashboardHeader />
        <AnimatedPage>
          <div className="dashboard-content-wrapper">
            {/* Hero */}
            <div className="shop-hero">
              <div>
                <p className="small-title">ImpactPulse / Магазин</p>
                <h2>Обмін балів на нагороди</h2>
                <p>Обмінюйте ваші ImpactCoins на реальні винагороди та знижки від партнерів.</p>
              </div>
              <div className={`shop-balance ${animatingCoin ? 'pulse-deduct' : ''}`}>
                <span className="balance-label">Баланс</span>
                <div className="coin-display">
                  <span className="coin-amount">{coins}</span>
                  <img src="/impact-coin.svg" alt="IC" className="coin-icon"
                    onError={e => { e.target.onerror=null; e.target.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3C/svg%3E"; }}
                  />
                </div>
              </div>
            </div>


        <AnimatePresence>
          {purchaseMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`purchase-alert ${purchaseMessage.type}`}
            >
              {purchaseMessage.text}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && items.length === 0 ? (
          <div className="shop-loading">Завантаження пропозицій...</div>
        ) : error ? (
          <div className="shop-error">{error}</div>
        ) : (
          <div className="shop-grid">
            {displayItems.map((item, index) => (
              <motion.div 
                className="shop-card" 
                key={item._id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <div className="card-image-placeholder">
                  {item.type === 'partner_coupon' ? <FiTag size={48} color="var(--text-secondary)" /> : 
                   item.type === 'badge' ? <FiAward size={48} color="var(--text-secondary)" /> : 
                   <FiImage size={48} color="var(--text-secondary)" />}
                </div>
                <div className="card-content">
                  <div className="card-badge">{item.type === 'partner_coupon' ? 'Знижка' : 'Ексклюзив'}</div>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="card-footer">
                    <div className="price-tag">
                      <span className="price-value">{item.price}</span>
                      <img src="/impact-coin.svg" alt="IC" className="small-coin" onError={(e) => {e.target.onerror = null; e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FFD700'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpath d='M12 6v12m-3-6h6' stroke='%23B8860B' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E"}} />
                    </div>
                    <button 
                      className={`buy-btn ${coins < item.price ? 'disabled' : ''}`}
                      onClick={() => handleBuy(item)}
                      disabled={coins < item.price}
                    >
                      Придбати
                    </button>
                  </div>
                  {item.stock > 0 && <div className="stock-info">Залишилось: {item.stock} шт.</div>}
                </div>
              </motion.div>
            ))}
          </div>
        )}
          </div>
        </AnimatedPage>
      </main>
    </div>
  );
};

export default ShopPage;
