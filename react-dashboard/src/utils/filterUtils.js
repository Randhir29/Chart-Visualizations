export function applyGlobalFilter(data, filterText) {
  if (!filterText) return data;

  const lower = filterText.toLowerCase();

  return data.filter(row =>
    ['Zone', 'RouteNo', 'TripName', 'StoppageLocation', 'VehicleNumber'].some(key =>
      String(row[key] ?? '').toLowerCase().includes(lower)
    )
  );
}

export function applyRawTableGlobalFilter(data, filterText) {
  if (!filterText) return data;

  const lower = filterText.toLowerCase();

  return data.filter(row =>
    [['Zone', 'Route No', 'Trip Name', 'Stoppage Location', 'Vehicle Number']
].some(key =>
      String(row[key] ?? '').toLowerCase().includes(lower)
    )
  );
}
