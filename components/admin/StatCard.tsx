interface Props { label:string; value:string|number; sub?:string; color?:string; icon?:string; }

export default function StatCard({ label, value, sub, color="#00e676", icon }: Props) {
  return (
    <div style={{ background:"#0b130b", border:"1px solid rgba(0,230,118,.1)", borderRadius:16,
      padding:"20px 24px", flex:1, minWidth:140 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
        <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", textTransform:"uppercase", letterSpacing:2 }}>{label}</span>
        {icon && <span style={{ fontSize:22, opacity:.5 }}>{icon}</span>}
      </div>
      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:32, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:"rgba(255,255,255,.3)", marginTop:4 }}>{sub}</div>}
    </div>
  );
}
