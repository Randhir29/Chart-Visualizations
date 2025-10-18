// src/components/StoppageBubblePlot.jsx
import React from 'react';
import { Bubble } from 'react-chartjs-2';
import _ from 'lodash';

const StoppageBubblePlot = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;

  const zoneColors = {
    'SCL': 'rgba(255, 99, 132, 0.6)',
    'NCL': 'rgba(54, 162, 235, 0.6)',
    'NWL': 'rgba(255, 206, 86, 0.6)',
    'WES': 'rgba(75, 192, 192, 0.6)',
    'SOU': 'rgba(153, 102, 255, 0.6)',
    'EAS': 'rgba(255, 159, 64, 0.6)'
  };

  const chartData = {
    datasets: _.map(_.groupBy(data, 'Zone'), (items, zone) => ({
      label: zone,
      data: items.map(item => ({
        x: item.Longitude,
        y: item.Latitude,
        r: Math.min(Math.max(item.DurationMinutes / 5, 5), 30)
      })),
      backgroundColor: zoneColors[zone] || 'rgba(150, 150, 150, 0.6)',
      borderColor: '#fff',
      borderWidth: 1
    }))
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = data[context.dataIndex];
            return [
              `Duration: ${item?.DurationMinutes || 0} min`,
              `Location: ${item?.LocationName || 'Unknown'}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Longitude' }
      },
      y: {
        title: { display: true, text: 'Latitude' }
      }
    }
  };

  return (
    <div style={{ height: '400px' }}>
      <Bubble data={chartData} options={options} />
    </div>
  );
};

export default StoppageBubblePlot;
