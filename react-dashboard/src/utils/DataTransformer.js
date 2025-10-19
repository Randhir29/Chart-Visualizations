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
    if (!locationStr || typeof locationStr !== 'string' || locationStr.trim() === '0') return 'Unknown';

    const match = locationStr.match(/^([\d.]+)\s*km\s*from\s+(.+)/i);
    if (match) {
      const distance = match[1];
      let landmark = match[2].trim();

      landmark = landmark
        .replace(/^(M\/S\.?|Ms\/Hsd)\s*/i, '')
        .replace(/\s+/g, ' ')
        .replace(/\.+$/, '')
        .trim();

      return `${landmark} (${distance} km)`;
    }

    return locationStr.trim();
  }

  transformHeader(header) {
    return header.trim().replace(/\r/g, '');
  }

  getField(row, ...keys) {
    for (let key of keys) {
      const match = Object.keys(row).find(k => k.trim().replace(/\r/g, '') === key);
      if (match) return row[match];
    }
    return '';
  }


  createDerivedColumns(row) {
    const startTime = this.parseDate(row['From Datetime']);
    const endTime = this.parseDate(row['To Datetime']);
    return {
      ...row,
      DurationMinutes: parseFloat(row['Duration (min)']) || 0,
      RouteDeviationKm: parseFloat(row['Distance']) || 0,
      LocationName: this.extractLandmark(this.getField(row, 'Stoppage location', 'Stoppage Location', 'Location')),
      Longitude: parseFloat(row['Stoppage Longitude']) || 0,
      Latitude: parseFloat(row['Stoppage Latitude']) || 0,
      AlertType: (() => {
                  const raw = row['Source Sheet Name']?.trim();
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
    const alertType = row.AlertType;

    const isStoppageViolation = alertType === 'Stoppage_Violation';
    

    // Must meet duration threshold
    if (duration < filters.minDuration) return false;

   // Only Stoppage_Violation bypasses deviation filter
    if (!isStoppageViolation) {
      return deviation >= filters.minDeviation;
    }

    // For all other alert types (including Stoppage_Violation), include if duration is valid
    return true;
  });
}


  getVehicleAlertCounts(data) {
    return _.countBy(data, 'VehicleNumber');
  }

  filterByAlertThreshold(data, threshold) {
    const vehicleCounts = this.getVehicleAlertCounts(data);
    return data.filter(row => vehicleCounts[row.VehicleNumber] > threshold);
  }

  filterByDateRange(data, rangeType, referenceDate = new Date()) {
  const ref = new Date(referenceDate);
  return data.filter(row => {
    const start = row.StartTime;
    if (!start) return false;

    switch (rangeType) {
      case 'daily': {
        return start.toDateString() === ref.toDateString();
      }
      case 'weekly': {
        const sevenDaysAgo = new Date(ref);
        sevenDaysAgo.setDate(ref.getDate() - 7);
        return start >= sevenDaysAgo && start <= ref;
      }
      case 'monthly': {
        return start.getMonth() === ref.getMonth() && start.getFullYear() === ref.getFullYear();
      }
      case 'yearly': {
        return start.getFullYear() === ref.getFullYear();
      }
      case 'last7days': {
        const sevenDaysAgo = new Date(ref);
        sevenDaysAgo.setDate(ref.getDate() - 7);
        return start >= sevenDaysAgo && start <= ref;
      }
      case 'last30days': {
        const thirtyDaysAgo = new Date(ref);
        thirtyDaysAgo.setDate(ref.getDate() - 30);
        return start >= thirtyDaysAgo && start <= ref;
      }
      case 'lastQuarter': {
        const currentMonth = ref.getMonth();
        const currentYear = ref.getFullYear();
        const quarterStartMonth = currentMonth - (currentMonth % 3) - 3;
        const quarterStart = new Date(currentYear, quarterStartMonth, 1);
        const quarterEnd = new Date(currentYear, quarterStartMonth + 3, 0, 23, 59, 59);
        return start >= quarterStart && start <= quarterEnd;
      }
      default:
        return true; // No filtering
    }
  });
}


  transform(filters) {
    // Step 1: Initial transformation
    let data = this.rawData.map(row => this.createDerivedColumns(row));
    //console.log('🔧 Derived rows:', data);
    //console.log('📍 Sample LocationNames:',data.filter(d => d.LocationName && d.LocationName !== 'Unknown' && d.LocationName !== '0')
    //.slice(0, 100)
    //.map(d => d.LocationName));

    // Step 2: Apply date range filter if specified
    if (filters.dateRangeType) {
      data = this.filterByDateRange(data, filters.dateRangeType, filters.referenceDate);
      //console.log(`📅 After ${filters.dateRangeType} filter:`, data.length);
    }

     // Step 3: Apply global filters (duration + deviation logic)
    //console.log('Before filter:', data,data.length);
    data = this.applyGlobalFilters(data, filters);
    //console.log('🧹 After global filters:', data,data.length);

    // Step 4: Apply alert threshold filter if needed
    if (filters.alertThreshold > 0) {
      data = this.filterByAlertThreshold(data, filters.alertThreshold);
      //console.log('🚨 After alert threshold filter:', data);
    }

    // Step 5: Store transformed data
    this.transformedData = data;
    //console.log('🧪 Sample LocationNames:', data.slice(0, 5).map(d => d.LocationName));
    //console.log('🧠 Parsed AlertTypes:', _.uniq(data.map(d => d.AlertType)));
    //console.log('🧠 AlertType counts:', _.countBy(data, 'AlertType'));
    //console.log('📊 Top grouped locations:', _(this.transformedData).countBy('LocationName').toPairs().sort((a, b) => b[1] - a[1]).slice(0, 10));
    //console.log( '🧭 Stoppage check:', _.countBy(this.transformedData.map(d => d.LocationName),name => name === 'Unknown' ? 'Unknown' : 'Valid'));
    //console.log('🧮 Sample durations:',this.transformedData.slice(0, 10).map(d => ({LocationName: d.LocationName,DurationMinutes: d.DurationMinutes,VehicleNumber: d.VehicleNumber})));
    
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
      .orderBy(['StoppageCount'], ['desc'])
      //.orderBy(['StoppageCount', 'TotalStoppageDuration'], ['desc', 'desc'])
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
  if (!this.transformedData) {
    //console.log('⚠️ No transformed data available.');
    return [];
  }

  // Log all unique alert types
  const allAlertTypes = _.uniq(this.transformedData.map(d => d.AlertType));
  //console.log('🔍 Unique AlertTypes:', allAlertTypes);

   // Step 2: Print all unique Zones
  const uniqueZones = _.uniq(this.transformedData.map(d => d.Zone));
  //console.log('🌐 Unique Zones:', uniqueZones);

   // Step 3: Count rows per (Zone, AlertType) pair
  const zoneAlertCounts = _.countBy(this.transformedData, d => `${d.Zone}|||${d.AlertType}`);
  //console.log('📊 Zone-AlertType Counts:', zoneAlertCounts);

  // Step 4: Sample rows for inspection
  //console.log('📋 Sample rows with AlertType:',this.transformedData.filter(d => d.AlertType).slice(0, 10).map(d => ({
        //Zone: d.Zone,AlertType: d.AlertType,VehicleNumber: d.VehicleNumber,DurationMinutes: d.DurationMinutes,RouteDeviationKm: d.RouteDeviationKm
      //})));

  // Final grouping logic
  const grouped = _(this.transformedData)
    .filter(item => item.Zone && item.AlertType)
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
