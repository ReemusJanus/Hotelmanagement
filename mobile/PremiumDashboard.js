import React from 'react';
import {Pressable, RefreshControl, ScrollView, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {LinearGradient} from 'expo-linear-gradient';

export const palette = {background:'#101513',surface:'#19211d',border:'#303c34',text:'#f4f1e8',muted:'#a6b2a8',accent:'#dbc18a'};
export const navigationGroups = [
  {title:'Daily operations', ids:['overview','tables','bookings','orders','parcels']},
  {title:'Business management', ids:['menu','stock','finance','staff']},
  {title:'Workspace', ids:['settings']},
];
export function canOpen(id, user) {
  const module = {tables:'tables',bookings:'bookings',orders:'billing',parcels:'parcels',menu:'menu',stock:'stock',finance:'finance',staff:'staff'}[id];
  return !module || user?.modules?.[module] !== false;
}
const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
const dayKey = value => {const d=new Date(value);return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;};
const statuses = [['available','Available','#8ac3a1'],['occupied','Occupied','#dbc18a'],['reserved','Reserved','#91b8d5'],['cleaning','Cleaning','#b7a2ca']];

export default function PremiumDashboard({state,user,refresh,refreshing,onNavigate}) {
  const orders=state.orders||[], tables=state.tables||[], today=dayKey(new Date());
  const todaysOrders=orders.filter(order=>dayKey(order.createdAt)===today);
  const collected=todaysOrders.filter(order=>order.paymentStatus==='paid').reduce((sum,order)=>sum+(Number(order.total)||0),0);
  const active=orders.filter(order=>!['completed','served','cancelled','canceled'].includes(order.status));
  const latest=[...orders].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)).slice(0,4);
  const occupied=tables.filter(table=>table.status==='occupied').length;
  const shortcuts=[['tables','grid-outline','Floor plan','Manage table service'],['bookings','calendar-outline','Reservations','Plan the next arrival'],['orders','receipt-outline','Orders & billing','Follow every order'],['finance','wallet-outline','Finance','Review your accounts']].filter(([id])=>canOpen(id,user));
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={palette.accent}/>}>
    <View style={s.row}><Text style={s.eyebrow}>YOUR DAILY OVERVIEW</Text><Ionicons name="sparkles-outline" size={19} color={palette.accent}/></View>
    <Text style={s.title}>Service, beautifully managed.</Text>
    <Text style={s.copy}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})} · {user?.companyName||'Your property'}</Text>
    <LinearGradient colors={['#304238','#1c2b23']} start={{x:0,y:0}} end={{x:1,y:1}} style={s.hero}>
      <Text style={s.eyebrow}>TODAY’S PAID ORDERS</Text><Text style={s.revenue}>{money(collected)}</Text>
      <Text style={s.heroCopy}>Value of paid orders created today</Text>
      <View style={s.heroFooter}><Ionicons name="receipt-outline" size={17} color={palette.accent}/><Text style={s.heroCopy}>{todaysOrders.length} orders placed today</Text></View>
    </LinearGradient>
    <View style={s.metrics}>{[[String(active.length),'Active orders','receipt-outline'],[`${occupied}/${tables.length}`,'Tables occupied','restaurant-outline'],[String((state.attendance||[]).filter(item=>!item.checkOut).length),'Staff on duty','people-outline']].map(([value,label,icon])=><View key={label} style={s.metric}><Ionicons name={icon} size={18} color={palette.accent}/><Text style={s.metricValue}>{value}</Text><Text style={s.metricLabel}>{label}</Text></View>)}</View>
    <Text style={s.section}>Your workspace</Text><View style={s.grid}>{shortcuts.map(([id,icon,title,copy])=><Pressable key={id} accessibilityRole="button" accessibilityLabel={`Open ${title}`} onPress={()=>onNavigate(id)} style={({pressed})=>[s.shortcut,pressed&&s.pressed]}><View style={s.row}><View style={s.icon}><Ionicons name={icon} size={22} color={palette.accent}/></View><Ionicons name="arrow-forward" size={17} color={palette.muted}/></View><Text style={s.shortcutTitle}>{title}</Text><Text style={s.small}>{copy}</Text></Pressable>)}</View>
    <Text style={s.section}>The floor at a glance</Text><View style={s.panel}>{tables.length?<><View style={s.bar}>{statuses.map(([status,,color])=>{const count=tables.filter(table=>table.status===status).length;return count?<View key={status} style={{flex:count,backgroundColor:color}}/>:null;})}</View>{statuses.map(([status,label,color])=><View key={status} style={s.statusRow}><View style={[s.dot,{backgroundColor:color}]}/><Text style={s.statusLabel}>{label}</Text><Text style={s.count}>{tables.filter(table=>table.status===status).length}</Text></View>)}</>:<Text style={s.copy}>No tables yet. Add tables from the floor plan to begin.</Text>}</View>
    <View style={s.sectionRow}><Text style={s.section}>Recent orders</Text>{canOpen('orders',user)&&<Pressable accessibilityRole="button" onPress={()=>onNavigate('orders')} style={s.link}><Text style={s.linkText}>View all →</Text></Pressable>}</View>
    <View style={s.panel}>{latest.length?latest.map((order,index)=><View key={order.id} style={[s.order,index>0&&s.orderBorder]}><View style={s.icon}><Ionicons name={order.orderType==='parcel'?'bag-handle-outline':'restaurant-outline'} size={20} color={palette.accent}/></View><View style={s.flex}><Text style={s.orderTitle}>{order.guestName||'Walk-in guest'}</Text><Text style={s.small}>#{order.id} · {order.orderType==='parcel'?'Takeaway':'Dine-in'}</Text></View><View style={s.orderEnd}><Text style={s.orderTitle}>{money(Number(order.total)||0)}</Text><Text style={s.status}>{String(order.status||'new').replace(/_/g,' ')}</Text></View></View>):<View style={s.empty}><Ionicons name="receipt-outline" size={28} color={palette.accent}/><Text style={s.shortcutTitle}>Ready for your first order</Text><Text style={s.copy}>Orders will appear here as service begins.</Text></View>}</View>
  </ScrollView>;
}
const s=StyleSheet.create({
 page:{padding:22,paddingBottom:36,gap:0},row:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},eyebrow:{fontSize:10,fontWeight:'700',letterSpacing:2,color:palette.accent},title:{fontSize:32,lineHeight:39,fontWeight:'600',letterSpacing:-1,color:palette.text,marginTop:14,maxWidth:340},copy:{fontSize:13,lineHeight:21,color:palette.muted,marginTop:10},hero:{padding:24,borderRadius:24,borderWidth:1,borderColor:'#475c49',marginTop:26},revenue:{fontSize:40,fontWeight:'600',letterSpacing:-1,color:palette.text,marginTop:12},heroCopy:{fontSize:12,lineHeight:19,color:'#bdcbbf'},heroFooter:{flexDirection:'row',alignItems:'center',gap:8,borderTopWidth:1,borderTopColor:'#ffffff18',paddingTop:16,marginTop:20},metrics:{flexDirection:'row',gap:8,marginTop:12},metric:{flex:1,padding:13,borderRadius:16,backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border},metricValue:{fontSize:24,fontWeight:'600',color:palette.text,marginTop:12},metricLabel:{fontSize:11,lineHeight:16,color:palette.muted,marginTop:5},section:{fontSize:18,fontWeight:'600',color:palette.text,marginTop:28,marginBottom:14},grid:{flexDirection:'row',flexWrap:'wrap',gap:12},shortcut:{width:'48%',flexGrow:1,padding:16,borderRadius:18,borderWidth:1,borderColor:palette.border,backgroundColor:palette.surface},pressed:{opacity:.65},icon:{width:40,height:40,borderRadius:12,backgroundColor:'#dbc18a10',alignItems:'center',justifyContent:'center'},shortcutTitle:{fontSize:15,fontWeight:'600',color:palette.text,marginTop:16},small:{fontSize:11,lineHeight:17,color:palette.muted,marginTop:5},panel:{backgroundColor:palette.surface,borderWidth:1,borderColor:palette.border,borderRadius:20,padding:18},bar:{height:7,borderRadius:4,overflow:'hidden',flexDirection:'row',gap:3,marginBottom:14},statusRow:{flexDirection:'row',alignItems:'center',gap:10,paddingVertical:9},dot:{height:7,width:7,borderRadius:4},statusLabel:{flex:1,color:palette.muted,fontSize:13},count:{color:palette.text,fontSize:15,fontWeight:'600'},sectionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},link:{minHeight:44,justifyContent:'center',marginTop:14},linkText:{fontSize:12,color:palette.accent},order:{flexDirection:'row',gap:10,alignItems:'center',paddingVertical:13},orderBorder:{borderTopWidth:1,borderTopColor:palette.border},orderTitle:{color:palette.text,fontSize:13,fontWeight:'600'},orderEnd:{alignItems:'flex-end',maxWidth:'40%'},status:{fontSize:10,color:palette.accent,textTransform:'capitalize',marginTop:5},flex:{flex:1},empty:{alignItems:'center',paddingVertical:20},
});
