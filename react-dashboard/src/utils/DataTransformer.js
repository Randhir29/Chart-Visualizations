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

extractLandmark(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return 'Unknown';

  // Match patterns like "1.73 km from M/S Suvidha Auto Service, Shahpur"
  const match = locationStr.match(/^([\d.]+)\s*km\s*from\s+(.+)/i);
  if (match) {
    const distance = match[1];
    let landmark = match[2].trim();

    // Normalize common prefixes
    landmark = landmark
      .replace(/^(M\/S\.?|Ms\/Hsd)\s*/i, '') // remove M/S, M/S., Ms/Hsd
      .replace(/\s+/g, ' ')                 // collapse multiple spaces
      .replace(/\.+$/, '')                  // remove trailing dots
      .trim();

    return `${landmark} (${distance} km)`;
  }

  // If no match, return cleaned original
  return locationStr.trim();
}


  createDerivedColumns(row) {
    const startTime = this.parseDate(row['From Datetime']);
    const endTime = this.parseDate(row['To Datetime']);
    return {
      ...row,
      DurationMinutes: parseFloat(row['Duration (min)']) || 0,
      RouteDeviationKm: parseFloat(row['Distance']) || 0,
      LocationName: this.extractLandmark(row['Stoppage location']),
      Longitude: parseFloat(row['Stoppage Longitude']) || 0,
      Latitude: parseFloat(row['Stoppage Latitude']) || 0,
      AlertType: (() => {
  const raw = row['Source Sheet Name\r']?.replace(/\r/g, '').trim();
  if (!raw || !isNaN(raw) || raw === '-' || raw === '') return 'Unknown';
  return raw.replace(/\s+/g, '_');
})(),
      StartTime: startTime,
      EndTime: endTime,
      TransitTimeMinutes: startTime && endTime ? (endTime - startTime) / (1000 * 60) : 0,
      RouteName: (row['Route No'] || row['Trip Name'] || 'Unknown').trim(),
      VehicleNumber: row['Vehicle Number']?.trim() || 'Unknown',
      Zone: row['Zone']?.trim() || 'Unknown'
    };
  }

  applyGlobalFilters(data, filters) {
    return data.filter(row => {
      const duration = row.DurationMinutes;
      const deviation = row.RouteDeviationKm;
      return duration >= filters.minDuration && deviation >= filters.minDeviation;
    });
  }

  getVehicleAlertCounts(data) {
    return _.countBy(data, 'VehicleNumber');
  }

  filterByAlertThreshold(data, threshold) {
    const vehicleCounts = this.getVehicleAlertCounts(data);
    return data.filter(row => vehicleCounts[row.VehicleNumber] > threshold);
  }

  transform(filters) {
    let data = this.rawData.map(row => this.createDerivedColumns(row));
    //console.log('🔧 Derived rows:', data);
    data = this.applyGlobalFilters(data, filters);
    //console.log('🧹 After global filters:', data);
    if (filters.alertThreshold > 0) {
      data = this.filterByAlertThreshold(data, filters.alertThreshold);
      //console.log('🚨 After alert threshold filter:', data);
    }
    this.transformedData = data;
    console.log('🧪 Sample LocationNames:', data.slice(0, 5).map(d => d.LocationName));
    //console.log('🧠 Parsed AlertTypes:', _.uniq(data.map(d => d.AlertType)));
    console.log('🧠 AlertType counts:', _.countBy(data, 'AlertType'));
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
      row.Longitude !== 0 && row.Latitude !== 0
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

  const validZones = ['NOR', 'WES', 'NCL', 'SOU', 'EAS', 'NWL', 'SCL'];

  const grouped = _(this.transformedData)
    .filter(item => validZones.includes(item.Zone)) // ✅ Only include known zones
    .groupBy(item => `${item.Zone}|||${item.AlertType}`) // ✅ Safe delimiter
    .map((items, key) => {
      const [zone, alertType] = key.split('|||');
      return {
        Zone: zone,
        AlertType: alertType,
        AlertCount: items.length
      };
    })
    .value();

  return grouped;
}

}
