import { useState, useMemo } from "react";
import {
  ComposedChart, Area, Line, BarChart, Bar, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, PieChart, Pie, Legend
} from "recharts";

// ─── DONNÉES SCÉNARIO BASE (FR uniquement) ────────────────────────────────────
const BASE = [
  {m:"M1",  mo:1,  u:0,    mrr:0,      burn:500,   phase:1},
  {m:"M2",  mo:2,  u:0,    mrr:0,      burn:500,   phase:1},
  {m:"M3",  mo:3,  u:3,    mrr:0,      burn:500,   phase:1},
  {m:"M4",  mo:4,  u:8,    mrr:0,      burn:500,   phase:1},
  {m:"M5",  mo:5,  u:15,   mrr:345,    burn:3500,  phase:2},
  {m:"M6",  mo:6,  u:22,   mrr:506,    burn:3500,  phase:2},
  {m:"M7",  mo:7,  u:32,   mrr:736,    burn:3500,  phase:2},
  {m:"M8",  mo:8,  u:50,   mrr:1150,   burn:12000, phase:3},
  {m:"M9",  mo:9,  u:75,   mrr:1725,   burn:12000, phase:3},
  {m:"M10", mo:10, u:110,  mrr:2530,   burn:12000, phase:3},
  {m:"M11", mo:11, u:155,  mrr:3565,   burn:12000, phase:3},
  {m:"M12", mo:12, u:210,  mrr:5040,   burn:12000, phase:3},
  {m:"M13", mo:13, u:275,  mrr:6600,   burn:12000, phase:3},
  {m:"M14", mo:14, u:355,  mrr:8520,   burn:12000, phase:3},
  {m:"M15", mo:15, u:460,  mrr:11040,  burn:12000, phase:3},
  {m:"M16", mo:16, u:522,  mrr:12528,  burn:12000, phase:3, be:true, beLabel:"BE SCALE 1"},
  {m:"M17", mo:17, u:580,  mrr:14500,  burn:12000, phase:3},
  {m:"M18", mo:18, u:640,  mrr:16000,  burn:12000, phase:3},
  {m:"M19", mo:19, u:700,  mrr:17500,  burn:12000, phase:3},
  {m:"M20", mo:20, u:750,  mrr:19500,  burn:47000, phase:4, p4:true},
  {m:"M21", mo:21, u:900,  mrr:23400,  burn:47000, phase:4},
  {m:"M22", mo:22, u:1100, mrr:29700,  burn:47000, phase:4},
  {m:"M23", mo:23, u:1350, mrr:36450,  burn:47000, phase:4},
  {m:"M24", mo:24, u:1650, mrr:46200,  burn:47000, phase:4},
  {m:"M25", mo:25, u:1808, mrr:53036,  burn:47000, phase:4, be:true, beLabel:"BE BIG SCALE"},
  {m:"M26", mo:26, u:2050, mrr:59450,  burn:47000, phase:4},
  {m:"M27", mo:27, u:2300, mrr:66700,  burn:47000, phase:4},
  {m:"M28", mo:28, u:2550, mrr:76500,  burn:59125, phase:5},
  {m:"M29", mo:29, u:2750, mrr:85250,  burn:59125, phase:5},
  {m:"M30", mo:30, u:2950, mrr:91450,  burn:59125, phase:5},
  {m:"M31", mo:31, u:3100, mrr:96100,  burn:59125, phase:5},
  {m:"M32", mo:32, u:3200, mrr:99200,  burn:59125, phase:5},
  {m:"M33", mo:33, u:3300, mrr:102300, burn:59125, phase:5},
  {m:"M34", mo:34, u:3400, mrr:105400, burn:59125, phase:5},
  {m:"M35", mo:35, u:3550, mrr:110050, burn:59125, phase:5},
  {m:"M36", mo:36, u:3700, mrr:114700, burn:59125, phase:5},
];

// ─── SCÉNARIO OPTIMISTE : FR + EU + B2B ───────────────────────────────────────
const OPT = BASE.map(d => {
  const euU  = d.mo >= 18 ? Math.min(1200, Math.round((d.mo - 17) * 72)) : 0;
  const b2b  = d.mo >= 20 ? Math.min(150,  Math.round((d.mo - 19) * 9))  : 0;
  return {
    ...d,
    u:   d.u + euU + b2b,
    mrr: d.mrr + euU * 23 + b2b * 79,
    euU, b2b,
  };
});

// ─── DONNÉES CAC PAR CANAL (Phase 3) ─────────────────────────────────────────
const CAC_CHANNELS = [
  { canal:"Meta / Instagram", budget:2000, cac:50, users:40, color:"#4A9060" },
  { canal:"Google Search",    budget:500,  cac:60, users:8,  color:"#1A6FA0" },
  { canal:"Créateurs YT FR",  budget:1200, cac:60, users:20, color:"#9B7A1A" },
  { canal:"SEO + Blog",       budget:600,  cac:160,users:4,  color:"#5A8A6A" },
  { canal:"Parrainage",         budget:390,  cac:39, users:10, color:"#7A2A8F" },
  { canal:"Organique",        budget:200,  cac:50, users:5,  color:"#888888" },
];

// ─── BURN BREAKDOWN Phase 3 / Phase 4 ────────────────────────────────────────
const BURN_P3 = [
  { name:"Salaires (2 fond.)", value:6000,  color:"#1A6FA0" },
  { name:"Marketing",          value:4890,  color:"#4A9060" },
  { name:"Infrastructure",     value:152,   color:"#9B7A1A" },
  { name:"Outils équipe",      value:50,    color:"#5A5A5A" },
  { name:"Légal / Compta",     value:400,   color:"#7A2A8F" },
  { name:"Misc",               value:508,   color:"#888888" },
];

const BURN_P4 = [
  { name:"Salaires (5 pers.)",  value:24500, color:"#1A6FA0" },
  { name:"Marketing",           value:17000, color:"#4A9060" },
  { name:"Infrastructure",      value:598,   color:"#9B7A1A" },
  { name:"Outils équipe",       value:316,   color:"#5A5A5A" },
  { name:"Légal / Compta",      value:800,   color:"#7A2A8F" },
  { name:"Bureaux",             value:2000,  color:"#C0392B" },
  { name:"Misc",                value:1786,  color:"#888888" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmtE = n => {
  if (!n && n !== 0) return "-";
  const a = Math.abs(n);
  if (a >= 1000000) return `${(n/1000000).toFixed(2)}M€`;
  if (a >= 1000)    return `${Math.round(n/1000)}K€`;
  return `${n}€`;
};
const SHOW = new Set(["M1","M4","M8","M12","M16","M20","M24","M25","M28","M32","M36"]);
const xTick = m => SHOW.has(m) ? m : "";
const MONO = "'Courier New', Courier, monospace";
const G="#4A9060", R="#E8503A", BG="#0A0A0A", S1="#111111", BD="#1A1A1A",
      TX="#F5F0E8", MT="#666", AC="#1A6FA0", PU="#7A2A8F";

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label, data }) {
  if (!active || !payload?.length) return null;
  const d = data.find(x => x.m === label) || {};
  const arpu = d.u > 0 ? Math.round(d.mrr / d.u) : 0;
  return (
    <div style={{background:"#0D0D0D",border:`1px solid #2A2A2A`,padding:"10px 14px",fontFamily:MONO,fontSize:10,minWidth:180}}>
      <div style={{color:"#777",marginBottom:6,letterSpacing:"1px"}}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{color:p.color||TX,marginBottom:2}}>{p.name}: {fmtE(p.value)}</div>
      ))}
      {d.u > 0 && (
        <div style={{color:"#555",marginTop:5,borderTop:`1px solid #1A1A1A`,paddingTop:5}}>
          {d.u.toLocaleString("fr-FR")} users · ARPU {arpu}€
        </div>
      )}
    </div>
  );
}

// ─── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]       = useState(0);
  const [scenario, setScenario] = useState("base");

  const D = useMemo(() => {
    const raw = scenario === "opt" ? OPT : BASE;
    return raw.map(d => ({ ...d, profit: d.mrr - d.burn }));
  }, [scenario]);

  const POST = useMemo(() => {
    let cum = 0;
    return D.filter(d => d.mo >= 28).map(d => {
      cum += d.profit;
      return { ...d, cumProfit: cum };
    });
  }, [D]);

  // cumulative cash
  const cashData = useMemo(() => {
    let cum = 0;
    return D.map(d => {
      cum += d.profit;
      return { ...d, cash: cum };
    });
  }, [D]);

  const PHASE_AREAS = [
    {x1:"M1",  x2:"M4",  fill:"#52946A"},
    {x1:"M5",  x2:"M7",  fill:"#9B7A1A"},
    {x1:"M8",  x2:"M19", fill:"#1A6FA0"},
    {x1:"M20", x2:"M27", fill:"#7A2A8F"},
    {x1:"M28", x2:"M36", fill:"#52946A"},
  ];

  const TABS = ["MRR et Dépenses","Croissance","CAC & Canaux","Structure des Dépenses","Post-rentabilité"];
  const beM = scenario === "opt" ? "M16" : "M16";

  // KPI summary
  const lastD = D[D.length - 1];
  const maxCashBurn = Math.min(...cashData.map(d => d.cash));
  const arrM36 = lastD.mrr * 12;

  return (
    <div style={{background:BG,minHeight:"100vh",color:TX,fontFamily:"Georgia, serif",fontSize:14}}>

      {/* ── HEADER ── */}
      <div style={{padding:"24px 36px 16px",borderBottom:`1px solid ${BD}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:16}}>
          <div>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"4px",color:MT,marginBottom:6}}>
              180 DEGRÉS : SIMULATION RÉVISÉE · MODÈLE CORRIGÉ · M1→M36
            </div>
            <div style={{fontSize:20,letterSpacing:"-0.5px"}}>Projection financière : Dossier Investisseur</div>
            <div style={{fontSize:11,color:MT,marginTop:4}}>
              ARPU dual-tier 19/39€ (moy. 23-31€) · Churn net 3%→2.5% · FR seul M1-M18 puis EU
            </div>
          </div>
          {/* Scenario toggle */}
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontFamily:MONO,fontSize:9,color:MT,marginRight:4}}>SCÉNARIO</span>
            {[{k:"base",l:"BASE : FR"},{k:"opt",l:"OPTIMISTE : FR+EU+B2B"}].map(s => (
              <button key={s.k} onClick={() => setScenario(s.k)} style={{
                padding:"6px 14px",background:scenario===s.k?AC:"transparent",
                border:`1px solid ${scenario===s.k?AC:"#333"}`,color:scenario===s.k?"#fff":MT,
                cursor:"pointer",fontFamily:MONO,fontSize:9,letterSpacing:"1px",
              }}>{s.l}</button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap"}}>
          {[
            {l:"Seuil Scale 1",    v:"M16",         sub:"522 users · 12K burn",      c:AC},
            {l:"Seuil Grande Montée",  v:"M25",         sub:"1 808 users · 47K burn",    c:PU},
            {l:"Capital requis",v:fmtE(Math.abs(maxCashBurn)), sub:"max cash burn cumulé",c:R},
            {l:"ARR M36",       v:fmtE(arrM36),  sub:`${lastD.u.toLocaleString("fr-FR")} users`,c:G},
            {l:"LTV:CAC",       v:"14-18×",      sub:"LTV 975€ / CAC 67€",       c:G},
          ].map((k,i) => (
            <div key={i} style={{background:S1,border:`1px solid ${BD}`,borderTop:`2px solid ${k.c}`,padding:"10px 14px",minWidth:130}}>
              <div style={{fontFamily:MONO,fontSize:7,letterSpacing:"2px",color:k.c,marginBottom:4}}>{k.l.toUpperCase()}</div>
              <div style={{fontFamily:MONO,fontSize:18,color:TX,letterSpacing:"-0.5px"}}>{k.v}</div>
              <div style={{fontFamily:MONO,fontSize:9,color:MT,marginTop:2}}>{k.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${BD}`,overflowX:"auto"}}>
        {TABS.map((t,i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            padding:"11px 22px",background:"transparent",border:"none",whiteSpace:"nowrap",
            borderBottom:tab===i?`2px solid ${G}`:"2px solid transparent",
            color:tab===i?TX:MT,cursor:"pointer",fontFamily:MONO,fontSize:9,letterSpacing:"2px",
          }}>{t.toUpperCase()}</button>
        ))}
      </div>

      {/* ══════════════════════════════ TAB 0 : MRR & BURN */}
      {tab===0 && (
        <div style={{padding:"24px 36px"}}>
          <div style={{display:"flex",gap:16,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            {[
              {col:G,  label:"MRR mensuel"},
              {col:R,  label:"Dépenses mensuelles"},
              {col:AC, label:"Seuil de rentabilité Scale 1 (M16)"},
              {col:PU, label:"Seuil de rentabilité Big Scale (M25)"},
            ].map((l,i) => (
              <div key={i} style={{display:"flex",alignItems:"center",gap:6}}>
                <div style={{width:18,height:2,background:l.col}}/>
                <span style={{fontFamily:MONO,fontSize:9,color:MT}}>{l.label}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={D} margin={{top:4,right:8,bottom:0,left:62}}>
              <defs>
                <linearGradient id="gMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G} stopOpacity={0.35}/>
                  <stop offset="95%" stopColor={G} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              {PHASE_AREAS.map((p,i) => (
                <ReferenceArea key={i} x1={p.x1} x2={p.x2} fill={p.fill} fillOpacity={0.05}/>
              ))}
              <XAxis dataKey="m" tickFormatter={xTick}
                tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}}
                axisLine={{stroke:BD}} tickLine={false}/>
              <YAxis tickFormatter={v => fmtE(v)}
                tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}}
                axisLine={false} tickLine={false}/>
              <Tooltip content={<ChartTip data={D}/>}/>
              <ReferenceLine x="M16" stroke={AC} strokeWidth={1.5} strokeDasharray="4 2"
                label={{value:"BE P3→",fill:AC,fontSize:8,fontFamily:"Courier New",position:"insideTopRight"}}/>
              <ReferenceLine x="M25" stroke={PU} strokeWidth={1.5} strokeDasharray="4 2"
                label={{value:"BE P4→",fill:PU,fontSize:8,fontFamily:"Courier New",position:"insideTopRight"}}/>
              <Area type="monotone" dataKey="mrr" name="MRR"
                stroke={G} strokeWidth={2} fill="url(#gMRR)" dot={false}/>
              <Line type="stepAfter" dataKey="burn" name="Burn"
                stroke={R} strokeWidth={1.5} strokeDasharray="5 3" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>

          {/* Cash cumulé */}
          <div style={{marginTop:20}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10}}>
              TRÉSORERIE CUMULÉE : BESOIN EN CAPITAL
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <ComposedChart data={cashData} margin={{top:0,right:8,bottom:0,left:62}}>
                <defs>
                  <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={R} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={R} stopOpacity={0.02}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="m" tickFormatter={xTick}
                  tick={{fill:"#2A2A2A",fontSize:7,fontFamily:"Courier New"}}
                  axisLine={{stroke:BD}} tickLine={false}/>
                <YAxis tickFormatter={v => fmtE(v)}
                  tick={{fill:"#2A2A2A",fontSize:7,fontFamily:"Courier New"}}
                  axisLine={false} tickLine={false}/>
                <Tooltip
                  contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                  formatter={v => [fmtE(v),"Cash cumulé"]} labelStyle={{color:"#888"}}/>
                <ReferenceLine y={0} stroke="#333" strokeWidth={1}/>
                <Area type="monotone" dataKey="cash" name="Cash cumulé"
                  stroke={R} strokeWidth={1.5} fill="url(#gCash)" dot={false}/>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Phases */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",borderTop:`1px solid ${BD}`,marginTop:14}}>
            {[
              {l:"POOC",       p:"M1-M4",  n:"Validation · 500€/mois", c:"#52946A"},
              {l:"ALPHA MVP",  p:"M5-M7",  n:"32 payants · 3.5K/mois", c:"#9B7A1A"},
              {l:"SCALE 1",    p:"M8-M19", n:"BE M16 · 12K/mois",       c:AC},
              {l:"BIG SCALE",  p:"M20-M27",n:"EU launch · 47K/mois",   c:PU},
              {l:"POST-BE",    p:"M28-M36",n:"59K/mois · profitable",   c:"#4A9060"},
            ].map((x,i) => (
              <div key={i} style={{padding:"10px 12px",borderLeft:i>0?`1px solid ${BD}`:"none"}}>
                <div style={{fontFamily:MONO,fontSize:7,letterSpacing:"2px",color:x.c,marginBottom:2}}>{x.l}</div>
                <div style={{fontFamily:MONO,fontSize:9,color:"#444",marginBottom:2}}>{x.p}</div>
                <div style={{fontFamily:MONO,fontSize:9,color:"#555"}}>{x.n}</div>
              </div>
            ))}
          </div>

          {/* Comparaison vs modèle initial */}
          <div style={{marginTop:16,background:"#060808",border:`1px solid #122`,borderLeft:`3px solid ${AC}`,padding:"12px 16px"}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:AC,marginBottom:8}}>
              DELTA VS MODÈLE INITIAL
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[
                {l:"Burn Phase 3",  old:"32 300€",  new:"12 000€",  c:G, note:"-63%"},
                {l:"Burn Phase 4",  old:"116 280€", new:"47 000€",  c:G, note:"-60%"},
                {l:"Seuil P3",    old:"M18 (800u)",new:"M16 (522u)",c:G, note:"2 mois avant"},
                {l:"ARR M36",       old:"5.3M€",    new:fmtE(arrM36),c:"#888",note:"Plus réaliste"},
              ].map((d,i) => (
                <div key={i} style={{background:S1,border:`1px solid ${BD}`,padding:"8px 10px"}}>
                  <div style={{fontFamily:MONO,fontSize:7,color:AC,marginBottom:4}}>{d.l}</div>
                  <div style={{fontFamily:MONO,fontSize:9,color:"#444",textDecoration:"line-through"}}>{d.old}</div>
                  <div style={{fontFamily:MONO,fontSize:14,color:d.c,marginTop:2}}>{d.new}</div>
                  <div style={{fontFamily:MONO,fontSize:9,color:d.c,marginTop:2}}>{d.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ TAB 1 : CROISSANCE USERS */}
      {tab===1 && (
        <div style={{padding:"24px 36px"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:24}}>
            {[
              {l:"Premiers payants", v:"15",  sub:"M5 · 345€ MRR",              c:"#9B7A1A"},
              {l:"Seuil Scale 1",       v:"522", sub:"M16 · 12 528€ MRR",          c:AC},
              {l:"Seuil Grande Montée",     v:"1 808",sub:"M25 · 53 036€ MRR",         c:PU},
              {l:"Fin simulation",   v:lastD.u.toLocaleString("fr-FR"),
               sub:`M36 · ${fmtE(arrM36)} ARR`,c:G},
            ].map((k,i) => (
              <div key={i} style={{background:S1,border:`1px solid ${BD}`,borderLeft:`3px solid ${k.c}`,padding:"14px 16px"}}>
                <div style={{fontFamily:MONO,fontSize:7,letterSpacing:"2px",color:k.c,marginBottom:4}}>{k.l.toUpperCase()}</div>
                <div style={{fontFamily:MONO,fontSize:26,color:TX,letterSpacing:"-1px"}}>{k.v}</div>
                <div style={{fontFamily:MONO,fontSize:9,color:MT,marginTop:3}}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10}}>
            CROISSANCE UTILISATEURS NETS : M1→M36
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={D} margin={{top:4,right:8,bottom:0,left:62}}>
              <defs>
                <linearGradient id="gUser" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AC} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={AC} stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              {PHASE_AREAS.map((p,i) => (
                <ReferenceArea key={i} x1={p.x1} x2={p.x2} fill={p.fill} fillOpacity={0.05}/>
              ))}
              <XAxis dataKey="m" tickFormatter={xTick}
                tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}}
                axisLine={{stroke:BD}} tickLine={false}/>
              <YAxis tickFormatter={v => v>=1000?`${(v/1000).toFixed(1)}K`:v}
                tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}}
                axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                formatter={v => [v.toLocaleString("fr-FR"),"Utilisateurs"]}
                labelStyle={{color:"#888"}}/>
              <ReferenceLine x="M16" stroke={AC} strokeDasharray="4 2"
                label={{value:"522",fill:AC,fontSize:8,fontFamily:"Courier New"}}/>
              <ReferenceLine x="M25" stroke={PU} strokeDasharray="4 2"
                label={{value:"1 808",fill:PU,fontSize:8,fontFamily:"Courier New"}}/>
              <Area type="monotone" dataKey="u" name="Users"
                stroke={AC} strokeWidth={2} fill="url(#gUser)" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>

          {/* Hypothèses */}
          <div style={{marginTop:22}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10}}>
              HYPOTHÈSES DE CROISSANCE CORRIGÉES
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {[
                {l:"ARPU Phase 2",    v:"23€",        note:"Early adopters · un seul tier"},
                {l:"ARPU Phase 3",    v:"23-25€",     note:"Mix 80% Solo 19€ / 20% Pro 39€"},
                {l:"ARPU Phase 4",    v:"26-31€",     note:"Mix 70% Solo / 30% Pro progressif"},
                {l:"Attrition nette",       v:"3%/mois P3 → 2.5% P4+", note:"Communauté Discord réduit le churn"},
                {l:"Growth Phase 3",  v:"15-40% MoM", note:"M8: +56% · M16: +13% · ralentit logiquement"},
                {l:"Growth Phase 4",  v:"10-20% MoM", note:"Pleine équipe Growth + EU launch"},
                {l:"Growth Phase 5",  v:"5-8% MoM",   note:"Régime stable, base > 2 500 users"},
                {l:"Marché FR cap",   v:"3 200 users", note:"32% du SAM FR de 10 000 vidéastes qualifiés"},
                {l:"Expansion EU",    v:"M18+",        note:"+1 200 users EU à M36 (scénario optimiste)"},
              ].map((h,i) => (
                <div key={i} style={{background:S1,border:`1px solid ${BD}`,padding:"8px 12px",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontFamily:MONO,fontSize:8,color:PU,marginBottom:2}}>{h.l.toUpperCase()}</div>
                    <div style={{fontSize:11,color:MT}}>{h.note}</div>
                  </div>
                  <div style={{fontFamily:MONO,fontSize:12,color:TX,flexShrink:0,marginLeft:10}}>{h.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ TAB 2 : CAC & CANAUX */}
      {tab===2 && (
        <div style={{padding:"24px 36px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            {/* Chart CAC */}
            <div>
              <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:12}}>
                CAC PAR CANAL : PHASE 3
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={CAC_CHANNELS} layout="vertical" margin={{top:0,right:30,bottom:0,left:10}}>
                  <XAxis type="number" tickFormatter={v => `${v}€`}
                    tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="canal" width={130}
                    tick={{fill:"#555",fontSize:9,fontFamily:"Courier New"}} axisLine={false} tickLine={false}/>
                  <Tooltip
                    contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                    formatter={v => [`${v}€`,"CAC"]} labelStyle={{color:"#888"}}/>
                  <ReferenceLine x={67} stroke={G} strokeDasharray="3 2"
                    label={{value:"Blendé 67€",fill:G,fontSize:8,fontFamily:"Courier New",position:"top"}}/>
                  <Bar dataKey="cac" name="CAC" radius={[0,3,3,0]}>
                    {CAC_CHANNELS.map((c,i) => <Cell key={i} fill={c.color} fillOpacity={0.8}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Users/mois */}
            <div>
              <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:12}}>
                USERS/MOIS PAR CANAL : PHASE 3 MATURE
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={CAC_CHANNELS} layout="vertical" margin={{top:0,right:30,bottom:0,left:10}}>
                  <XAxis type="number"
                    tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="canal" width={130}
                    tick={{fill:"#555",fontSize:9,fontFamily:"Courier New"}} axisLine={false} tickLine={false}/>
                  <Tooltip
                    contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                    formatter={v => [v,"Users/mois"]} labelStyle={{color:"#888"}}/>
                  <Bar dataKey="users" name="Users/mois" radius={[0,3,3,0]}>
                    {CAC_CHANNELS.map((c,i) => <Cell key={i} fill={c.color} fillOpacity={0.8}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tableau détaillé CAC */}
          <div style={{marginTop:24}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10}}>
              DÉTAIL MÉCANIQUE DE CONVERSION PAR CANAL
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
              {[
                {canal:"Meta / Instagram Ads", budget:"2 000€/mois",
                 steps:["CPM: 9€","CTR: 0.9% → CPC: 1€","LP conv.: 9% → 222 trials","Conversion essai-payant: 22% → 49 clients","CAC: 2 000 / 49 = 40.8€"], c:G},
                {canal:"Partenariats créateurs YT", budget:"1 200€/mois",
                 steps:["1 intégration par mois","50K vues · 40% audience ciblée","2% CTR → 400 visites LP","10% trial → 40 trials","22% paid → 9 clients · CAC 133€ + brand value"], c:"#9B7A1A"},
                {canal:"Programme de parrainage", budget:"~390€/mois",
                 steps:["1 mois offert = 23€ coût/parrainage","Viral coeff cible: 0.18","Base 500 users → 9 parrainages/mois","CAC: 23€ (juste le mois offert)","Réel coût: 0 → LTV augmentée"], c:PU},
                {canal:"Google Search Ads", budget:"500€/mois",
                 steps:["CPC: 1.80€ (intent fort)","277 clics/mois","LP conv.: 12% → 33 trials","25% paid → 8 clients","CAC: 500 / 8 = 62.5€"], c:AC},
                {canal:"SEO + Blog", budget:"600€/mois",
                 steps:["2 articles/mois · 6 mois pour trafic","M14: 600 visites organiques/mois","5% trial → 30 trials","25% paid → 7.5 clients/mois","CAC long terme: ~80€ (s'amortit sur 3 ans)"], c:"#5A8A6A"},
                {canal:"LTV:CAC synthèse", budget:"",
                 steps:["LTV = 975€ (ARPU 29€ / attrition 3%)","CAC pondéré: 67€","LTV:CAC = 14.6×","Délai de récupération: 3.1 mois","ROI exceptionnel pour un SaaS niche"], c:G},
              ].map((d,i) => (
                <div key={i} style={{background:S1,border:`1px solid ${BD}`,borderLeft:`3px solid ${d.c}`,padding:"12px 14px"}}>
                  <div style={{fontFamily:MONO,fontSize:8,color:d.c,marginBottom:4,letterSpacing:"1px"}}>{d.canal.toUpperCase()}</div>
                  {d.budget && <div style={{fontFamily:MONO,fontSize:9,color:G,marginBottom:6}}>{d.budget}</div>}
                  {d.steps.map((s,j) => (
                    <div key={j} style={{fontFamily:MONO,fontSize:9,color:j===d.steps.length-1?"#CCC":MT,marginBottom:2}}>
                      {j < d.steps.length-1 ? `→ ${s}` : `✓ ${s}`}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ TAB 3 : BURN STRUCTURE */}
      {tab===3 && (
        <div style={{padding:"24px 36px"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
            {/* Phase 3 */}
            <div>
              <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:12}}>
                STRUCTURE BURN PHASE 3 : 12 000€/MOIS
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={BURN_P3} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={85} label={({name,percent}) => percent>0.05?`${(percent*100).toFixed(0)}%`:""}>
                    {BURN_P3.map((d,i) => <Cell key={i} fill={d.color} fillOpacity={0.85}/>)}
                  </Pie>
                  <Tooltip
                    contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                    formatter={v => [fmtE(v)]}/>
                  <Legend iconType="square" iconSize={8}
                    formatter={v => <span style={{fontFamily:MONO,fontSize:9,color:MT}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8}}>
                {BURN_P3.map((d,i) => (
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 10px",background:S1,border:`1px solid ${BD}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,background:d.color,borderRadius:1}}/>
                      <span style={{fontFamily:MONO,fontSize:9,color:MT}}>{d.name}</span>
                    </div>
                    <span style={{fontFamily:MONO,fontSize:10,color:TX}}>{fmtE(d.value)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:"#0A1A0A",border:`1px solid ${G}`}}>
                  <span style={{fontFamily:MONO,fontSize:10,color:G,fontWeight:"bold"}}>TOTAL PHASE 3</span>
                  <span style={{fontFamily:MONO,fontSize:10,color:G,fontWeight:"bold"}}>12 000€/mois</span>
                </div>
              </div>
            </div>

            {/* Phase 4 */}
            <div>
              <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:12}}>
                STRUCTURE BURN PHASE 4 : 47 000€/MOIS
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={BURN_P4} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius={85} label={({name,percent}) => percent>0.05?`${(percent*100).toFixed(0)}%`:""}>
                    {BURN_P4.map((d,i) => <Cell key={i} fill={d.color} fillOpacity={0.85}/>)}
                  </Pie>
                  <Tooltip
                    contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                    formatter={v => [fmtE(v)]}/>
                  <Legend iconType="square" iconSize={8}
                    formatter={v => <span style={{fontFamily:MONO,fontSize:9,color:MT}}>{v}</span>}/>
                </PieChart>
              </ResponsiveContainer>
              <div style={{display:"flex",flexDirection:"column",gap:4,marginTop:8}}>
                {BURN_P4.map((d,i) => (
                  <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"5px 10px",background:S1,border:`1px solid ${BD}`}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:8,height:8,background:d.color,borderRadius:1}}/>
                      <span style={{fontFamily:MONO,fontSize:9,color:MT}}>{d.name}</span>
                    </div>
                    <span style={{fontFamily:MONO,fontSize:10,color:TX}}>{fmtE(d.value)}</span>
                  </div>
                ))}
                <div style={{display:"flex",justifyContent:"space-between",padding:"6px 10px",background:"#0A1A0A",border:`1px solid ${G}`}}>
                  <span style={{fontFamily:MONO,fontSize:10,color:G,fontWeight:"bold"}}>TOTAL PHASE 4</span>
                  <span style={{fontFamily:MONO,fontSize:10,color:G,fontWeight:"bold"}}>47 000€/mois</span>
                </div>
              </div>
            </div>
          </div>

          {/* Équipe Phase 4 */}
          <div style={{marginTop:24}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10}}>
              ÉQUIPE PHASE 4 : DÉTAIL POSTES
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
              {[
                {p:"CEO / Fondateur 1",    s:"5 500€",  r:"Vision, BD, investors, strategy"},
                {p:"CTO / Fondateur 2",    s:"5 500€",  r:"Product, tech, architecture"},
                {p:"Dev Full-Stack",       s:"5 500€",  r:"Features, EU localization, API"},
                {p:"Head of Growth",       s:"5 000€",  r:"Acquisition, experiments, analytics"},
                {p:"Content & Community",  s:"3 000€",  r:"Discord, Reels, blog, digest"},
              ].map((e,i) => (
                <div key={i} style={{background:S1,border:`1px solid ${BD}`,borderTop:`2px solid ${AC}`,padding:"10px 12px"}}>
                  <div style={{fontFamily:MONO,fontSize:8,color:AC,marginBottom:4,letterSpacing:"1px"}}>{e.p.toUpperCase()}</div>
                  <div style={{fontFamily:MONO,fontSize:18,color:TX,marginBottom:4}}>{e.s}</div>
                  <div style={{fontFamily:MONO,fontSize:9,color:MT}}>{e.r}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ TAB 4 : POST-RENTABILITÉ */}
      {tab===4 && (
        <div style={{padding:"24px 36px"}}>
          <div style={{background:"#060E06",border:`1px solid #162416`,borderLeft:`3px solid ${G}`,padding:"14px 18px",marginBottom:22}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:G,marginBottom:8}}>
              BREAK-EVEN PHASE 4 ATTEINT EN M25
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16}}>
              {[
                {l:"Mois",         v:"M25",      sub:"5 mois après launch P4"},
                {l:"Utilisateurs", v:"1 808",    sub:"attrition 3%/mois"},
                {l:"MRR",          v:"53 036€",  sub:"> burn 47 000€"},
                {l:"Marge nette",  v:"+11.5%",   sub:"6 036€ profit/mois"},
              ].map((k,i) => (
                <div key={i}>
                  <div style={{fontFamily:MONO,fontSize:7,color:G,marginBottom:3}}>{k.l.toUpperCase()}</div>
                  <div style={{fontFamily:MONO,fontSize:18,color:TX,letterSpacing:"-0.5px"}}>{k.v}</div>
                  <div style={{fontFamily:MONO,fontSize:9,color:MT}}>{k.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10}}>
            PROFIT MENSUEL : M28→M36
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={POST} margin={{top:4,right:8,bottom:0,left:62}}>
              <XAxis dataKey="m"
                tick={{fill:"#3A3A3A",fontSize:9,fontFamily:"Courier New"}} axisLine={{stroke:BD}} tickLine={false}/>
              <YAxis tickFormatter={v => fmtE(v)}
                tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                formatter={v => [fmtE(v),"Profit mensuel"]} labelStyle={{color:"#888"}}/>
              <Bar dataKey="profit" name="Profit mensuel" fill={G} fillOpacity={0.8} radius={[2,2,0,0]}/>
            </BarChart>
          </ResponsiveContainer>

          <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10,marginTop:20}}>
            PROFIT CUMULATIF POST-RENTABILITÉ
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <ComposedChart data={POST} margin={{top:4,right:8,bottom:0,left:62}}>
              <defs>
                <linearGradient id="gProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={G} stopOpacity={0.5}/>
                  <stop offset="95%" stopColor={G} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="m"
                tick={{fill:"#3A3A3A",fontSize:9,fontFamily:"Courier New"}} axisLine={{stroke:BD}} tickLine={false}/>
              <YAxis tickFormatter={v => fmtE(v)}
                tick={{fill:"#3A3A3A",fontSize:8,fontFamily:"Courier New"}} axisLine={false} tickLine={false}/>
              <Tooltip
                contentStyle={{background:"#0D0D0D",border:`1px solid #2A2A2A`,fontFamily:MONO,fontSize:10,color:TX}}
                formatter={v => [fmtE(v),"Profit cumulatif"]} labelStyle={{color:"#888"}}/>
              <Area type="monotone" dataKey="cumProfit" name="Profit cumulatif"
                stroke={G} strokeWidth={2} fill="url(#gProfit)" dot={false}/>
            </ComposedChart>
          </ResponsiveContainer>

          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginTop:20}}>
            {[
              {l:"Profit M28→M36 cumulé", v:fmtE(POST[POST.length-1]?.cumProfit||0), c:G, sub:"9 mois post-rentabilité"},
              {l:"MRR final M36",         v:fmtE(lastD.mrr), c:G, sub:`${lastD.u.toLocaleString("fr-FR")} users`},
              {l:"ARR annualisé M36",     v:fmtE(arrM36),   c:G, sub:"Base case FR seul"},
              {l:"Marge nette M36",       v:`${Math.round((lastD.profit/lastD.mrr)*100)}%`, c:G, sub:`${fmtE(lastD.profit)}/mois`},
            ].map((k,i) => (
              <div key={i} style={{background:S1,border:`1px solid ${BD}`,borderTop:`2px solid ${k.c}`,padding:"12px 14px"}}>
                <div style={{fontFamily:MONO,fontSize:7,letterSpacing:"2px",color:k.c,marginBottom:4}}>{k.l.toUpperCase()}</div>
                <div style={{fontFamily:MONO,fontSize:22,color:TX,letterSpacing:"-1px"}}>{k.v}</div>
                <div style={{fontFamily:MONO,fontSize:9,color:MT,marginTop:3}}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Milestones */}
          <div style={{marginTop:20}}>
            <div style={{fontFamily:MONO,fontSize:9,letterSpacing:"3px",color:MT,marginBottom:10}}>MILESTONES</div>
            <div style={{display:"flex",flexDirection:"column",gap:5}}>
              {[
                {m:"M5",  l:"Premiers revenus",            v:"345€ MRR · 15 users",            c:"#9B7A1A"},
                {m:"M16", l:"Seuil de rentabilité Phase 3 ✓",       v:"12 528€ MRR · 522 users",        c:AC},
                {m:"M18", l:"Test EU Beta",                v:"Lancement EN/DE · 500€ ads EU",  c:"#888"},
                {m:"M20", l:"Démarrage Phase 4 ⚡",       v:"Burn ×3.9 · +3 personnes",        c:PU},
                {m:"M25", l:"Seuil de rentabilité Phase 4 ✓",       v:"53 036€ MRR · 1 808 users",      c:G},
                {m:"M30", l:"ARR > 1M€ franchi",          v:"90 000€ MRR · 3 000 users",      c:G},
                {m:"M36", l:"Fin simulation ★",            v:`${fmtE(arrM36)} ARR · ${lastD.u.toLocaleString("fr-FR")} users`, c:G},
              ].map((ms,i) => (
                <div key={i} style={{display:"flex",alignItems:"center",gap:14,padding:"7px 12px",background:S1,border:`1px solid ${BD}`}}>
                  <div style={{fontFamily:MONO,fontSize:11,color:ms.c,minWidth:32}}>{ms.m}</div>
                  <div style={{flex:1,fontSize:12}}>{ms.l}</div>
                  <div style={{fontFamily:MONO,fontSize:10,color:MT}}>{ms.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div style={{borderTop:`1px solid #111`,padding:"10px 36px",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:6,background:"#030303"}}>
        {[
          "ARPU dual-tier : 0.80×19€ + 0.20×39€ = 23€ Phase 3 → 0.70×19€ + 0.30×39€ = 25€ Phase 5",
          "Attrition 3%/mois implicite dans net growth · Améliore à 2.5% avec Discord communauté",
          "CAC pondéré 67€ · LTV:CAC 14.6× · Délai de récupération 3.1 mois · Marché FR cap 3 200 users",
        ].map((t,i) => (
          <div key={i} style={{fontFamily:MONO,fontSize:8,color:"#2A2A2A"}}>{t}</div>
        ))}
      </div>
    </div>
  );
}
