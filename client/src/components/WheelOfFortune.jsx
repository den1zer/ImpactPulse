import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import confetti from 'canvas-confetti';
import '../styles/WheelOfFortune.css';

const PRIZES = [
  { label: '+50 XP', color: '#ff6b6b' },
  { label: '+100 XP', color: '#4ecdc4' },
  { label: '+200 XP', color: '#45b7d1' },
  { label: '+500 XP', color: '#f9ca24' },
  { label: 'Бейдж Удача', color: '#6c5ce7' },
  { label: 'Рамка Золота', color: '#fdcb6e' },
  { label: '🎰 Джекпот 1000 XP', color: '#e84393' },
];

const WheelOfFortune = ({ onPrizeWon }) => {
  const [canSpin, setCanSpin] = useState(false);
  const [nextSpinDate, setNextSpinDate] = useState(null);
  const [timeLeft, setTimeLeft] = useState('');
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prizeModal, setPrizeModal] = useState(null);
  
  const token = localStorage.getItem('userToken') ? JSON.parse(localStorage.getItem('userToken')) : '';
  const isGuest = localStorage.getItem('userRole') === 'guest';

  useEffect(() => {
    if (!isGuest && token) {
      checkStatus();
    }
  }, [isGuest, token]);

  useEffect(() => {
    let timerId;
    if (!canSpin && nextSpinDate) {
      const updateTimer = () => {
        const now = new Date();
        const target = new Date(nextSpinDate);
        const diff = target - now;
        
        if (diff <= 0) {
          setCanSpin(true);
          setTimeLeft('');
          return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const mins = Math.floor((diff / 1000 / 60) % 60);
        
        setTimeLeft(`Наступне кручення через ${days}д ${hours}г ${mins}хв`);
      };
      
      updateTimer();
      timerId = setInterval(updateTimer, 60000); // update every minute
    }
    return () => clearInterval(timerId);
  }, [canSpin, nextSpinDate]);

  const checkStatus = async () => {
    try {
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.get('http://localhost:5000/api/wheel/status', config);
      setCanSpin(res.data.canSpin);
      setNextSpinDate(res.data.nextSpinDate);
    } catch (err) {
      console.error('Failed to check wheel status', err);
    }
  };

  const spinWheel = async () => {
    if (isSpinning || !canSpin || isGuest) return;

    try {
      setIsSpinning(true);
      const config = { headers: { 'x-auth-token': token } };
      const res = await axios.post('http://localhost:5000/api/wheel/spin', {}, config);
      
      const { prizeIndex, prize } = res.data;
      
      // Calculate rotation
      // 7 sectors, so each is 360 / 7 = 51.42 degrees
      // We want the selected sector to be at the top (which is 0 degrees or 360/top pointer)
      // The pointer is at the top (0 degrees or 270 relative to standard circle, but in CSS transform 0 is top if we draw it that way).
      // Let's assume sector 0 starts at 0 deg and goes to 51.42 deg. Center of sector 0 is ~25.71 deg.
      // To get sector `prizeIndex` to the top, we need to rotate backwards by its center degree.
      const sectorAngle = 360 / PRIZES.length;
      const targetRotation = (360 - (prizeIndex * sectorAngle) - (sectorAngle / 2));
      
      // Add 5 full spins (1800 degrees)
      const totalRotation = rotation + 1800 + (targetRotation - (rotation % 360));
      
      setRotation(totalRotation);
      
      // Wait for animation to finish (4.5s)
      setTimeout(() => {
        setIsSpinning(false);
        setCanSpin(false);
        // set the next spin date to 7 days from now approximately, but server will return actual on next reload. 
        // For now just hide timer to avoid jump
        setNextSpinDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); 
        
        triggerConfetti();
        setPrizeModal(prize);
        if (onPrizeWon) {
          onPrizeWon(prize);
        }
      }, 4500);

    } catch (err) {
      console.error('Failed to spin wheel', err);
      setIsSpinning(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ff8a00', '#e52e71', '#4ecdc4', '#f9ca24']
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ff8a00', '#e52e71', '#4ecdc4', '#f9ca24']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  };

  // Generate SVG paths for the wheel slices
  const createSlices = () => {
    const numSlices = PRIZES.length;
    const sliceAngle = 360 / numSlices;
    const radius = 160; 
    const cx = 160;
    const cy = 160;

    return PRIZES.map((prize, i) => {
      const startAngle = (i * sliceAngle - 90) * (Math.PI / 180);
      const endAngle = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);

      const x1 = cx + radius * Math.cos(startAngle);
      const y1 = cy + radius * Math.sin(startAngle);
      const x2 = cx + radius * Math.cos(endAngle);
      const y2 = cy + radius * Math.sin(endAngle);

      const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z`;

      // Calculate text position
      const textAngle = (i * sliceAngle + sliceAngle / 2 - 90) * (Math.PI / 180);
      const textRadius = radius * 0.65;
      const textX = cx + textRadius * Math.cos(textAngle);
      const textY = cy + textRadius * Math.sin(textAngle);
      const textRotation = (i * sliceAngle + sliceAngle / 2);

      return (
        <g key={i}>
          <path d={pathData} fill={prize.color} stroke="#1f2330" strokeWidth="2" />
          <text
            x={textX}
            y={textY}
            fill="#fff"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(${textRotation}, ${textX}, ${textY})`}
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
          >
            {prize.label}
          </text>
        </g>
      );
    });
  };

  if (isGuest) return null; // Don't show wheel to guests

  return (
    <div className="wheel-container">
      <div className="wheel-header">
        <h3>Колесо Фортуни</h3>
        <p>Випробовуй вдачу кожного тижня та вигравай бонуси!</p>
      </div>

      <div className="wheel-wrapper">
        <div className="wheel-pointer"></div>
        <svg 
          className="wheel" 
          viewBox="0 0 320 320" 
          style={{ 
            transform: `rotate(${rotation}deg)`,
            transitionDuration: isSpinning ? '4.5s' : '0s'
          }}
        >
          {createSlices()}
          <circle cx="160" cy="160" r="15" fill="#1f2330" />
          <circle cx="160" cy="160" r="10" fill="var(--accent-primary)" />
        </svg>
      </div>

      <button 
        className="wheel-spin-btn" 
        onClick={spinWheel} 
        disabled={!canSpin || isSpinning}
      >
        {isSpinning ? 'Крутимо...' : 'Крутити'}
      </button>

      {!canSpin && !isSpinning && timeLeft && (
        <div className="timer-text">{timeLeft}</div>
      )}

      {/* Prize Modal */}
      {prizeModal && (
        <div className="prize-modal-overlay">
          <div className="prize-modal">
            <h2>Вітаємо! 🎉</h2>
            <p>Ваш приз:</p>
            <div className="prize-value">
              {prizeModal.label}
            </div>
            <button 
              className="prize-close-btn" 
              onClick={() => setPrizeModal(null)}
            >
              Забрати
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WheelOfFortune;
