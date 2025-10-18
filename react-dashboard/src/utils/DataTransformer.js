// src/utils/DataTransformer.js
import _ from 'lodash';

export default class DataTransformer {
  constructor(rawData) {
    this.rawData = rawData;
    this.transformedData = null;
  }

  parseDate(dateStr) {
    if (!dateStr || dateStr === '-') return null;
    const formats = [
      /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/,
      /(\d{2})\/(\w+)\/(\d{4})\s+(\d{2}):(\d{2})/
    ];
    for (let format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}`);
        } else {
          const months = {
            Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
            Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
          };
          return new Date(match[3], months[match[2]], match[1], match[4], match[5]);
        }
      }
    }
    return null;
  }

  createDerivedColumns(row) {
    const startTime = this.parseDate(row['From Datetime']);
    const endTime = this.parseDate(row['To Datetime']);
    return {
      ...row,
      DurationMinutes: parseFloat(row['Alert Duration (min)']) || 0,
      RouteDeviationKm: parseFloat(row['Route Deviation Distance']) || 0,
      LocationName: row['Stoppage location'] || row['End location'] || row['Start location'] || 'Unknown',
      Longitude: parseFloat(row['Stoppage Longitude']) || 0,
      Latitude: parseFloat(row['Stoppage Latitude']) || 0,
      AlertType: row['Source Sheet Name'] || 'Unknown',
      StartTime: startTime,
      EndTime: endTime,
      TransitTimeMinutes: startTime && endTime ? (endTime - startTime) / (1000 * 60) : 0,
      RouteName: row['Route No'] || row['Trip Name'] || 'Unknown',
      VehicleNumber: row['Vehicle Number'],
      Zone: row['Zone']
    };
  }

  applyGlobalFilters(data, filters) {
    return data.filter(row => {
      const duration = parseFloat(row['Alert Duration (min)']) || 0;
      const deviation = parseFloat(row['Route Deviation Distance']) || 0;
      const status = (row['Trip Status'] || '').toUpperCase();
      return duration > filters.minDuration && status === 'LOADED' && deviation > filters.minDeviation;
    });
  }

  getVehicleAlertCounts(data) {
    return _.countBy(data, 'Vehicle Number');
  }

  filterByAlertThreshold(data, threshold) {
    const vehicleCounts = this.getVehicleAlertCounts(data);
    return data.filter(row => vehicleCounts[row['Vehicle Number']] > threshold);
  }

  transform(filters) {
    let data = this.rawData.map(row => this.createDerivedColumns(row));
    data = this.applyGlobalFilters(data, filters);
    if (filters.alertThreshold > 0) {
      data = this.filterByAlertThreshold(data, filters.alertThreshold);
    }
    this.transformedData = data;
    return data;
  }

  getRouteDeviationData() {
    if (!this.transformedData) return [];
    return _(this.transformedData)
      .groupBy('RouteName')
      .map((items, route) => ({
        RouteName: route,
        AvgRouteDeviationKm: _.meanBy(items, 'RouteDeviationKm'),
        MaxRouteDeviationKm: _.maxBy(items, 'RouteDeviationKm')?.RouteDeviationKm || 0,
        TotalAlerts: items.length
      }))
      .orderBy(['AvgRouteDeviationKm'], ['desc'])
      .value();
  }

  getTopStoppageLocations(limit = 10) {
    if (!this.transformedData) return [];
    return _(this.transformedData)
      .filter(row => row.LocationName && row.LocationName !== 'Unknown')
      .groupBy('LocationName')
      .map((items, location) => ({
        LocationName: location,
        TotalStoppageDuration: _.sumBy(items, 'DurationMinutes'),
        StoppageCount: items.length,
        AvgStoppageDuration: _.meanBy(items, 'DurationMinutes'),
        UniqueVehicles: _.uniqBy(items, 'VehicleNumber').length
      }))
      .orderBy(['TotalStoppageDuration'], ['desc'])
      .take(limit)
      .value();
  }

  getStoppageBubbleData() {
    if (!this.transformedData) return [];
    return this.transformedData.filter(row =>
      row.Longitude !== 0 && row.Latitude !== 0 && row.Longitude && row.Latitude
    );
  }

  getViolationTimeline() {
    if (!this.transformedData) return [];
    return _(this.transformedData)
      .filter(row => row.StartTime)
      .orderBy(['VehicleNumber', 'StartTime'])
      .value();
  }

  getZoneKPIs() {
    if (!this.transformedData) return [];
    return _(this.transformedData)
      .groupBy('Zone')
      .map((items, zone) => ({
        Zone: zone,
        AvgTransitTimeMinutes: _.meanBy(items, 'TransitTimeMinutes'),
        TotalTrips: _.uniqBy(items, 'Load No').length,
        AvgStoppageDuration: _.meanBy(items, 'DurationMinutes'),
        TotalStoppageDuration: _.sumBy(items, 'DurationMinutes'),
        AvgRouteDeviation: _.meanBy(items, 'RouteDeviationKm'),
        MaxRouteDeviation: _.maxBy(items, 'RouteDeviationKm')?.RouteDeviationKm || 0,
        TotalAlerts: items.length,
        UniqueVehicles: _.uniqBy(items, 'VehicleNumber').length
      }))
      .orderBy(['TotalAlerts'], ['desc'])
      .value();
  }

  getAlertTypeDistribution() {
    if (!this.transformedData) return [];
    return _(this.transformedData)
      .groupBy(item => `${item.Zone}_${item.AlertType}`)
      .map((items, key) => {
        const [zone, alertType] = key.split('_');
        return {
          Zone: zone,
          AlertType: alertType,
          AlertCount: items.length
        };
      })
      .value();
  }
}
