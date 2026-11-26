// The API resolves the tenant's category mapping. Legacy menus retain their existing route.
export function isJuiceItem(item) {
  if (item?.productionStation) return item.productionStation === 'juicer';
  return String(item?.category || '').trim().toLowerCase() === 'juices';
}
