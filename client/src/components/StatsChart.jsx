import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const StatsChart = ({ contributions }) => {
  const labels = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип'];
  const data = {
    labels,
    datasets: [
      {
        label: 'Внески',
        data: contributions || [2, 4, 3, 5, 6, 8, 7],
        fill: true,
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 220);
          gradient.addColorStop(0, 'rgba(102, 126, 234, 0.55)');
          gradient.addColorStop(1, 'rgba(79, 70, 229, 0.08)');
          return gradient;
        },
        borderColor: '#7c3aed',
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#a855f7',
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    maintainAspectRatio: false,
    layout: { padding: { top: 10, right: 10, bottom: 10, left: 10 } },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#eef2ff',
        bodyColor: '#e2e8f0',
        borderColor: 'rgba(124, 58, 237, 0.7)',
        borderWidth: 1,
        callbacks: {
          label: (context) => ` ${context.parsed.y} внесків`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#c7d2fe', font: { size: 12 } },
      },
      y: {
        grid: { color: 'rgba(148, 163, 184, 0.18)' },
        ticks: {
          color: '#c7d2fe',
          callback: (value) => `${value}`,
          font: { size: 12 },
        },
      },
    },
  };

  return (
    <div className="stats-chart-card">
      <div className="stats-chart-header">
        <div>
          <h2>Активність внесків</h2>
          <p>Огляд внесків за останні місяці.</p>
        </div>
      </div>
      <div className="chart-wrap">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default StatsChart;
