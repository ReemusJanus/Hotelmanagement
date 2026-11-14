// The API resolves the tenant's category mapping. Legacy menus retain their existing route.
export function isJuiceItem(item) {
  if (item?.productionStation) return item.productionStation === 'juicer';
  return String(item?.category || '').trim().toLowerCase() === 'juices';
}

// Trusted SQL aliases only; category values stay in the database, never SQL text.
export function stationSQL(alias = 'menu_items') {
  if (!/^[a-z_]+$/.test(alias)) throw new Error('Invalid menu alias');
  return `COALESCE((SELECT cr.station FROM menu_category_routes cr WHERE cr.category_key=lower(btrim(${alias}.category))), CASE WHEN lower(btrim(${alias}.category))='juices' THEN 'juicer' ELSE 'kitchen' END) AS "productionStation"`;
}
