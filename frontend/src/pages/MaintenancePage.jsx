import { useSettings } from '../context/SettingsContext';

export default function MaintenancePage() {
  const settings = useSettings();
  const msg = settings.maintenance_message || "We're performing maintenance. We'll be back shortly!";
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'#003859', color:'#fff', fontFamily:"'Raleway',sans-serif" }}>
      <div style={{ textAlign:'center', padding:40, maxWidth:500 }}>
        <div style={{ fontSize:60, marginBottom:20 }}>🔧</div>
        <h1 style={{ fontFamily:"'Rubik',sans-serif", fontSize:28, marginBottom:12 }}>Under Maintenance</h1>
        <p style={{ fontSize:16, opacity:0.8, lineHeight:1.6 }}>{msg}</p>
        <p style={{ fontSize:13, marginTop:20, opacity:0.6 }}>Isa Moh Mobile Shop · Merkato, Addis Ababa</p>
      </div>
    </div>
  );
}
