export const transformData = (data, agent1) => {
  return data.map(row => ({
    LocationName: row["End location"] || row["Start location"] || "Unknown",
    DurationMinutes: parseFloat(row["Duration (min)"] || "0"),
    VehicleNumber: row["Vehicle Number"]
  }));
};
