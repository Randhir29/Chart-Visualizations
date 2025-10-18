// src/components/TopStoppageLocations.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';

const TopStoppageLocations = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;

  const chartData = {
    labels: data.map(d => d.LocationName.substring(0, 30)), // Always uses Stoppage location
    datasets: [{
      label: 'Total Stoppage Duration (min)',
      data: data.map(d => d.TotalStoppageDuration),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
        '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
      ],
      borderColor: '#fff',
      borderWidth: 2
    }]
  };

  const options = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.x} minutes`
        }
      }
    },
    scales: {
      x: { beginAtZero: true }
    }
  };

  return (
    <div style={{ height: '400px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TopStoppageLocations;
