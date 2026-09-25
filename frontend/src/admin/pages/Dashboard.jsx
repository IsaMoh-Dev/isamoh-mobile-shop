import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend } from 'chart.js';
import { useAuth }     from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../api/axios';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Tooltip, Legend);

export default function Dashboard() {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const [stats,    setStats]    = useState(null);
  const [products, setProducts] = useState(0);
  const [users,    setUsers]    = useState(0);
  const [lowStock, setLowStock] = useState([]);
  const [msgs,     setMsgs]     = useState([]);

  useEffect(() => {
    api.get('/orders/stats').then(r => setStats(r.data)).catch(() => {});
    api.get('/products?limit=1').then(r => setProducts(r.data.total || 0)).catch(() => {});
    api.get('/users?limit=1').then(r => setUsers(r.data.total || 0)).catch(() => {});
    api.get('/products?maxPrice=0&limit=20').then(() => {}).catch(() => {});
    api.get('/products?limit=20').then(r => setLowStock((r.data.products || []).filter(p => p.stock <= 5))).catch(() => {});
    api.get('/settings/messages').then(r => setMsgs((r.data.messages || []).slice(0, 5))).catch(() => {});
  }, []);

  const statCards = [
    { label: 'Products',      value: products,                   color: 'var(--secondary)', icon: 'fas fa-box text-primary',    link: '/admin/products' },
    { label: 'Total Orders',  value: stats?.totalOrders || 0,    color: '#28a745',           icon: 'fas fa-shopping-bag text-success', link: '/admin/orders' },
    { label: 'Pending',       value: stats?.statusCounts?.pending || 0, color: '#fd7e14',    icon: 'fas fa-clock text-warning',  link: '/admin/orders' },
    { label: 'Revenue',       value: formatPrice(stats?.totalRevenue || 0), color: '#dc3545', icon: 'fas fa-dollar-sign text-danger', link: '/admin/orders' },
    { label: 'Users',         value: users,                      color: '#ffc107',           icon: 'fas fa-users text-warning',  link: '/admin/users' },
  ];

  const revenueChart = {
    labels: (stats?.sevenDays || []).map(d => d.date),
    datasets: [
      { label: 'Revenue ($)', data: (stats?.sevenDays||[]).map(d=>d.revenue), backgroundColor:'rgba(0,165,196,0.2)', borderColor:'#00A5C4', borderWidth:2, borderRadius:6, type:'bar' },
      { label: 'Orders',      data: (stats?.sevenDays||[]).map(d=>d.orders),  borderColor:'#003859', backgroundColor:'rgba(0,56,89,0.08)', borderWidth:2, type:'line', yAxisID:'y2', tension:0.4, pointBackgroundColor:'#003859', pointRadius:4 },
    ],
  };

  const sc = stats?.statusCounts || {};
  const donutChart = {
    labels: ['Pending','Processing','Shipped','Delivered','Cancelled'],
    datasets: [{ data: [sc.pending||0,sc.processing||0,sc.shipped||0,sc.delivered||0,sc.cancelled||0], backgroundColor:['#ffc107','#17a2b8','#007bff','#28a745','#dc3545'], borderWidth:2, borderColor:'#fff' }],
  };

  return (
    <>
      <div className="admin-topbar">
        <h5 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Dashboard</h5>
        <span style={{ fontSize:13, color:'#888' }}>Welcome back, <strong>{user?.firstName}</strong></span>
      </div>

      {/* Stats */}
      <div className="row g-4 mb-4">
        {statCards.map(c => (
          <div key={c.label} className="col-md-2 col-sm-6">
            <Link to={c.link} className="text-decoration-none">
              <div className="stat-card" style={{ borderLeftColor: c.color }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div><div className="stat-label">{c.label}</div><div className="stat-value">{c.value}</div></div>
                  <i className={`${c.icon} stat-icon`} />
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="bg-white rounded-3 shadow-sm p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:700, color:'#003859' }}><i className="fas fa-chart-line me-2 text-primary" />Revenue — Last 7 Days</h6>
              <span style={{ fontSize:12, color:'#888' }}>Total: <strong className="text-danger">{formatPrice((stats?.sevenDays||[]).reduce((s,d)=>s+d.revenue,0))}</strong></span>
            </div>
            {stats && <Bar data={revenueChart} options={{ responsive:true, interaction:{mode:'index',intersect:false}, plugins:{legend:{position:'top'}}, scales:{y:{beginAtZero:true,ticks:{callback:v=>'$'+v}},y2:{beginAtZero:true,position:'right',grid:{drawOnChartArea:false},ticks:{stepSize:1}}}}} />}
          </div>
        </div>
        <div className="col-lg-4">
          <div className="bg-white rounded-3 shadow-sm p-4">
            <h6 className="mb-3" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:700, color:'#003859' }}><i className="fas fa-chart-pie me-2 text-info" />Order Status</h6>
            {stats && <Doughnut data={donutChart} options={{ responsive:true, cutout:'65%', plugins:{legend:{display:false}}}} />}
            <div className="mt-3 d-flex flex-wrap gap-2 justify-content-center" style={{ fontSize:11 }}>
              {[['#ffc107','Pending'],['#17a2b8','Processing'],['#007bff','Shipped'],['#28a745','Delivered'],['#dc3545','Cancelled']].map(([color,label]) => (
                <span key={label} style={{ display:'inline-flex', alignItems:'center', gap:4 }}>
                  <span style={{ width:10, height:10, borderRadius:'50%', background:color, display:'inline-block' }} />{label} ({sc[label.toLowerCase()]||0})
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products + Messages */}
      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <div className="bg-white rounded-3 shadow-sm overflow-hidden">
            <div className="p-3 border-bottom"><h6 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}><i className="fas fa-trophy me-2 text-warning" />Top Selling Products</h6></div>
            <div className="p-3">
              {(stats?.topProducts || []).length === 0 ? <p className="text-muted text-center py-3" style={{ fontSize:13 }}>No sales data yet.</p> : (
                (stats?.topProducts || []).map((p, i) => (
                  <div key={p._id} className="d-flex align-items-center gap-3 mb-3">
                    <span style={{ width:22, height:22, background:['#FFD700','#C0C0C0','#CD7F32','#003859','#00A5C4'][i], color:'#fff', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p._id}</div>
                      <div style={{ height:6, background:'#f0f0f0', borderRadius:3, marginTop:4, overflow:'hidden' }}>
                        <div style={{ width:`${Math.round(p.totalQty/((stats?.topProducts[0]?.totalQty)||1)*100)}%`, height:'100%', background:'linear-gradient(90deg,#003859,#00A5C4)', borderRadius:3 }} />
                      </div>
                    </div>
                    <div style={{ flexShrink:0, textAlign:'right' }}>
                      <div style={{ fontSize:12, fontWeight:700, color:'#003859' }}>{p.totalQty} sold</div>
                      <div style={{ fontSize:11, color:'#dc3545' }}>{formatPrice(p.totalRev)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-6">
          <div className="bg-white rounded-3 shadow-sm overflow-hidden">
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
              <h6 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}><i className="fas fa-envelope me-2 text-primary" />Recent Messages</h6>
              <Link to="/admin/settings" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            {msgs.length === 0 ? <p className="text-muted text-center py-4" style={{ fontSize:13 }}>No messages yet.</p> : (
              <div className="list-group list-group-flush">
                {msgs.map(m => (
                  <div key={m._id} className={`list-group-item px-3 py-2 ${!m.isRead ? 'bg-light' : ''}`}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontSize:13, fontWeight: m.isRead?500:700 }}>{!m.isRead && <span className="badge bg-danger me-1" style={{ fontSize:9 }}>NEW</span>}{m.name} <span style={{ fontWeight:400, color:'#888', fontSize:12 }}>— {m.subject}</span></div>
                        <div style={{ fontSize:11, color:'#888', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.message.slice(0,60)}...</div>
                      </div>
                      <span style={{ fontSize:10, color:'#aaa', flexShrink:0, marginLeft:8 }}>{new Date(m.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div className="bg-white rounded-3 shadow-sm mb-4 overflow-hidden">
          <div className="p-3 border-bottom d-flex align-items-center gap-2" style={{ background:'#fff3cd' }}>
            <i className="fas fa-exclamation-triangle text-warning" />
            <h6 className="mb-0 fw-bold" style={{ color:'#856404' }}>Low Stock Alert — {lowStock.length} item(s) running low</h6>
          </div>
          <div className="p-3">
            <div className="row g-2">
              {lowStock.map(p => (
                <div key={p._id} className="col-md-3 col-sm-6">
                  <div className="d-flex align-items-center gap-2 p-2 rounded-2" style={{ background:'#fff8f0', border:'1px solid #ffe0b2' }}>
                    <i className="fas fa-mobile-alt text-warning" />
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:12, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize:11, color:'#888' }}>{p.brand}</div>
                    </div>
                    <span className={`badge ${p.stock === 0 ? 'bg-danger' : 'bg-warning text-dark'}`}>{p.stock === 0 ? 'Out' : p.stock}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="admin-table">
        <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
          <h6 className="mb-0" style={{ fontFamily:"'Rubik',sans-serif", fontWeight:600 }}>Recent Orders</h6>
          <Link to="/admin/orders" className="btn btn-sm btn-outline-primary">View All</Link>
        </div>
        <table className="table mb-0">
          <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            {(stats?.recentOrders || []).length === 0 ? (
              <tr><td colSpan="6" className="text-center text-muted py-4">No orders yet.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
