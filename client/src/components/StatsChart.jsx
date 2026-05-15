import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { FiActivity, FiPieChart, FiBarChart2 } from 'react-icons/fi';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Tooltip, Legend, Filler
);

const StatsChart = ({ contributions = [] }) => {
  const [activeTab, setActiveTab] = useState('activity');

  // Process data for charts
  const { activityData, typeData, statusData } = useMemo(() => {
    // 1. Activity (last 6 months)
    const months = [];
    const monthLabels = [];
    const countsByMonth = {};
    
    // Create last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      const mName = d.toLocaleString('uk-UA', { month: 'short' });
      months.push(mKey);
      monthLabels.push(mName.charAt(0).toUpperCase() + mName.slice(1));
      countsByMonth[mKey] = 0;
    }

    // 2. Types
    const typeCounts = { donation: 0, volunteering: 0, aid: 0, other: 0 };
    
    // 3. Status
    const statusCounts = { approved: 0, pending: 0, rejected: 0 };

    contributions.forEach(c => {
      // Activity
      const d = new Date(c.createdAt || Date.now());
      const mKey = `${d.getFullYear()}-${d.getMonth()}`;
      if (countsByMonth[mKey] !== undefined) {
        countsByMonth[mKey] += 1;
      }

      // Type
      if (typeCounts[c.type] !== undefined) {
        typeCounts[c.type] += 1;
      } else {
        typeCounts.other += 1; // Fallback
      }

      // Status
      if (statusCounts[c.status] !== undefined) {
        statusCounts[c.status] += 1;
      }
    });

    return {
      activityData: {
        labels: monthLabels,
        data: months.map(m => countsByMonth[m]),
      },
      typeData: typeCounts,
      statusData: statusCounts
    };
  }, [contributions]);

  // Chart configs
  const lineData = {
    labels: activityData.labels,
    datasets: [{
      label: 'Заявок',
      data: activityData.data,
      fill: true,
      backgroundColor: (context) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 220);
        gradient.addColorStop(0, 'rgba(124, 58, 237, 0.4)');
        gradient.addColorStop(1, 'rgba(124, 58, 237, 0.0)');
        return gradient;
      },
      borderColor: '#7c3aed',
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#a855f7',
      pointHoverRadius: 6,
    }],
  };

  const lineOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-muted)' } },
      y: { 
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        ticks: { color: 'var(--text-muted)', stepSize: 1, precision: 0 }
      },
    },
  };

  const doughnutData = {
    labels: ['Донати', 'Волонтерство', 'Допомога', 'Інше'],
    datasets: [{
      data: [typeData.donation, typeData.volunteering, typeData.aid, typeData.other],
      backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#64748b'],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };

  const doughnutOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right', labels: { color: 'var(--text-primary)' } }
    },
    cutout: '70%',
  };

  const barData = {
    labels: ['Схвалено', 'На розгляді', 'Відхилено'],
    datasets: [{
      label: 'Кількість',
      data: [statusData.approved, statusData.pending, statusData.rejected],
      backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderRadius: 4,
    }],
  };

  const barOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: 'var(--text-muted)' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: 'var(--text-muted)', stepSize: 1, precision: 0 } },
    },
  };

  return (
    <div className="stats-chart-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="stats-chart-header" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0' }}>Ваша статистика</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Детальний огляд вашої активності</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', background: 'var(--bg-subtle)', padding: '4px', borderRadius: 'var(--radius-md)' }}>
          <button 
            onClick={() => setActiveTab('activity')}
            style={{ padding: '6px 12px', border: 'none', background: activeTab === 'activity' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'activity' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: activeTab === 'activity' ? '600' : 'normal', transition: 'all 0.2s', boxShadow: activeTab === 'activity' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
          >
            <FiActivity /> Активність
          </button>
          <button 
            onClick={() => setActiveTab('types')}
            style={{ padding: '6px 12px', border: 'none', background: activeTab === 'types' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'types' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: activeTab === 'types' ? '600' : 'normal', transition: 'all 0.2s', boxShadow: activeTab === 'types' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
          >
            <FiPieChart /> Категорії
          </button>
          <button 
            onClick={() => setActiveTab('status')}
            style={{ padding: '6px 12px', border: 'none', background: activeTab === 'status' ? 'var(--bg-surface)' : 'transparent', color: activeTab === 'status' ? 'var(--accent)' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: activeTab === 'status' ? '600' : 'normal', transition: 'all 0.2s', boxShadow: activeTab === 'status' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none' }}
          >
            <FiBarChart2 /> Статуси
          </button>
        </div>
      </div>
      
      <div className="chart-wrap" style={{ flex: 1, minHeight: '250px', position: 'relative' }}>
        {activeTab === 'activity' && <Line data={lineData} options={lineOptions} />}
        {activeTab === 'types' && (
          contributions.length > 0 
            ? <Doughnut data={doughnutData} options={doughnutOptions} />
            : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Немає даних для відображення</div>
        )}
        {activeTab === 'status' && (
          contributions.length > 0 
            ? <Bar data={barData} options={barOptions} />
            : <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Немає даних для відображення</div>
        )}
      </div>
    </div>
  );
};

export default StatsChart;
