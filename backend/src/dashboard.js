// All queries use the existing authenticated tenant search_path. Never accept a tenant ID here.
export const ACTIVE_ORDER_STATUSES = ['new','preparing','ready','collected','received','served','billing_requested'];
export async function getDashboard(pool) {
  const [days] = await pool.query(`
    WITH context AS (
      SELECT COALESCE(NULLIF(timezone,''),current_setting('TimeZone')) AS zone FROM settings WHERE id=1
    ), dates AS (
      SELECT ((CURRENT_TIMESTAMP AT TIME ZONE zone)::date - offset_day)::date AS day, zone
      FROM context CROSS JOIN generate_series(0,6) AS offset_day
    )
    SELECT to_char(d.day,'YYYY-MM-DD') AS date,d.zone AS timezone,
      COALESCE(SUM(o.total),0)::text AS revenue
    FROM dates d LEFT JOIN orders o ON o.completed_at >= (d.day::timestamp AT TIME ZONE d.zone)
      AND o.completed_at < ((d.day+1)::timestamp AT TIME ZONE d.zone)
      AND o.status='completed' AND o.payment_status='paid'
    GROUP BY d.day,d.zone ORDER BY d.day`);
  if(days.length!==7)throw new Error('Dashboard business settings are unavailable');
  const [[counts]] = await pool.query(`SELECT
    (SELECT COUNT(*) FROM restaurant_tables WHERE active=TRUE) AS "totalTables",
    (SELECT COUNT(*) FROM restaurant_tables WHERE active=TRUE AND status='occupied') AS "occupiedTables",
    (SELECT COUNT(*) FROM orders WHERE status IN ('new','preparing','ready','collected','received','served','billing_requested')) AS "activeOrders",
    (SELECT COUNT(*) FROM inventory WHERE quantity<=min_quantity) AS "lowStock"`);
  const revenueDays=days.map(d=>({date:d.date,revenue:Number(d.revenue)}));
  const todayRevenue=revenueDays[6].revenue,yesterdayRevenue=revenueDays[5].revenue;
  return {
    timezone:days[0].timezone,todayRevenue,yesterdayRevenue,revenueDays,
    growthPercent:yesterdayRevenue ? (todayRevenue-yesterdayRevenue)/yesterdayRevenue*100 : todayRevenue ? null : 0,
    growthKind:yesterdayRevenue ? 'percentage' : todayRevenue ? 'new-sales' : 'no-previous-sales',
    totalTables:Number(counts.totalTables),occupiedTables:Number(counts.occupiedTables),
    occupancyPercent:Number(counts.totalTables)?Math.round(Number(counts.occupiedTables)/Number(counts.totalTables)*100):0,
    activeOrders:Number(counts.activeOrders),lowStock:Number(counts.lowStock)
  };
}
