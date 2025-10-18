// src/components/ZoneKPIs.jsx
import React from 'react';

const ZoneKPIs = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;

  const kpiCards = [
    { label: 'Avg Stoppage', field: 'AvgStoppageDuration', suffix: ' min', color: 'text-red-600' },
    { label: 'Total Duration', field: 'TotalStoppageDuration', suffix: ' min', color: 'text-blue-600' },
    { label: 'Avg Deviation', field: 'AvgRouteDeviation', suffix: ' km', color: 'text-yellow-600' },
    { label: 'Total Alerts', field: 'TotalAlerts', suffix: '', color: 'text-purple-600' },
    { label: 'Unique Vehicles', field: 'UniqueVehicles', suffix: '', color: 'text-green-600' }
  ];

  return (
    <div className="space-y-4">
      {data.map((zone, idx) => (
        <div key={idx} className="border rounded-lg p-4">
          <h3 className="font-bold text-lg mb-3">{zone.Zone}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {kpiCards.map((kpi, kidx) => (
              <div key={kidx} className="text-center">
                <div className="text-xs text-gray-500 mb-1">{kpi.label}</div>
                <div className={`text-2xl font-bold ${kpi.color}`}>
                  {(zone[kpi.field] || 0).toFixed(kpi.suffix === ' km' ? 2 : 0)}{kpi.suffix}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ZoneKPIs;
