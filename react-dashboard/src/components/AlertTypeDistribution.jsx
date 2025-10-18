// src/components/AlertTypeDistribution.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
import _ from 'lodash';

const AlertTypeDistribution = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;

  const zones = _.uniq(data.map(d => d.Zone));
  const alertTypes = _.uniq(data.map(d => d.AlertType));

  const colors = {
    'Device_Removed': 'rgba(220, 53, 69, 0.8)',
    'Power_Disconnect_Alert': 'rgba(255, 193, 7, 0.8)',
    'Route_Diversion_Alert': 'rgba(255, 159, 64, 0.8)',
    'Stoppage_Violation': 'rgba(153, 102, 255, 0.8)',
    'RouteDeviationStoppage': 'rgba(255, 99, 132, 0.8)'
  };

  const datasets = alertTypes.map(type => ({
    label: type.replace(/_/g, ' '),
    data: zones.map(zone => {
      const item = data.find(d => d.Zone === zone && d.AlertType === type);
      return item ? item.AlertCount : 0;
    }),
    backgroundColor: colors[type] || 'rgba(150, 150, 150, 0.8)',
    borderColor: '#fff',
    borderWidth: 1
  }));

  const chartData = {
    labels: zones,
    datasets
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' }
    },
    scales: {
      x: { stacked: true },
      y: { stacked: true, beginAtZero: true }
    }
  };

  return (
    <div style={{ height: '400px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default AlertTypeDistribution;
