// src/utils/pivotUtils.js
export function createPivot(data, groupKeys, aggregations) {
  const grouped = {};

  data.forEach(row => {
    const key = groupKeys.map(k => row[k]).join('|||');
    if (!grouped[key]) {
      grouped[key] = groupKeys.reduce((acc, k) => ({ ...acc, [k]: row[k] }), {});
    }

    aggregations.forEach(({ field, type, alias }) => {
      if (!grouped[key][alias]) grouped[key][alias] = 0;
      if (type === 'sum') grouped[key][alias] += parseFloat(row[field]) || 0;
      if (type === 'count') grouped[key][alias] += 1;
    });
  });

  return Object.values(grouped);
}
