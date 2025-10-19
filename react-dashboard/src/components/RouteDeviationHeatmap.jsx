// src/components/RouteDeviationHeatmap.jsx
import React from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(
  LinearScale,
  CategoryScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title
);

const RouteDeviationHeatmap = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;

  const getColor = (value, max) => {
    const ratio = value / max;
    if (ratio > 0.75) return 'bg-red-100 text-red-800';
    if (ratio > 0.5) return 'bg-orange-100 text-orange-800';
    if (ratio > 0.25) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const maxDeviation = Math.max(...data.map(d => d.AvgRouteDeviationKm));

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left">Route Name</th>
            <th className="px-4 py-2 text-right">Avg Deviation (km)</th>
            <th className="px-4 py-2 text-right">Max Deviation (km)</th>
            <th className="px-4 py-2 text-right">Total Alerts</th>
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{row.RouteName}</td>
              <td className={`px-4 py-2 text-right ${getColor(row.AvgRouteDeviationKm, maxDeviation)}`}>
                {row.AvgRouteDeviationKm.toFixed(2)}
              </td>
              <td className="px-4 py-2 text-right">{row.MaxRouteDeviationKm.toFixed(2)}</td>
              <td className="px-4 py-2 text-right">{row.TotalAlerts}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RouteDeviationHeatmap;
