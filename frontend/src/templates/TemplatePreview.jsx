// Standalone sample-data preview. Never calls the API or reads a signed-in tenant.
import { useState } from "react";
import { AdminDashboard } from "../Dashboard";
import { TemplateProvider } from "./TemplateProvider";

const at = (minutes) => new Date(Date.now() - minutes * 60000).toISOString(), day = (offset) => new Intl.DateTimeFormat("en-CA").format(new Date(Date.now() - offset * 864e5));
const line = (menuId, qty, itemStatus) => ({ menuId, qty, itemStatus, batchNo: 1, handoffStatus: "pending" });
const sample = {
  settings: { currency: "INR", hotelName: "Sample Restaurant" }, users: [], inventory: [], attendance: [{ id: 1 }],
  menu: [{ id: 1, name: "Paneer Tikka", category: "Starters", price: 320, available: true }, { id: 2, name: "Vegetable Biryani", category: "Mains", price: 380, available: true }],
  tables: Array.from({ length: 12 }, (_, i) => ({ id: i + 1, number: i + 1, seats: 4, area: "Main Hall", status: i === 3 || i === 7 ? "occupied" : i === 5 ? "reserved" : i === 9 ? "cleaning" : "available", orderId: i === 3 ? 101 : i === 7 ? 102 : null, bookingTime: i === 5 ? "20:00" : "" })),
  orders: [{ id: 101, tableId: 4, guestName: "Walk-in Guest", waiter: "Asha", status: "preparing", paymentStatus: "unpaid", createdAt: at(14), items: [line(1, 2, "preparing"), line(2, 1, "new")] }, { id: 102, tableId: 8, guestName: "Table party", waiter: "Asha", status: "ready", paymentStatus: "unpaid", createdAt: at(9), items: [line(2, 3, "ready")] }],
  bookings: [{ id: 1, bookingDate: day(0), bookingTime: "20:00", status: "confirmed", tableNumber: 6, guestCount: 4, guestName: "Evening booking" }],
  dashboard: { timezone: "Asia/Kolkata", todayRevenue: 18450, growthKind: "percentage", growthPercent: 8.2, occupiedTables: 2, totalTables: 12, occupancyPercent: 17, activeOrders: 2, lowStock: 0, revenueDays: [12400, 15100, 13900, 17200, 21400, 17050, 18450].map((revenue, i) => ({ date: day(6 - i), revenue })) },
};
export default function TemplatePreview({ Shell, Tables, Ticket }) {
  const [page, setPage] = useState("overview"), code = new URLSearchParams(location.search).get("code") || "classic";
  const user = { id: 0, name: "Sample Admin", role: "admin", companyName: "Sample Restaurant", modules: {} };
  // Profile and destructive controls stay unreachable: only navigation inside the sample shell responds.
  const guard = (event) => { const button = event.target.closest("button"); if (button && !button.closest("nav,.responsive-navigation,.mobile-navigation-drawer,.notice-centre,.global-search,.sidebar-toggle,.dash,.modal-close")) { event.preventDefault(); event.stopPropagation(); } };
  return <TemplateProvider tenant="preview" config={{ code }} pending={null}><div onClickCapture={guard}>
    <Shell role="admin" user={user} page={page} setPage={setPage} logout={() => {}} settings={{}} notices={[{ title: "1 table waiting to pay", detail: "Sample notice", page: "tables" }]}>
      {page === "overview" ? <AdminDashboard data={sample} user={user} setPage={setPage} notices={[{ title: "1 table waiting to pay", detail: "Sample notice", page: "tables" }]}/> : <><div className="page-head"><div><span className="eyebrow">SAMPLE</span><h1>Tables and kitchen</h1><p>How floor cards and kitchen tickets look in this template.</p></div></div><div className="table-grid">{sample.tables.slice(0, 8).map((table) => <Tables key={table.id} table={table} data={sample} order={sample.orders.find((order) => order.id === table.orderId)} onClick={() => {}}/>)}</div><div className="kitchen-grid" style={{ marginTop: 18 }}>{sample.orders.map((order) => <Ticket key={order.id} data={sample} order={{ ...order, batchNo: 1, productionStatus: order.status, handoffStatus: "pending" }}/>)}</div></>}
    </Shell></div></TemplateProvider>;
}
