// src/components/FilterPanel.jsx
import React from 'react';
import { Filter } from 'lucide-react';

const FilterPanel = ({ filters, onChange }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5" />
        <h2 className="text-lg font-bold">Filters</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Min Duration (min)</label>
          <input
            type="number"
            value={filters.minDuration}
            onChange={(e) =>
              onChange({ ...filters, minDuration: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Min Deviation (km)</label>
          <input
            type="number"
            step="0.1"
            value={filters.minDeviation}
            onChange={(e) =>
              onChange({ ...filters, minDeviation: parseFloat(e.target.value) })
            }
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Alert Threshold</label>
          <input
            type="number"
            value={filters.alertThreshold}
            onChange={(e) =>
              onChange({ ...filters, alertThreshold: parseInt(e.target.value) })
            }
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Zone Filter</label>
          <select
            value={filters.selectedZone}
            onChange={(e) =>
              onChange({ ...filters, selectedZone: e.target.value })
            }
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">All Zones</option>
            {filters.availableZones.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
