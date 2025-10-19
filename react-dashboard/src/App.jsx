import React, { useState, useEffect, useMemo } from 'react';
import _ from 'lodash';
import {
  CSVUploader,
  FilterPanel,
  RouteDeviationHeatmap,
  TopStoppageLocations,
  StoppageBubblePlot,
  ZoneKPIs,
  AlertTypeDistribution
} from './components';
import ModernDataTable from './components/ModernDataTable';
import ModernDataTable1 from './components/ModernDataTable1';
import DataTransformer from './utils/DataTransformer';
import { createPivot } from './utils/pivotUtils';
import { applyGlobalFilter } from './utils/filterUtils';
import { applyRawTableGlobalFilter } from './utils/filterUtils';
import { exportDashboardToExcel } from './utils/exportDashboardToExcel';

export default function App() {
  const [rawData, setRawData] = useState(null);
  const [globalFilter, setGlobalFilter] = useState('');
  const [filters, setFilters] = useState({
    minDuration: 15,
    minDeviation: 0.5,
    alertThreshold: 1,
    selectedZone: '',
    availableZones: [],
    dateRangeType: '',
    startDate: '',
    endDate: ''
  });

  const transformer = useMemo(() => {
    if (!rawData) return null;
    return new DataTransformer(rawData);
  }, [rawData]);

  const transformedData = useMemo(() => {
    if (!transformer) return null;
    return transformer.transform(filters);
  }, [transformer, filters]);

  const zoneFilteredData = useMemo(() => {
    if (!transformedData) return null;
    if (!filters.selectedZone) return transformedData;
    return transformedData.filter(row => row.Zone === filters.selectedZone);
  }, [transformedData, filters.selectedZone]);

  const filteredData = useMemo(() => {
    if (!zoneFilteredData) return null;
    return applyGlobalFilter(zoneFilteredData, globalFilter);
  }, [zoneFilteredData, globalFilter]);

  const filteredRawTableData = useMemo(() => {
  if (!transformedData) return null;
  return applyRawTableGlobalFilter(transformedData, globalFilter);
}, [transformedData, globalFilter]);

    const moduleData = useMemo(() => {
    if (!transformer || !filteredData) return null;
    transformer.transformedData = filteredData;
    return {
      routeDeviation: transformer.getRouteDeviationData(),
      topStoppages: transformer.getTopStoppageLocations(),
      bubbleData: transformer.getStoppageBubbleData(),
      zoneKPIs: transformer.getZoneKPIs(),
      alertDistribution: transformer.getAlertTypeDistribution()
    };
  }, [transformer, filteredData]);

  useEffect(() => {
    if (rawData) {
      const zones = _.uniq(rawData.map(row => row.Zone).filter(Boolean));
      setFilters(prev => ({ ...prev, availableZones: zones }));
    }
  }, [rawData]);

  const handleDataLoaded = (data) => {
    setRawData(data);
  };

  // Pivot Data
const routeDeviationStoppageData = useMemo(() =>
  createPivot(filteredData || [], ['Zone', 'Route No', 'Trip Name'], [
    { field: 'Duration (min)', type: 'sum', alias: 'TotalDuration' },
    { field: 'Vehicle Number', type: 'count', alias: 'VehicleCount' }
  ])
, [filteredData]);

const stoppageViolationData = useMemo(() =>
  createPivot(filteredData || [], ['Zone', 'Route No', 'Trip Name', 'Stoppage location'], [
    { field: 'Duration (min)', type: 'sum', alias: 'TotalStoppageMinutes' },
    { field: 'Vehicle Number', type: 'count', alias: 'VehicleCount' }
  ])
, [filteredData]);

const routeDeviationData = useMemo(() =>
  createPivot(filteredData || [], ['Zone', 'Route No', 'Trip Name'], [
    { field: 'Duration (min)', type: 'sum', alias: 'TotalDuration' },
    { field: 'Distance', type: 'sum', alias: 'TotalDeviationKm' }
  ])
, [filteredData]);


  // Pivot Columns
  const routeDeviationStoppageColumns = [
    { accessorKey: 'Zone', header: 'Zone' },
    { accessorKey: 'Route No', header: 'Route No' },
    { accessorKey: 'Trip Name', header: 'Trip Name' },
    { accessorKey: 'TotalDuration', header: 'Sum of Duration (min)' },
    { accessorKey: 'VehicleCount', header: 'No. of Vehicles Stoppage' }
  ];

  const stoppageViolationColumns = [
    { accessorKey: 'Zone', header: 'Zone' },
    { accessorKey: 'Route No', header: 'Route No' },
    { accessorKey: 'Trip Name', header: 'Trip Name' },
    { accessorKey: 'StoppageLocation', header: 'Stoppage Location' },
    { accessorKey: 'TotalStoppageMinutes', header: 'Total Stoppage (min)' },
    { accessorKey: 'VehicleCount', header: 'No. of Vehicles Stoppage' }
  ];

  const routeDeviationColumns = [
    { accessorKey: 'Zone', header: 'Zone' },
    { accessorKey: 'Route No', header: 'Route No' },
    { accessorKey: 'Trip Name', header: 'Trip Name' },
    { accessorKey: 'TotalDuration', header: 'Sum of Duration (min)' },
    { accessorKey: 'TotalDeviationKm', header: 'Sum of Distance (km)' }
  ];

    if (!rawData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-2">Vehicle Analytics Dashboard</h1>
          <p className="text-gray-600 mb-6">Upload your CSV file to begin analysis</p>
          <CSVUploader onDataLoaded={handleDataLoaded} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Vehicle Analytics Dashboard</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setRawData(null)}
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Upload New File
            </button>
            <button
              onClick={() =>
                exportDashboardToExcel(
                  {
                    'Raw Table': filteredRawTableData,
                    'Route Deviations': routeDeviationData,
                    'Stoppage Bubbles': moduleData?.bubbleData,
                    'Top Stoppages': moduleData?.topStoppages,
                    'Zone KPIs': Object.entries(moduleData?.zoneKPIs || {}).map(([zone, metrics]) => ({
                      Zone: zone,
                      ...metrics
                    })),
                    'Alert Distribution': moduleData?.alertDistribution
                  },
                  'FullDashboardExport',
                  {
                    includeTimestamp: true,
                    columnMap: {
                      'Zone KPIs': {
                        Zone: 'Zone',
                        totalTrips: 'Total Trips',
                        delayedTrips: 'Delayed',
                        onTimeTrips: 'On Time'
                      }
                    }
                  }
                )
              }
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export Entire Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* 🔍 Global Filter */}
        <div className="bg-white rounded-lg shadow p-4">
          <input
            type="text"
            placeholder="Search across pivot tables..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-4"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Records" value={filteredData?.length || 0} />
          <SummaryCard label="Unique Vehicles" value={_.uniqBy(filteredData || [], 'VehicleNumber').length} />
          <SummaryCard label="Total Duration" value={`${_.sumBy(filteredData || [], 'DurationMinutes').toFixed(0)} min`} />
          <SummaryCard label="Avg Deviation" value={`${_.meanBy(filteredData || [], 'RouteDeviationKm').toFixed(2)} km`} />
        </div>

        {/* Dashboard Modules */}
        <DashboardModule title="Route Deviation Heatmap">
          <RouteDeviationHeatmap data={moduleData?.routeDeviation} />
        </DashboardModule>

        <DashboardModule title="Top 10 Stoppage Locations">
          <TopStoppageLocations data={moduleData?.topStoppages} />
        </DashboardModule>

        <DashboardModule title="Stoppage Geographic Distribution">
          <StoppageBubblePlot data={moduleData?.bubbleData} />
        </DashboardModule>

        <DashboardModule title="Zone KPIs">
          <ZoneKPIs data={moduleData?.zoneKPIs} />
        </DashboardModule>

        <DashboardModule title="Alert Type Distribution by Zone">
          <AlertTypeDistribution data={moduleData?.alertDistribution} />
        </DashboardModule>

        {/* Pivot Tables */}
        <DashboardModule title="Pivot: RouteDeviationStoppage">
          <ModernDataTable data={routeDeviationStoppageData} columns={routeDeviationStoppageColumns} />
        </DashboardModule>

        <DashboardModule title="Pivot: StoppageViolation">
          <ModernDataTable data={stoppageViolationData} columns={stoppageViolationColumns} />
        </DashboardModule>

        <DashboardModule title="Pivot: RouteDeviation">
          <ModernDataTable data={routeDeviationData} columns={routeDeviationColumns} />
        </DashboardModule>

      <DashboardModule title="Raw Transformed Data">
        <ModernDataTable1 data={filteredRawTableData || []} />
      </DashboardModule>

      </main>
    </div>
  );
}

const SummaryCard = ({ label, value }) => (
  <div className="bg-white rounded-lg shadow p-4 text-center">
    <div className="text-sm text-gray-500">{label}</div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

const DashboardModule = ({ title, children }) => (
  <section className="bg-white rounded-lg shadow p-6">
    <h2 className="text-xl font-bold mb-4">{title}</h2>
    {children}
  </section>
);
