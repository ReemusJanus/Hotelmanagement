// Call inside the payment transaction, after locking the order row.
export async function assignDailyBillNumber(conn, orderId) {
  const [[existing]] = await conn.query('SELECT bill_number "billNumber", bill_date::text "billDate" FROM orders WHERE id=? FOR UPDATE', [orderId]);
  if (existing?.billNumber != null) return existing;
  // Serialize number allocation per tenant and local billing date, not globally.
  await conn.query("SELECT pg_advisory_xact_lock(hashtextextended(current_schema() || ':bills:' || CURRENT_DATE::text, 0))");
  const [[next]] = await conn.query('SELECT COALESCE(MAX(bill_number),0)+1 "billNumber", CURRENT_DATE::text "billDate" FROM orders WHERE bill_date=CURRENT_DATE');
  await conn.query('UPDATE orders SET bill_number=?,bill_date=? WHERE id=?', [next.billNumber, next.billDate, orderId]);
  return next;
}
