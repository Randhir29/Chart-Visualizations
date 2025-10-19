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
import DataTransformer from './utils/DataTransformer';

export default function App() {
  const [rawData, setRawData] = useState(null);
  const [filters, setFilters] = useState({
    minDuration: 0,
    minDeviation: 0,
    alertThreshold: 0,
    selectedZone: '',
    availableZones: []
  });

  const transformer = useMemo(() => {
    if (!rawData) return null;
    return new DataTransformer(rawData);
  }, [rawData]);

  const transformedData = useMemo(() => {
    if (!transformer) return null;
    return transformer.transform(filters);
  }, [transformer, filters]);

  const filteredData = useMemo(() => {
    if (!transformedData) return null;
    if (!filters.selectedZone) return transformedData;
    return transformedData.filter(row => row.Zone === filters.selectedZone);
  }, [transformedData, filters.selectedZone]);

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

  //useEffect(() => {
    //console.log('🔄 Transformed data:', transformedData);
    //console.log('🔍 Filtered data:', filteredData);
    //console.log('📊 Module data:', moduleData);
  //}, [transformedData, filteredData, moduleData]);

  useEffect(() => {
    if (rawData) {
      const zones = _.uniq(rawData.map(row => row.Zone).filter(Boolean));
      setFilters(prev => ({ ...prev, availableZones: zones }));
    }
  }, [rawData]);

  const handleDataLoaded = (data) => {
    setRawData(data);
  };

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
          <button
            onClick={() => setRawData(null)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Upload New File
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <FilterPanel filters={filters} onChange={setFilters} />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard label="Total Records" value={filteredData?.length || 0} />
          <SummaryCard
            label="Unique Vehicles"
            value={_.uniqBy(filteredData || [], 'VehicleNumber').length}
          />
          <SummaryCard
            label="Total Duration"
            value={`${_.sumBy(filteredData || [], 'DurationMinutes').toFixed(0)} min`}
          />
          <SummaryCard
            label="Avg Deviation"
            value={`${_.meanBy(filteredData || [], 'RouteDeviationKm').toFixed(2)} km`}
          />
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
