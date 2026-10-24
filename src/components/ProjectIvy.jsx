'use client';
import{useState,useEffect,useRef}from"react";
import{Home,Building2,DollarSign,MessageSquare,Users,LogOut,Plus,Bell,Search,Eye,TrendingUp,FileText,BarChart2,Wallet,CreditCard,Key,Shield,MapPin,Bed,Bath,Car,Star,ChevronRight,Download,Clock,Check,AlertTriangle,Wrench,Send,X,ArrowLeft,Upload,CheckCircle,AlertCircle,Zap,RefreshCw,Layers,Leaf,Activity,Camera,Sun,Moon,Menu}from"lucide-react";
import{AreaChart,Area,BarChart,Bar,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from"recharts";
import*as THREE from"three";
import dynamic from"next/dynamic";

// Real .glb virtual-tour viewer (React Three Fiber + drei). Client-only
// since Canvas/WebGL can't render during SSR. Falls back to the
// procedural mock Viewer3D below if this fails to load (e.g. demo mode
// without the three-fiber deps installed).
const GlbViewerLazy=dynamic(()=>import("@/components/three/GlbViewer").catch(()=>null),{ssr:false});

export const THEME_LIGHT={forest:'#4CAF50',forestLight:'#66BB6A',sage:'#3F8B2C',sageLight:'#8BC77A',mint:'#E8F5E1',cream:'#F6F7F9',warmWhite:'#FBFBFC',cardBg:'#FFFFFF',charcoal:'#16181A',charcoalLight:'#3F4650',gray:'#667085',grayLight:'#98A2B3',border:'#E4E7EC',gold:'#F03E3E',white:'#FFFFFF',red:'#DC2626',amber:'#D97706',emerald:'#16A34A',blue:'#2563EB'};
export const THEME_DARK={forest:'#5FCB63',forestLight:'#7FDB82',sage:'#6BBF52',sageLight:'#8BC77A',mint:'#1C2B1F',cream:'#16191D',warmWhite:'#0D0F12',cardBg:'#1B1F24',charcoal:'#EDEFF2',charcoalLight:'#C4C9D0',gray:'#9098A5',grayLight:'#6B7280',border:'#2A2F36',gold:'#FF5C5C',white:'#FFFFFF',red:'#F87171',amber:'#FBBF24',emerald:'#4ADE80',blue:'#60A5FA'};
export const CHROME={bg:'#14171A',bgLight:'#1D2125',text:'#FFFFFF',textMuted:'rgba(255,255,255,0.6)',border:'rgba(255,255,255,0.08)',accent:'#8BC77A'};
export const C={...THEME_LIGHT};
export function applyTheme(name){ Object.assign(C, name==='dark'?THEME_DARK:THEME_LIGHT); }

const USERS_DB=[
  {id:'u1',username:'mark',password:'12345',name:'Mark Muga',role:'super_agent',mustChangePW:true,initials:'MM',email:'mark@ivy.co.ke'},
  {id:'u2',username:'ivy',password:'pm2024',name:'Ivy Jepkosgei',role:'project_manager',mustChangePW:false,initials:'IJ',email:'ivy.j@ivy.co.ke'},
  {id:'u3',username:'zion',password:'ll2024',name:'Zion Carl',role:'landlord',mustChangePW:false,initials:'ZC',email:'zion@ivy.co.ke'},
  {id:'u4',username:'matthew',password:'mt2024',name:'Matthew Gatheca',role:'maintenance',mustChangePW:false,initials:'MG',email:'matthew@ivy.co.ke'},
  {id:'u5',username:'teresia',password:'cl2024',name:'Teresia Wanjiru',role:'client',mustChangePW:false,initials:'TW',email:'teresia@ivy.co.ke'},
];

const INIT_PROPS=[
  {id:'p1',name:'Westlands Luxury Apartments',address:'Westlands, Nairobi',type:'apartment',status:'occupied',landlord_id:'u3',rent:85000,rating:4.8,details:{bedrooms:3,bathrooms:2,utilities_included:['Water','Security'],security_deposit:85000,parking:true},desc:'Premium 3-bed in the heart of Westlands. Open-plan living, floor-to-ceiling windows, private balcony with city views.'},
  {id:'p2',name:'Kilimani Studio',address:'Kilimani, Nairobi',type:'apartment',status:'available',landlord_id:'u3',rent:45000,rating:4.2,details:{bedrooms:1,bathrooms:1,utilities_included:['Water','Internet'],security_deposit:45000,parking:false},desc:'Modern studio ideal for young professionals. High-speed internet included, rooftop terrace access.'},
  {id:'p3',name:'Karen Student Village',address:'Karen, Nairobi',type:'student_housing',status:'occupied',landlord_id:'u3',rent:15000,rating:4.5,details:{beds_per_room:2,price_per_bed:15000,shared_amenities:['WiFi','Laundry','Kitchen'],gender_designation:'mixed',term_length_months:6},desc:'Affordable student housing near Karen Business Park. Fully furnished rooms, shared kitchen and study areas.'},
  {id:'p4',name:'Upper Hill Commercial Suite',address:'Upper Hill, Nairobi',type:'commercial',status:'available',landlord_id:'u3',rent:180000,rating:4.7,details:{floor_area_sqm:250,parking_ratio:'1:50',cam_split_percent:15,zoning_permissions:['Office','Retail','Light Industrial']},desc:'Premium Grade A commercial space. Column-free floor plates, raised access flooring, 24/7 management.'},
  {id:'p5',name:'Lavington Land — 0.5 Acres',address:'Lavington, Nairobi',type:'land',status:'available',landlord_id:'u3',rent:12500000,rating:4.9,details:{acreage:0.5,title_deed_status:'Freehold Title',gis_coordinates:{lat:-1.2859,lng:36.7694},zoning_use:'Residential Development'},desc:'Prime half-acre in prestigious Lavington. All utilities at boundary, ready for immediate development.'},
  {id:'p6',name:'Kileleshwa Airbnb Villa',address:'Kileleshwa, Nairobi',type:'airbnb',status:'available',landlord_id:'u3',rent:8500,rating:4.9,details:{per_night_rate:8500,cleaning_fee:1500,max_guests:6,min_stay:2},desc:'Stunning 4-bed villa with private pool. Perfect for corporate retreats and family gatherings.'},
  {id:'p7',name:'Nyari Estate House',address:'Nyari, Nairobi',type:'apartment',status:'pending',landlord_id:'u3',rent:120000,rating:4.6,details:{bedrooms:4,bathrooms:3,utilities_included:['Water','Security','Garbage'],security_deposit:240000,parking:true},desc:'Spacious 4-bed in secure gated community. Garden, staff quarters, double garage.'},
  {id:'p8',name:'Runda Executive Villa',address:'Runda, Nairobi',type:'apartment',status:'occupied',landlord_id:'u3',rent:200000,rating:5.0,details:{bedrooms:5,bathrooms:4,utilities_included:['Water','Electricity','Security','Internet'],security_deposit:400000,parking:true},desc:'Ultra-premium 5-bed. Private heated pool, home cinema, staff quarters, borehole.'},
];

const INIT_LEASES=[
  {id:'l1',client_id:'u5',property_id:'p1',start_date:'2026-01-01',end_date:'2026-12-31',rent_amount:85000,status:'active',balance:-5000},
];

const INIT_LEDGER=[
  {id:'tx1',date:'2026-06-01',type:'payment',amount:85000,desc:'June Rent — Westlands Luxury Apartments',system_cut:500,landlord_share:84500,tier:3,uid:'u5'},
  {id:'tx2',date:'2026-05-01',type:'payment',amount:90000,desc:'May Rent + Overpayment (Credit: KSh 5,000)',system_cut:500,landlord_share:89500,tier:3,uid:'u5'},
  {id:'tx3',date:'2026-04-01',type:'payment',amount:85000,desc:'April Rent — Westlands Luxury Apartments',system_cut:500,landlord_share:84500,tier:3,uid:'u5'},
  {id:'tx4',date:'2026-03-01',type:'payment',amount:85000,desc:'March Rent — Westlands Luxury Apartments',system_cut:500,landlord_share:84500,tier:3,uid:'u5'},
  {id:'tx5',date:'2026-02-01',type:'payment',amount:85000,desc:'February Rent — Westlands Luxury Apartments',system_cut:500,landlord_share:84500,tier:3,uid:'u5'},
  {id:'tx6',date:'2026-01-15',type:'withdrawal',amount:420000,desc:'Landlord Withdrawal — Zion Carl (Tier 3: 3% fee)',system_cut:12600,landlord_share:407400,tier:3,uid:'u3'},
  {id:'tx7',date:'2026-01-05',type:'payment',amount:85000,desc:'January Rent — Westlands Luxury Apartments',system_cut:500,landlord_share:84500,tier:3,uid:'u5'},
];

const INIT_TICKETS=[
  {id:'tk1',title:'Leaking Kitchen Sink',property:'Westlands Luxury Apartments',unit:'Unit 3B',client:'Teresia Wanjiru',priority:'high',status:'in_progress',created:'2026-06-03',assigned_to:'u4',description:'Kitchen sink dripping for 3 days. Water pooling under the cabinet.'},
  {id:'tk2',title:'AC Not Cooling',property:'Runda Executive Villa',unit:'Main House',client:'Dennis Mwangi',priority:'medium',status:'open',created:'2026-06-04',assigned_to:null,description:'Central AC stopped cooling. Temperature uncomfortably high.'},
  {id:'tk3',title:'Broken Gate Motor',property:'Karen Student Village',unit:'Main Gate',client:'Management',priority:'high',status:'open',created:'2026-06-05',assigned_to:null,description:'Automatic gate motor burned out. Gate stuck open — security risk.'},
  {id:'tk4',title:'Intercom System Fault',property:'Kilimani Studio',unit:'Block A',client:'Wanjiru Maina',priority:'low',status:'resolved',created:'2026-05-28',assigned_to:'u4',description:'Intercom not working for units A4-A8.'},
  {id:'tk5',title:'Burst Water Pipe',property:'Nyari Estate House',unit:'Servants Quarters',client:'Margaret Oloo',priority:'critical',status:'open',created:'2026-06-05',assigned_to:null,description:'Water pipe burst — flooding the back yard. Immediate action required.'},
];

const INIT_MSGS={
  maintenance:[
    {id:'m1',sender:'Teresia Wanjiru',content:'The kitchen sink is leaking again. Can someone come fix it today?',time:'09:23 AM',sent:false,av:'TW'},
    {id:'m2',sender:'Matthew Gatheca',content:"Hi Amina — I've got your request. I'll be there 10–11 AM. Please ensure the unit is accessible.",time:'09:31 AM',sent:true,av:'MG'},
    {id:'m3',sender:'Teresia Wanjiru',content:"Great, I'll be home. Thank you!",time:'09:35 AM',sent:false,av:'TW'},
  ],
  security:[
    {id:'s1',sender:'Teresia Wanjiru',content:"There's been an unfamiliar car parked in front of my unit for 2 days.",time:'11:00 AM',sent:false,av:'TW'},
    {id:'s2',sender:'Ivy Jepkosgei',content:"Thank you for reporting. We've alerted the security team who are now investigating.",time:'11:15 AM',sent:true,av:'IJ'},
  ],
  billing:[
    {id:'b1',sender:'Teresia Wanjiru',content:"I paid KSh 90,000 last month instead of 85,000. Can you confirm the KSh 5,000 credit?",time:'02:45 PM',sent:false,av:'TW'},
    {id:'b2',sender:'Ivy Jepkosgei',content:"Confirmed! Your account shows a credit of KSh 5,000 — it auto-applies to your next rent cycle.",time:'02:52 PM',sent:true,av:'IJ'},
    {id:'b3',sender:'Teresia Wanjiru',content:"Perfect, thank you for confirming!",time:'02:54 PM',sent:false,av:'TW'},
  ],
};

const REV_DATA=[
  {month:'Jan',revenue:468000},{month:'Feb',revenue:495000},{month:'Mar',revenue:445000},
  {month:'Apr',revenue:510000},{month:'May',revenue:538000},{month:'Jun',revenue:555000},
];

export const fmtKSh=n=>`KSh ${Number(n).toLocaleString()}`;
export const getTier=a=>a<=50000?1:a<=200000?2:3;
export const calcSplit=a=>{const t=getTier(a),c={1:20,2:50,3:500};return{tier:t,systemCut:c[t],landlordShare:a-c[t]};};
export const calcWD=a=>{const t=getTier(a),r={1:0.02,2:0.025,3:0.03},fee=Math.round(a*r[t]);return{tier:t,fee,net:a-fee,rate:r[t]*100};};

export const RCFG={super_agent:{label:'Super Agent',color:C.gold,bg:'#FEF3C7'},system_agent:{label:'System Agent',color:'#7C3AED',bg:'#EDE9FE'},project_manager:{label:'Project Manager',color:C.blue,bg:'#DBEAFE'},landlord:{label:'Landlord',color:C.sage,bg:'#D1FAE5'},maintenance:{label:'Maintenance',color:C.amber,bg:'#FEF3C7'},client:{label:'Client',color:C.charcoalLight,bg:'#F3F4F6'}};
export const SCFG={available:{label:'Available',color:C.emerald,bg:'#D1FAE5'},occupied:{label:'Occupied',color:C.sage,bg:'#CCFBF1'},pending:{label:'Pending',color:C.amber,bg:'#FEF3C7'},open:{label:'Open',color:C.red,bg:'#FEE2E2'},in_progress:{label:'In Progress',color:C.amber,bg:'#FEF3C7'},resolved:{label:'Resolved',color:C.emerald,bg:'#D1FAE5'}};
export const PGRAD={apartment:'linear-gradient(135deg,#63BC46,#7FCB63)',student_housing:'linear-gradient(135deg,#4F9636,#A3D98C)',commercial:'linear-gradient(135deg,#0A0A0A,#374151)',land:'linear-gradient(135deg,#4F9636,#FF3131)',airbnb:'linear-gradient(135deg,#A3D98C,#E8F5E1)'};
export const TLBL={apartment:'Apartment',student_housing:'Student Housing',commercial:'Commercial',land:'Land & Development',airbnb:'Airbnb'};
const NAV={
  super_agent:[{icon:BarChart2,label:'Overview',s:'dashboard'},{icon:Building2,label:'All Properties',s:'properties'},{icon:FileText,label:'Approvals',s:'approvals'},{icon:Users,label:'User Management',s:'users'},{icon:DollarSign,label:'System Ledger',s:'ledger'},{icon:Download,label:'Withdrawals',s:'withdrawals'},{icon:Activity,label:'Activity Logs',s:'logs'},{icon:Shield,label:'System Info',s:'system-info'}],
  system_agent:[{icon:BarChart2,label:'Overview',s:'dashboard'},{icon:Building2,label:'Properties',s:'properties'},{icon:FileText,label:'Approvals',s:'approvals'},{icon:Wrench,label:'Tickets',s:'tickets'},{icon:Activity,label:'Activity Logs',s:'logs'}],
  project_manager:[{icon:BarChart2,label:'Overview',s:'dashboard'},{icon:Building2,label:'Portfolio',s:'properties'},{icon:FileText,label:'Approvals',s:'approvals'},{icon:Wrench,label:'Tickets',s:'tickets'},{icon:MessageSquare,label:'Messages',s:'chat'}],
  landlord:[{icon:BarChart2,label:'Overview',s:'dashboard'},{icon:Building2,label:'My Properties',s:'properties'},{icon:Plus,label:'New Listing',s:'listing-builder'},{icon:DollarSign,label:'Revenue & Ledger',s:'ledger'},{icon:Download,label:'Withdrawals',s:'withdrawals'},{icon:Users,label:'My Team',s:'my-team'}],
  maintenance:[{icon:Wrench,label:'My Tickets',s:'tickets'},{icon:Check,label:'Completed',s:'tickets'},{icon:Clock,label:'Schedule',s:'tickets'}],
  client:[{icon:Home,label:'Browse Properties',s:'properties'},{icon:FileText,label:'My Lease',s:'lease'},{icon:DollarSign,label:'Payments',s:'ledger'},{icon:MessageSquare,label:'Support Chat',s:'chat'}],
};

export function Badge({text,color=C.gray,bg='#F3F4F6'}){return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,fontSize:11,fontWeight:600,color,background:bg,whiteSpace:'nowrap'}}>{text}</span>;}
export function Av({initials,size=36,color=C.forest}){return <div style={{width:size,height:size,borderRadius:'50%',background:color+'18',color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.35,fontWeight:700,flexShrink:0,border:`2px solid ${color}30`}}>{initials}</div>;}
export function MCard({icon:Ic,label,value,trend,color=C.forest,sub}){
  return <div style={{background:C.cardBg,borderRadius:16,padding:'20px 24px',boxShadow:'0 2px 12px rgba(27,67,50,0.06)',border:`1px solid ${C.border}`,flex:1,minWidth:180}}>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:14}}>
      <div style={{width:42,height:42,borderRadius:12,background:color+'15',display:'flex',alignItems:'center',justifyContent:'center',color}}>{Ic&&<Ic size={19}/>}</div>
      {trend!==undefined&&<span style={{fontSize:12,color:trend>=0?C.emerald:C.red,fontWeight:600}}>{trend>=0?'↑':'↓'}{Math.abs(trend)}%</span>}
    </div>
    <div style={{fontSize:26,fontWeight:700,color:C.charcoal,lineHeight:1,marginBottom:4}}>{value}</div>
    <div style={{fontSize:13,color:C.gray}}>{label}</div>
    {sub&&<div style={{fontSize:11,color:C.grayLight,marginTop:4}}>{sub}</div>}
  </div>;
}
export function SHdr({title,action,lbl,icon:Ic}){
  return <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
    <h2 style={{fontSize:18,fontWeight:700,color:C.charcoal,margin:0,display:'flex',alignItems:'center',gap:8}}>{Ic&&<Ic size={18} color={C.forest}/>}{title}</h2>
    {action&&<button onClick={action} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:C.forest,color:C.white,border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}><Plus size={14}/>{lbl}</button>}
  </div>;
}
export function Fld({label,type='text',value,onChange,placeholder,req,hint,rows}){
  const s={width:'100%',padding:'10px 14px',border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:14,color:C.charcoal,background:C.cardBg,boxSizing:'border-box',fontFamily:'inherit',outline:'none'};
  return <div style={{marginBottom:16}}>
    {label&&<label style={{display:'block',fontSize:13,fontWeight:600,color:C.charcoalLight,marginBottom:6}}>{label}{req&&<span style={{color:C.red}}> *</span>}</label>}
    {rows?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{...s,resize:'vertical'}}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={s}/>}
    {hint&&<p style={{fontSize:11,color:C.gray,margin:'4px 0 0'}}>{hint}</p>}
  </div>;
}
export function Drp({label,value,onChange,opts,req=false}){
  return <div style={{marginBottom:16}}>
    {label&&<label style={{display:'block',fontSize:13,fontWeight:600,color:C.charcoalLight,marginBottom:6}}>{label}{req&&<span style={{color:C.red}}> *</span>}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)} style={{width:'100%',padding:'10px 14px',border:`1.5px solid ${C.border}`,borderRadius:10,fontSize:14,color:C.charcoal,background:C.cardBg,cursor:'pointer',boxSizing:'border-box',outline:'none'}}>
      {opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  </div>;
}
function Viewer3D(){
  const ref=useRef(null);
  useEffect(()=>{
    const m=ref.current;if(!m)return;
    const w=m.clientWidth||640,h=380;
    const renderer=new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(w,h);renderer.setClearColor(0xF0ECE6,1);renderer.shadowMap.enabled=true;
    m.appendChild(renderer.domElement);
    const scene=new THREE.Scene();
    const cam=new THREE.PerspectiveCamera(42,w/h,0.1,200);
    cam.position.set(10,7,14);cam.lookAt(0,2,0);
    scene.add(new THREE.AmbientLight(0xffffff,0.8));
    const sun=new THREE.DirectionalLight(0xFFF5E0,1.4);sun.position.set(15,25,10);sun.castShadow=true;scene.add(sun);
    const fill=new THREE.DirectionalLight(0xD4E8FF,0.4);fill.position.set(-10,5,-5);scene.add(fill);
    const gnd=new THREE.Mesh(new THREE.PlaneGeometry(40,40),new THREE.MeshLambertMaterial({color:0x7DB87D}));
    gnd.rotation.x=-Math.PI/2;gnd.receiveShadow=true;scene.add(gnd);
    const path=new THREE.Mesh(new THREE.PlaneGeometry(3.5,10),new THREE.MeshLambertMaterial({color:0xC8B89A}));
    path.rotation.x=-Math.PI/2;path.position.set(0,0.01,7);scene.add(path);
    const bld=new THREE.Group();
    const bMat=new THREE.MeshLambertMaterial({color:0xFAF5EE});
    const body=new THREE.Mesh(new THREE.BoxGeometry(5,6,4),bMat);body.position.y=3;body.castShadow=true;bld.add(body);
    const rMat=new THREE.MeshLambertMaterial({color:0x1B4332});
    const roof=new THREE.Mesh(new THREE.CylinderGeometry(0,3.8,2,4),rMat);roof.position.y=7;roof.rotation.y=Math.PI/4;bld.add(roof);
    const wMat=new THREE.MeshLambertMaterial({color:0xF0EAE0});
    [-3.5,3.5].forEach(x=>{
      const wg=new THREE.Mesh(new THREE.BoxGeometry(2.5,4,3.5),wMat);wg.position.set(x,2,0);wg.castShadow=true;bld.add(wg);
      const wr=new THREE.Mesh(new THREE.CylinderGeometry(0,2,1.5,4),rMat);wr.position.set(x,4.75,0);wr.rotation.y=Math.PI/4;bld.add(wr);
    });
    const glMat=new THREE.MeshLambertMaterial({color:0x9BC8D8,emissive:0x1B4332,emissiveIntensity:0.1});
    const frMat=new THREE.MeshLambertMaterial({color:0xFAF5EE});
    for(let r=0;r<3;r++){[-1.5,0,1.5].forEach(c=>{
      const fr=new THREE.Mesh(new THREE.BoxGeometry(1.0,1.1,0.08),frMat);fr.position.set(c,1.3+r*1.8,2.04);bld.add(fr);
      const gl=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.9,0.06),glMat);gl.position.set(c,1.3+r*1.8,2.06);bld.add(gl);
    });}
    const dMat=new THREE.MeshLambertMaterial({color:0x2D6A4F});
    const door=new THREE.Mesh(new THREE.BoxGeometry(1.1,1.8,0.1),dMat);door.position.set(0,0.9,2.04);bld.add(door);
    const hMat=new THREE.MeshLambertMaterial({color:0xC9A84C});
    const dh=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),hMat);dh.position.set(0.4,0.9,2.1);bld.add(dh);
    [-0.8,0.8].forEach(x=>{const pl=new THREE.Mesh(new THREE.CylinderGeometry(0.12,0.12,2.5,8),frMat);pl.position.set(x,1.25,2.2);bld.add(pl);});
    const rail=new THREE.Mesh(new THREE.BoxGeometry(3.5,0.08,0.08),hMat);rail.position.set(0,2.55,2.25);bld.add(rail);
    scene.add(bld);
    const tM=new THREE.MeshLambertMaterial({color:0x2D6A4F}),tM2=new THREE.MeshLambertMaterial({color:0x1B4332}),trM=new THREE.MeshLambertMaterial({color:0x7A5C2E});
    [[-5,4],[-7,2],[5,-4],[7,-2],[-6,-4],[6,5],[-4,-6],[4,6]].forEach(([x,z],i)=>{
      const h=1.5+Math.sin(i)*0.4;
      const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.2,h,6),trM);tr.position.set(x,h/2,z);scene.add(tr);
      const tp=new THREE.Mesh(new THREE.SphereGeometry(0.9+Math.cos(i)*0.2,8,7),i%2===0?tM:tM2);tp.position.set(x,h+0.6,z);scene.add(tp);
    });
    let drag=false,px=0,auto=true,rt;
    const down=e=>{drag=true;px=e.clientX;clearTimeout(rt);auto=false;};
    const move=e=>{if(!drag)return;bld.rotation.y+=(e.clientX-px)*0.012;px=e.clientX;};
    const up=()=>{drag=false;rt=setTimeout(()=>{auto=true;},2500);};
    renderer.domElement.addEventListener('mousedown',down);
    window.addEventListener('mousemove',move);window.addEventListener('mouseup',up);
    let aid;
    const loop=()=>{aid=requestAnimationFrame(loop);if(auto)bld.rotation.y+=0.003;renderer.render(scene,cam);};
    loop();
    return()=>{cancelAnimationFrame(aid);clearTimeout(rt);renderer.domElement.removeEventListener('mousedown',down);window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);renderer.dispose();if(m.contains(renderer.domElement))m.removeChild(renderer.domElement);};
  },[]);
  return <div style={{position:'relative'}}><div ref={ref} style={{width:'100%',height:380,borderRadius:12,overflow:'hidden',cursor:'grab',background:'#F0ECE6'}}/><div style={{position:'absolute',bottom:12,left:12,background:'rgba(27,67,50,0.8)',color:C.white,fontSize:11,padding:'6px 12px',borderRadius:20}}>🖱 Drag to rotate · Auto-rotates</div></div>;
}

function Landing({onEnter}){
  const [hov,setHov]=useState(null);
  const feats=[
    {icon:Building2,title:'Smart Listing Builder',desc:'5 property types with dynamic form fields. Upload photos and 3D GLB virtual tour files for immersive walkthroughs.',color:C.forest},
    {icon:DollarSign,title:'Tiered Financial Engine',desc:'Automated revenue splits, Paystack webhook integration, overpayment credits, and real-time ledger updates.',color:C.gold},
    {icon:MessageSquare,title:'Unified Operations Chat',desc:'Context-specific streams for Maintenance, Security & Billing — routed to the right team instantly.',color:C.sage},
    {icon:Shield,title:'Role-Based Access Control',desc:'5 roles: Super Agent, Project Manager, Landlord, Maintenance, Client. Strict RLS policies per Supabase.',color:C.blue},
    {icon:Activity,title:'Real-Time Ledger',desc:'Supabase Realtime updates — balances refresh instantly after every payment or transaction.',color:C.amber},
    {icon:Eye,title:'3D Virtual Tours',desc:'React Three Fiber viewer lets prospective tenants take interactive 3D walkthroughs of properties.',color:C.sageLight},
  ];
  return <div style={{minHeight:'100vh',background:C.warmWhite,fontFamily:"var(--font-outfit), sans-serif",overflowX:'hidden'}}>
    <nav style={{position:'fixed',top:0,left:0,right:0,zIndex:100,background:'rgba(255,253,249,0.92)',backdropFilter:'blur(16px)',borderBottom:`1px solid ${C.border}`,padding:'0 40px',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:36,height:36,background:C.forest,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center'}}><Leaf size={18} color={C.white}/></div>
        <span style={{fontSize:22,fontWeight:800,color:C.forest,letterSpacing:'-0.5px'}}>IVY</span>
        <span style={{fontSize:12,color:C.gray,letterSpacing:'0.1em',textTransform:'uppercase',marginTop:2}}>Property</span>
      </div>
      <button onClick={onEnter} style={{padding:'10px 28px',background:C.forest,color:C.white,border:'none',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer'}}>Enter Platform →</button>
    </nav>
    <div style={{minHeight:'100vh',background:`linear-gradient(160deg,${C.forest} 0%,#7FCB63 45%,#4F9636 100%)`,display:'flex',alignItems:'center',justifyContent:'center',padding:'100px 40px 80px',position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:600,height:600,borderRadius:'50%',background:'rgba(149,213,178,0.06)',top:-200,right:-100}}/>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'rgba(149,213,178,0.04)',bottom:-100,left:-50}}/>
      <div style={{maxWidth:740,textAlign:'center',position:'relative',zIndex:2}}>
        <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 18px',background:'rgba(255,255,255,0.1)',borderRadius:30,marginBottom:32,border:'1px solid rgba(255,255,255,0.15)'}}>
          <div style={{width:6,height:6,borderRadius:'50%',background:C.mint}}/>
          <span style={{fontSize:13,color:'rgba(255,255,255,0.85)',fontWeight:500}}>Enterprise Real Estate Management Platform</span>
        </div>
        <h1 style={{fontSize:'clamp(36px,5vw,66px)',fontWeight:800,color:C.white,lineHeight:1.1,margin:'0 0 24px',letterSpacing:'-1px'}}>
          Where Premium<br/><span style={{color:C.mint}}>Real Estate</span> Meets<br/>Effortless Management
        </h1>
        <p style={{fontSize:18,color:'rgba(255,255,255,0.75)',lineHeight:1.7,margin:'0 auto 40px',maxWidth:540}}>
          All-in-one platform for landlords, tenants, and managers. Streamline listings, automate finances, communicate in real time.
        </p>
        <div style={{display:'flex',gap:14,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={onEnter} style={{padding:'16px 40px',background:C.cardBg,color:C.forest,border:'none',borderRadius:14,fontSize:16,fontWeight:700,cursor:'pointer',boxShadow:'0 8px 32px rgba(0,0,0,0.15)'}}>Get Started — Free</button>
          <button style={{padding:'16px 32px',background:'rgba(255,255,255,0.12)',color:C.white,border:'1.5px solid rgba(255,255,255,0.3)',borderRadius:14,fontSize:16,fontWeight:600,cursor:'pointer'}}>Watch Demo ▶</button>
        </div>
      </div>
    </div>
    <div style={{background:C.charcoal,padding:'32px 40px',display:'flex',justifyContent:'center',gap:80,flexWrap:'wrap'}}>
      {[['847+','Active Properties'],['KSh 2.8B','Managed Annually'],['99.2%','Payment Success Rate'],['5 Roles','Unified Platform']].map(([v,l])=>(
        <div key={l} style={{textAlign:'center'}}><div style={{fontSize:30,fontWeight:800,color:C.mint,marginBottom:4}}>{v}</div><div style={{fontSize:13,color:'rgba(255,255,255,0.5)'}}>{l}</div></div>
      ))}
    </div>
    <div style={{padding:'80px 40px',maxWidth:1200,margin:'0 auto'}}>
      <div style={{textAlign:'center',marginBottom:56}}>
        <h2 style={{fontSize:40,fontWeight:800,color:C.charcoal,margin:'0 0 16px',letterSpacing:'-0.5px'}}>Everything in one platform</h2>
        <p style={{fontSize:17,color:C.gray,maxWidth:500,margin:'0 auto'}}>From dynamic listings to automated financials and real-time operations.</p>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',gap:24}}>
        {feats.map((f,i)=>(
          <div key={i} onMouseEnter={()=>setHov(i)} onMouseLeave={()=>setHov(null)}
            style={{background:C.cardBg,borderRadius:20,padding:32,border:`1px solid ${C.border}`,transition:'all 0.3s',transform:hov===i?'translateY(-4px)':'none',boxShadow:hov===i?'0 12px 40px rgba(27,67,50,0.10)':'0 2px 8px rgba(27,67,50,0.04)'}}>
            <div style={{width:52,height:52,borderRadius:14,background:f.color+'15',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:20,color:f.color}}><f.icon size={24}/></div>
            <h3 style={{fontSize:18,fontWeight:700,color:C.charcoal,margin:'0 0 10px'}}>{f.title}</h3>
            <p style={{fontSize:14,color:C.gray,lineHeight:1.7,margin:0}}>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
    <div style={{padding:'80px 40px',background:`linear-gradient(135deg,${C.forest},${C.sage})`,textAlign:'center'}}>
      <h2 style={{fontSize:40,fontWeight:800,color:C.white,margin:'0 0 16px'}}>Ready to manage smarter?</h2>
      <p style={{fontSize:17,color:'rgba(255,255,255,0.75)',marginBottom:36}}>Explore all features with demo accounts — no sign-up needed.</p>
      <button onClick={onEnter} style={{padding:'18px 56px',background:C.cardBg,color:C.forest,border:'none',borderRadius:16,fontSize:17,fontWeight:700,cursor:'pointer',boxShadow:'0 8px 40px rgba(0,0,0,0.15)'}}>Enter Platform →</button>
      <p style={{marginTop:16,fontSize:13,color:'rgba(255,255,255,0.5)'}}>Admin: mark/12345 · Manager: sarah/pm2024 · Landlord: james/ll2024 · Client: amina/cl2024</p>
    </div>
  </div>;
}

function Login({onLogin,onBack}){
  const [u,setU]=useState('');const [pw,setPw]=useState('');const [err,setErr]=useState('');const [loading,setLoading]=useState(false);
  const go=()=>{setErr('');setLoading(true);setTimeout(()=>{const usr=USERS_DB.find(x=>x.username===u&&x.password===pw);if(usr){onLogin(usr);}else{setErr('Invalid credentials. Try: mark / 12345');}setLoading(false);},600);};
  return <div style={{minHeight:'100vh',display:'flex',fontFamily:"var(--font-outfit), sans-serif"}}>
    <div style={{flex:1,background:`linear-gradient(160deg,${C.forest},#4F9636)`,display:'flex',flexDirection:'column',justifyContent:'center',padding:60,position:'relative',overflow:'hidden'}}>
      <div style={{position:'absolute',width:400,height:400,borderRadius:'50%',background:'rgba(149,213,178,0.06)',top:-100,right:-100}}/>
      <div style={{position:'relative',zIndex:2}}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:56}}>
          <div style={{width:44,height:44,background:'rgba(255,255,255,0.15)',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center'}}><Leaf size={22} color={C.white}/></div>
          <span style={{fontSize:26,fontWeight:800,color:C.white,letterSpacing:'-0.5px'}}>IVY</span>
        </div>
        <h2 style={{fontSize:36,fontWeight:800,color:C.white,lineHeight:1.2,margin:'0 0 16px'}}>Premium Real Estate,<br/>Managed Effortlessly.</h2>
        <p style={{fontSize:16,color:'rgba(255,255,255,0.7)',lineHeight:1.7,maxWidth:360,marginBottom:48}}>Unified platform for landlords, managers, maintenance, and clients.</p>
        <p style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginBottom:12,letterSpacing:'0.05em',textTransform:'uppercase'}}>Demo Accounts — Click to Fill</p>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {USERS_DB.map(usr=>(
            <button key={usr.id} onClick={()=>{setU(usr.username);setPw(usr.password);}} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 16px',background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.12)',borderRadius:10,cursor:'pointer',color:C.white,textAlign:'left'}}>
              <Av initials={usr.initials} size={32} color={C.white}/>
              <div><div style={{fontSize:13,fontWeight:600}}>{usr.name}</div><div style={{fontSize:11,color:'rgba(255,255,255,0.5)'}}>{RCFG[usr.role].label} · {usr.username}/{usr.password}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
    <div style={{width:480,display:'flex',flexDirection:'column',justifyContent:'center',padding:60,background:C.warmWhite}}>
      <button onClick={onBack} style={{display:'flex',alignItems:'center',gap:6,fontSize:13,color:C.gray,background:'none',border:'none',cursor:'pointer',marginBottom:40,padding:0}}><ArrowLeft size={14}/>Back to home</button>
      <h2 style={{fontSize:30,fontWeight:800,color:C.charcoal,margin:'0 0 8px'}}>Welcome back</h2>
      <p style={{fontSize:14,color:C.gray,margin:'0 0 32px'}}>Sign in to your IVY account</p>
      <Fld label="Username" value={u} onChange={setU} placeholder="e.g. mark" req/>
      <Fld label="Password" type="password" value={pw} onChange={setPw} placeholder="••••••••" req/>
      {err&&<div style={{background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:10,padding:'12px 16px',marginBottom:16,display:'flex',alignItems:'center',gap:8,color:C.red,fontSize:13}}><AlertCircle size={16}/>{err}</div>}
      <button onClick={go} disabled={loading||!u||!pw} style={{width:'100%',padding:14,background:!u||!pw?C.grayLight:C.forest,color:C.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:!u||!pw?'not-allowed':'pointer',marginTop:4}}>
        {loading?'Signing in…':'Sign In →'}
      </button>
      <div style={{marginTop:24,padding:16,background:C.cream,borderRadius:12,border:`1px solid ${C.border}`}}>
        <p style={{fontSize:12,color:C.gray,margin:0,lineHeight:1.7}}><strong>Super Agent:</strong> mark/12345 <em>(prompts password change)</em><br/><strong>Manager:</strong> sarah/pm2024 &nbsp;<strong>Landlord:</strong> james/ll2024<br/><strong>Maintenance:</strong> peter/mt2024 &nbsp;<strong>Client:</strong> amina/cl2024</p>
      </div>
    </div>
  </div>;
}

function ChangePW({user,onDone}){
  const [np,setNp]=useState('');const [cp,setCp]=useState('');
  const reqs=[{l:'At least 8 characters',ok:np.length>=8},{l:'Contains a number',ok:/\d/.test(np)},{l:'Contains a letter',ok:/[a-zA-Z]/.test(np)},{l:'Passwords match',ok:!!np&&np===cp}];
  const all=reqs.every(r=>r.ok);
  return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${C.forest},${C.sage})`,fontFamily:"var(--font-outfit), sans-serif",padding:20}}>
    <div style={{background:C.cardBg,borderRadius:24,padding:'48px 44px',width:'100%',maxWidth:480,boxShadow:'0 32px 80px rgba(0,0,0,0.15)'}}>
      <div style={{width:56,height:56,background:'#FEF3C7',borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:24}}><Key size={26} color={C.gold}/></div>
      <h2 style={{fontSize:26,fontWeight:800,color:C.charcoal,margin:'0 0 8px'}}>Set a new password</h2>
      <p style={{fontSize:14,color:C.gray,margin:'0 0 12px',lineHeight:1.6}}>Welcome, <strong>{user.name}</strong>! As Super Agent, you must change the default password before accessing the platform.</p>
      <div style={{background:'#FEF3C7',border:'1px solid #FCD34D',borderRadius:10,padding:'10px 14px',marginBottom:24,display:'flex',gap:8,alignItems:'flex-start'}}>
        <AlertTriangle size={16} color={C.gold} style={{marginTop:1,flexShrink:0}}/>
        <span style={{fontSize:12,color:'#92400E',lineHeight:1.5}}>Your current password <strong>"12345"</strong> is a temporary seed credential and must be changed.</span>
      </div>
      <Fld label="New Password" type="password" value={np} onChange={setNp} placeholder="Create a strong password" req/>
      <Fld label="Confirm Password" type="password" value={cp} onChange={setCp} placeholder="Repeat your new password" req/>
      <div style={{marginBottom:24}}>
        {reqs.map(r=><div key={r.l} style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{width:18,height:18,borderRadius:'50%',background:r.ok?'#D1FAE5':'#F3F4F6',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{r.ok?<Check size={10} color={C.emerald}/>:<X size={10} color={C.grayLight}/>}</div>
          <span style={{fontSize:13,color:r.ok?C.emerald:C.gray}}>{r.l}</span>
        </div>)}
      </div>
      <button onClick={()=>all&&onDone(np)} disabled={!all} style={{width:'100%',padding:14,background:all?C.forest:C.grayLight,color:C.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:all?'pointer':'not-allowed'}}>
        Set Password & Enter Platform
      </button>
    </div>
  </div>;
}

export function Sidebar({user,active,setScreen,onLogout,col,setCol}){
  const items=NAV[user.role]||[];
  return <div style={{width:col?72:240,background:CHROME.bg,display:'flex',flexDirection:'column',height:'100vh',position:'fixed',top:0,left:0,zIndex:200,transition:'width 0.25s cubic-bezier(0.4,0,0.2,1)',overflow:'hidden'}}>
    <div style={{padding:col?'20px 0':'24px 20px',display:'flex',alignItems:'center',gap:10,borderBottom:'1px solid rgba(255,255,255,0.08)',justifyContent:col?'center':'flex-start'}}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={col?"/ivy-icon-mark.png":"/ivy-logo-dark.png"} alt="Project Ivy by Infoma" style={{height:col?32:40,width:'auto',flexShrink:0}}/>
    </div>
    {!col&&<div style={{padding:'18px 20px',borderBottom:'1px solid rgba(255,255,255,0.08)'}}>
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <Av initials={user.initials} size={38} color={C.white}/>
        <div style={{minWidth:0}}><div style={{fontSize:14,fontWeight:700,color:C.white,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{user.name}</div><div style={{fontSize:11,color:CHROME.accent,fontWeight:500}}>{RCFG[user.role].label}</div></div>
      </div>
    </div>}
    <nav style={{flex:1,padding:'12px 0',overflowY:'auto',overflowX:'hidden'}}>
      {items.map(item=>{const on=active===item.s;return(
        <button key={item.label} onClick={()=>setScreen(item.s)}
          style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:col?'11px 0':'11px 20px',justifyContent:col?'center':'flex-start',background:on?'rgba(139,199,122,0.12)':'transparent',border:'none',borderLeft:`3px solid ${on?CHROME.accent:'transparent'}`,color:on?CHROME.accent:'rgba(255,255,255,0.65)',cursor:'pointer',transition:'all 0.2s',fontSize:14,fontWeight:on?600:400,whiteSpace:'nowrap'}}>
          <item.icon size={18}/>{!col&&item.label}
        </button>
      );})}
    </nav>
    <div style={{borderTop:'1px solid rgba(255,255,255,0.08)',padding:'12px 0'}}>
      <button onClick={()=>setCol(!col)} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:col?'10px 0':'10px 20px',justifyContent:col?'center':'flex-start',background:'transparent',border:'none',color:'rgba(255,255,255,0.4)',cursor:'pointer',fontSize:13,whiteSpace:'nowrap'}}>
        {col?<ChevronRight size={17}/>:<><ArrowLeft size={17}/>Collapse</>}
      </button>
      <button onClick={onLogout} style={{width:'100%',display:'flex',alignItems:'center',gap:12,padding:col?'10px 0':'10px 20px',justifyContent:col?'center':'flex-start',background:'transparent',border:'none',color:'rgba(255,255,255,0.55)',cursor:'pointer',fontSize:14,whiteSpace:'nowrap'}}>
        <LogOut size={17}/>{!col&&'Sign Out'}
      </button>
    </div>
  </div>;
}

export function TopBar({title,user,setScreen,dark,onToggleTheme,onMenu}){
  return <div style={{height:64,background:C.cardBg,borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',padding:onMenu?'0 14px':'0 28px',position:'sticky',top:0,zIndex:50}}>
    <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>{onMenu&&<button onClick={onMenu} aria-label="Open menu" style={{width:38,height:38,flexShrink:0,background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.charcoal}}><Menu size={18}/></button>}<h1 style={{fontSize:onMenu?17:20,fontWeight:700,color:C.charcoal,margin:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</h1></div>
    <div style={{display:'flex',alignItems:'center',gap:onMenu?8:12,flexShrink:0}}>
      {onToggleTheme&&<button onClick={onToggleTheme} title={dark?"Switch to light mode":"Switch to dark mode"} style={{width:38,height:38,background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.gray}}>
        {dark?<Sun size={17}/>:<Moon size={17}/>}
      </button>}
      <button onClick={()=>setScreen('dashboard')} title="Home" style={{width:38,height:38,background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.gray}}>
        <Home size={17}/>
      </button>
      <button onClick={()=>setScreen('chat')} style={{position:'relative',width:38,height:38,background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:C.gray}}>
        <Bell size={17}/><div style={{position:'absolute',top:6,right:6,width:8,height:8,background:C.red,borderRadius:'50%',border:'2px solid white'}}/>
      </button>
      <button onClick={()=>setScreen('profile')} title="My Profile" style={{background:'none',border:'none',padding:0,cursor:'pointer',borderRadius:'50%',lineHeight:0}}>
        <Av initials={user.initials} size={36} color={C.forest}/>
      </button>
    </div>
  </div>;
}
export function SADash({user,properties,leases,ledger,users,setScreen}){
  const sys=ledger.reduce((s,t)=>s+t.system_cut,0);
  const vol=ledger.filter(t=>t.type==='payment').reduce((s,t)=>s+t.amount,0);
  return <div>
    <div style={{background:`linear-gradient(135deg,${C.forest},${C.forestLight})`,borderRadius:20,padding:'28px 32px',marginBottom:28,color:C.white}}>
      <div style={{fontSize:12,color:C.mint,fontWeight:600,marginBottom:4,letterSpacing:'0.08em',textTransform:'uppercase'}}>IVY System Revenue — Total Platform Cuts</div>
      <div style={{fontSize:40,fontWeight:800,marginBottom:4}}>{fmtKSh(sys)}</div>
      <div style={{display:'flex',gap:32,marginTop:16}}>
        {[[properties.length,'Properties'],[leases.filter(l=>l.status==='active').length,'Active Leases'],[users.length,'Users']].map(([v,l])=>(
          <div key={l}><div style={{fontSize:24,fontWeight:700}}>{v}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>{l}</div></div>
        ))}
      </div>
    </div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:28}}>
      <MCard icon={DollarSign} label="Total Platform Volume" value={fmtKSh(vol)} trend={12} color={C.forest}/>
      <MCard icon={Building2} label="Active Properties" value={properties.filter(p=>p.status!=='pending').length} trend={5} color={C.sage}/>
      <MCard icon={TrendingUp} label="This Month" value={fmtKSh(555000)} trend={8} color={C.gold}/>
      <MCard icon={Download} label="Pending Withdrawals" value="2" color={C.amber}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24}}>
      <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SHdr title="Monthly Revenue" icon={BarChart2}/>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={REV_DATA}>
            <defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.forest} stopOpacity={0.15}/><stop offset="95%" stopColor={C.forest} stopOpacity={0}/></linearGradient></defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="month" tick={{fontSize:12,fill:C.gray}}/>
            <YAxis tick={{fontSize:12,fill:C.gray}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
            <Tooltip formatter={v=>fmtKSh(v)} contentStyle={{borderRadius:10,border:'none',boxShadow:'0 4px 20px rgba(0,0,0,0.1)'}}/>
            <Area type="monotone" dataKey="revenue" stroke={C.forest} strokeWidth={2.5} fill="url(#rv)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SHdr title="Recent Transactions" icon={Activity}/>
        {ledger.slice(0,5).map(tx=>(
          <div key={tx.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:34,height:34,borderRadius:10,background:tx.type==='payment'?'#D1FAE5':'#DBEAFE',display:'flex',alignItems:'center',justifyContent:'center'}}>
              {tx.type==='payment'?<DollarSign size={15} color={C.emerald}/>:<Download size={15} color={C.blue}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,color:C.charcoal,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.desc}</div>
              <div style={{fontSize:11,color:C.gray}}>{tx.date}</div>
            </div>
            <div style={{fontSize:12,fontWeight:700,color:tx.type==='payment'?C.emerald:C.blue,whiteSpace:'nowrap'}}>+{fmtKSh(tx.system_cut)}</div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

export function PMDash({properties,leases,tickets,setScreen}){
  const open=tickets.filter(t=>t.status==='open'||t.status==='in_progress');
  return <div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:28}}>
      <MCard icon={Building2} label="Total Properties" value={properties.length} trend={3} color={C.forest}/>
      <MCard icon={FileText} label="Active Leases" value={leases.filter(l=>l.status==='active').length} color={C.sage}/>
      <MCard icon={AlertTriangle} label="Open Tickets" value={open.length} color={C.amber}/>
      <MCard icon={Check} label="Pending Approvals" value="3" color={C.blue}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24}}>
      <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SHdr title="Portfolio Overview" icon={Building2} action={()=>setScreen('properties')} lbl="View All"/>
        {properties.slice(0,6).map(p=>(
          <div key={p.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{width:40,height:40,borderRadius:10,background:PGRAD[p.type],display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Building2 size={16} color={C.white}/></div>
            <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:C.charcoal,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name}</div><div style={{fontSize:11,color:C.gray}}>{p.address}</div></div>
            <Badge text={SCFG[p.status]?.label||p.status} color={SCFG[p.status]?.color} bg={SCFG[p.status]?.bg}/>
            <div style={{fontSize:13,fontWeight:700,color:C.forest,whiteSpace:'nowrap'}}>{fmtKSh(p.rent)}</div>
          </div>
        ))}
      </div>
      <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SHdr title="Urgent Tickets" icon={Wrench} action={()=>setScreen('tickets')} lbl="All"/>
        {open.slice(0,4).map(t=>(
          <div key={t.id} style={{padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
            <div style={{fontSize:13,fontWeight:600,color:C.charcoal}}>{t.title}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:4}}>
              <span style={{fontSize:11,color:C.gray,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:120}}>{t.property}</span>
              <Badge text={t.priority} color={t.priority==='critical'?C.red:t.priority==='high'?C.amber:C.gray} bg={t.priority==='critical'?'#FEE2E2':t.priority==='high'?'#FEF3C7':'#F3F4F6'}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

export function LLDash({user,properties,ledger,setScreen}){
  const myP=properties.filter(p=>p.landlord_id===user.id);
  const inc=ledger.filter(t=>t.type==='payment').reduce((s,t)=>s+t.landlord_share,0);
  return <div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:28}}>
      <MCard icon={Building2} label="My Properties" value={myP.length} color={C.forest} trend={0}/>
      <MCard icon={DollarSign} label="Total Net Income" value={fmtKSh(inc)} trend={8} color={C.sage}/>
      <MCard icon={Check} label="Occupied" value={myP.filter(p=>p.status==='occupied').length} color={C.emerald}/>
      <MCard icon={Clock} label="Available" value={myP.filter(p=>p.status==='available').length} color={C.amber}/>
    </div>
    <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:24}}>
      <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SHdr title="Revenue Overview" icon={TrendingUp}/>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={REV_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
            <XAxis dataKey="month" tick={{fontSize:12,fill:C.gray}}/>
            <YAxis tick={{fontSize:12,fill:C.gray}} tickFormatter={v=>`${(v/1000).toFixed(0)}K`}/>
            <Tooltip formatter={v=>fmtKSh(v)} contentStyle={{borderRadius:10,border:'none'}}/>
            <Bar dataKey="revenue" fill={C.forest} radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
        <SHdr title="My Properties" icon={Building2} action={()=>setScreen('listing-builder')} lbl="Add New"/>
        {myP.slice(0,4).map(p=>(
          <div key={p.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:`1px solid ${C.border}`}}>
            <div><div style={{fontSize:13,fontWeight:600,color:C.charcoal}}>{p.name.split(' ').slice(0,3).join(' ')}</div><div style={{fontSize:11,color:C.gray}}>{TLBL[p.type]}</div></div>
            <Badge text={SCFG[p.status]?.label} color={SCFG[p.status]?.color} bg={SCFG[p.status]?.bg}/>
          </div>
        ))}
        <button onClick={()=>setScreen('ledger')} style={{width:'100%',marginTop:16,padding:10,background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,fontSize:13,fontWeight:600,color:C.forest,cursor:'pointer'}}>Ledger & Withdrawal →</button>
      </div>
    </div>
  </div>;
}

export function MTDash({user,tickets,setScreen}){
  const mine=tickets.filter(t=>t.assigned_to===user.id);
  return <div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:28}}>
      <MCard icon={Wrench} label="Assigned to Me" value={mine.length} color={C.forest}/>
      <MCard icon={AlertCircle} label="Unassigned" value={tickets.filter(t=>t.status==='open'&&!t.assigned_to).length} color={C.red}/>
      <MCard icon={CheckCircle} label="Resolved This Week" value={tickets.filter(t=>t.status==='resolved').length} color={C.emerald}/>
    </div>
    <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
      <SHdr title="Active Tickets" icon={Wrench} action={()=>setScreen('tickets')} lbl="View All"/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
        {tickets.filter(t=>t.status!=='resolved').map(t=>(
          <div key={t.id} style={{borderLeft:`4px solid ${t.priority==='critical'?C.red:t.priority==='high'?C.amber:t.priority==='medium'?C.blue:C.gray}`,borderRadius:12,padding:16,background:C.cream,border:`1px solid ${C.border}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
              <div style={{fontSize:14,fontWeight:700,color:C.charcoal}}>{t.title}</div>
              <Badge text={t.priority} color={t.priority==='critical'?C.red:t.priority==='high'?C.amber:C.gray} bg={t.priority==='critical'?'#FEE2E2':t.priority==='high'?'#FEF3C7':'#F3F4F6'}/>
            </div>
            <div style={{fontSize:12,color:C.gray,marginBottom:4}}>{t.property} · {t.unit}</div>
            <div style={{fontSize:12,color:C.gray,marginBottom:12}}>Client: {t.client}</div>
            <Badge text={SCFG[t.status]?.label||t.status} color={SCFG[t.status]?.color} bg={SCFG[t.status]?.bg}/>
          </div>
        ))}
      </div>
    </div>
  </div>;
}

export function CLDash({user,leases,properties,setScreen}){
  const lease=leases.find(l=>l.client_id===user.id&&l.status==='active');
  const prop=lease?properties.find(p=>p.id===lease.property_id):null;
  return <div>
    {lease&&prop?<div style={{background:`linear-gradient(135deg,${C.forest},${C.forestLight})`,borderRadius:20,padding:'28px 32px',marginBottom:24,color:C.white}}>
      <div style={{fontSize:12,color:C.mint,fontWeight:600,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>My Active Lease</div>
      <div style={{fontSize:24,fontWeight:800,marginBottom:4}}>{prop.name}</div>
      <div style={{fontSize:14,color:'rgba(255,255,255,0.7)',marginBottom:16}}>{prop.address}</div>
      <div style={{display:'flex',gap:32,flexWrap:'wrap'}}>
        <div><div style={{fontSize:20,fontWeight:700,color:C.mint}}>{fmtKSh(lease.rent_amount)}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>Monthly Rent</div></div>
        <div><div style={{fontSize:20,fontWeight:700,color:lease.balance<=0?C.mint:C.amber}}>{lease.balance<=0?`${fmtKSh(Math.abs(lease.balance))} Credit`:fmtKSh(lease.balance)}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>Account Balance</div></div>
        <div><div style={{fontSize:20,fontWeight:700}}>{lease.end_date}</div><div style={{fontSize:12,color:'rgba(255,255,255,0.6)'}}>Lease Ends</div></div>
      </div>
    </div>:<div style={{background:C.cream,borderRadius:20,padding:28,marginBottom:24,border:`2px dashed ${C.border}`,textAlign:'center'}}>
      <Building2 size={36} color={C.grayLight} style={{marginBottom:12}}/>
      <div style={{fontSize:16,fontWeight:600,color:C.gray,marginBottom:8}}>No Active Lease</div>
      <button onClick={()=>setScreen('properties')} style={{padding:'10px 24px',background:C.forest,color:C.white,border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>Browse Properties</button>
    </div>}
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <MCard icon={DollarSign} label="Balance" value={lease?(lease.balance<=0?`+${fmtKSh(Math.abs(lease.balance))} CR`:fmtKSh(lease.balance)):'—'} color={lease?.balance<=0?C.emerald:C.amber}/>
      <MCard icon={Building2} label="Available Properties" value={properties.filter(p=>p.status==='available').length} color={C.forest}/>
      <MCard icon={MessageSquare} label="Open Chat Threads" value="3" color={C.sage}/>
    </div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
      {[{l:'Make a Payment',I:CreditCard,s:'ledger',c:C.forest},{l:'Support Chat',I:MessageSquare,s:'chat',c:C.sage},{l:'Browse Properties',I:Building2,s:'properties',c:C.charcoalLight}].map(a=>(
        <button key={a.l} onClick={()=>setScreen(a.s)} style={{flex:1,minWidth:160,padding:'18px 16px',background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:14,display:'flex',flexDirection:'column',alignItems:'center',gap:8,cursor:'pointer',transition:'all 0.2s'}}>
          <div style={{width:44,height:44,borderRadius:12,background:a.c+'15',display:'flex',alignItems:'center',justifyContent:'center',color:a.c}}><a.I size={20}/></div>
          <span style={{fontSize:13,fontWeight:600,color:C.charcoal}}>{a.l}</span>
        </button>
      ))}
    </div>
  </div>;
}

export function Properties({user,properties,setSel,setScreen}){
  const [flt,setFlt]=useState('all');const [typ,setTyp]=useState('all');const [q,setQ]=useState('');
  const scoped=user.role==='landlord'?properties.filter(p=>p.landlord_id===user.id):properties;
  const vis=scoped.filter(p=>{
    return(flt==='all'||p.status===flt)&&(typ==='all'||p.type===typ)&&(!q||p.name.toLowerCase().includes(q.toLowerCase())||p.address.toLowerCase().includes(q.toLowerCase()));
  });
  return <div>
    <div style={{display:'flex',gap:12,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
      <div style={{display:'flex',alignItems:'center',gap:8,background:C.cardBg,border:`1px solid ${C.border}`,borderRadius:10,padding:'8px 14px',flex:1,minWidth:200}}>
        <Search size={14} color={C.gray}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search properties…" style={{border:'none',background:'transparent',fontSize:13,outline:'none',width:'100%'}}/>
      </div>
      {['all','available','occupied','pending'].map(s=>(
        <button key={s} onClick={()=>setFlt(s)} style={{padding:'8px 18px',borderRadius:10,border:`1.5px solid ${flt===s?C.forest:C.border}`,background:flt===s?C.forest:C.white,color:flt===s?C.white:C.gray,fontSize:13,fontWeight:500,cursor:'pointer'}}>
          {s==='all'?'All':SCFG[s]?.label}
        </button>
      ))}
      {(user.role==='landlord'||user.role==='project_manager'||user.role==='super_agent')&&(
        <button onClick={()=>setScreen('listing-builder')} style={{padding:'8px 18px',background:C.forest,color:C.white,border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}><Plus size={14}/>New Listing</button>
      )}
    </div>
    <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
      {['all','apartment','student_housing','commercial','land','airbnb'].map(t=>(
        <button key={t} onClick={()=>setTyp(t)} style={{padding:'6px 14px',borderRadius:20,border:`1.5px solid ${typ===t?C.sage:C.border}`,background:typ===t?'#CCFBF1':C.white,color:typ===t?C.forest:C.gray,fontSize:12,fontWeight:500,cursor:'pointer'}}>
          {t==='all'?'All Types':TLBL[t]}
        </button>
      ))}
    </div>
    {vis.length===0?<div style={{textAlign:'center',padding:80}}><Building2 size={40} color={C.grayLight} style={{marginBottom:12}}/><div style={{fontSize:16,fontWeight:600,color:C.gray}}>No properties found</div></div>:
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:20}}>
      {vis.map(p=>(
        <div key={p.id} onClick={()=>{setSel(p);setScreen('property-detail');}} style={{background:C.cardBg,borderRadius:18,overflow:'hidden',border:`1px solid ${C.border}`,cursor:'pointer',transition:'all 0.2s',boxShadow:'0 2px 12px rgba(27,67,50,0.04)'}}>
          <div style={{height:150,background:PGRAD[p.type],display:'flex',alignItems:'center',justifyContent:'center',position:'relative'}}>
            <Building2 size={44} color="rgba(255,255,255,0.25)"/>
            <div style={{position:'absolute',top:12,left:12}}><Badge text={TLBL[p.type]} color="rgba(255,255,255,0.9)" bg="rgba(255,255,255,0.15)"/></div>
            <div style={{position:'absolute',top:12,right:12}}><Badge text={SCFG[p.status]?.label} color={SCFG[p.status]?.color} bg={SCFG[p.status]?.bg}/></div>
          </div>
          <div style={{padding:18}}>
            <h3 style={{fontSize:15,fontWeight:700,color:C.charcoal,margin:'0 0 4px',lineHeight:1.3}}>{p.name}</h3>
            <p style={{fontSize:12,color:C.gray,margin:'0 0 14px',display:'flex',alignItems:'center',gap:4}}><MapPin size={11}/>{p.address}</p>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:18,fontWeight:800,color:C.forest}}>{fmtKSh(p.rent)}<span style={{fontSize:11,fontWeight:400,color:C.gray}}>{p.type==='airbnb'?'/night':p.type==='land'?'':'/mo'}</span></span>
              <div style={{display:'flex',alignItems:'center',gap:3}}><Star size={13} fill={C.gold} color={C.gold}/><span style={{fontSize:12,fontWeight:600,color:C.charcoal}}>{p.rating}</span></div>
            </div>
            {p.details?.bedrooms&&<div style={{display:'flex',gap:12,marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
              <span style={{fontSize:12,color:C.gray,display:'flex',gap:4,alignItems:'center'}}><Bed size={12}/>{p.details.bedrooms} bd</span>
              <span style={{fontSize:12,color:C.gray,display:'flex',gap:4,alignItems:'center'}}><Bath size={12}/>{p.details.bathrooms} ba</span>
              {p.details.parking&&<span style={{fontSize:12,color:C.gray,display:'flex',gap:4,alignItems:'center'}}><Car size={12}/>Parking</span>}
            </div>}
          </div>
        </div>
      ))}
    </div>}
  </div>;
}

export function PropDetail({property,user,setScreen,leases,setLeases,showToast,onEdit,onDelete}){
  const [tab,setTab]=useState('overview');
  if(!property)return null;
  const lease=leases.find(l=>l.property_id===property.id&&l.status==='active');
  const apply=()=>{
    setLeases(p=>[...p,{id:'l'+Date.now(),client_id:user.id,property_id:property.id,start_date:'2026-07-01',end_date:'2027-06-30',rent_amount:property.rent,status:'active',balance:property.rent}]);
    showToast('Lease application submitted! Awaiting manager approval.','success');
  };
  return <div>
    <button onClick={()=>setScreen('properties')} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:C.gray,cursor:'pointer',fontSize:14,marginBottom:20,padding:0}}><ArrowLeft size={16}/>Back to Properties</button>
    <div style={{height:240,background:PGRAD[property.type],borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',marginBottom:24,overflow:'hidden'}}>
      <Building2 size={80} color="rgba(255,255,255,0.12)"/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.4),transparent)',borderRadius:20}}/>
      <div style={{position:'absolute',bottom:24,left:28,color:C.white}}>
        <div style={{marginBottom:6}}><Badge text={TLBL[property.type]} color="rgba(255,255,255,0.9)" bg="rgba(255,255,255,0.15)"/></div>
        <div style={{fontSize:28,fontWeight:800,textShadow:'0 2px 8px rgba(0,0,0,0.3)'}}>{property.name}</div>
        <div style={{fontSize:14,color:'rgba(255,255,255,0.8)',display:'flex',alignItems:'center',gap:4,marginTop:4}}><MapPin size={13}/>{property.address}</div>
      </div>
      <div style={{position:'absolute',top:20,right:24}}><Badge text={SCFG[property.status]?.label} color={SCFG[property.status]?.color} bg={SCFG[property.status]?.bg}/></div>
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
      <div><span style={{fontSize:36,fontWeight:800,color:C.forest}}>{fmtKSh(property.rent)}</span><span style={{fontSize:16,color:C.gray}}>{property.type==='airbnb'?' / night':property.type==='land'?'':' / month'}</span></div>
      {user.role==='client'&&property.status==='available'&&!lease&&<button onClick={apply} style={{padding:'14px 32px',background:C.forest,color:C.white,border:'none',borderRadius:14,fontSize:15,fontWeight:700,cursor:'pointer'}}>Apply for Lease</button>}
      {lease&&<Badge text="Active Lease on This Property" color={C.emerald} bg="#D1FAE5"/>}
      {user.role==='super_agent'&&(onEdit||onDelete)&&<div style={{display:'flex',gap:8}}>
        {onEdit&&<button onClick={onEdit} style={{padding:'12px 22px',background:C.cream,color:C.charcoal,border:`1px solid ${C.border}`,borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer'}}>Edit Listing</button>}
        {onDelete&&<button onClick={onDelete} style={{padding:'12px 22px',background:'#FEE2E2',color:C.red,border:'1px solid #FCA5A5',borderRadius:12,fontSize:14,fontWeight:600,cursor:'pointer'}}>Delete Listing</button>}
      </div>}
    </div>
    <div style={{display:'flex',gap:4,marginBottom:24,background:C.cream,borderRadius:12,padding:4,border:`1px solid ${C.border}`,width:'fit-content'}}>
      {[['overview','Overview'],['3d','🏛 Virtual Tour'],['gallery','Gallery']].map(([k,l])=>(
        <button key={k} onClick={()=>setTab(k)} style={{padding:'8px 20px',borderRadius:9,border:'none',background:tab===k?C.white:'transparent',color:tab===k?C.forest:C.gray,fontWeight:tab===k?700:400,fontSize:14,cursor:'pointer',boxShadow:tab===k?'0 2px 8px rgba(27,67,50,0.08)':'none',transition:'all 0.2s'}}>{l}</button>
      ))}
    </div>
    {tab==='overview'&&<div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:24}}>
      <div>
        <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`,marginBottom:20}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.charcoal,margin:'0 0 12px'}}>Description</h3>
          <p style={{fontSize:14,color:C.gray,lineHeight:1.7,margin:0}}>{property.desc}</p>
        </div>
        <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.charcoal,margin:'0 0 16px'}}>Property Details</h3>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {Object.entries(property.details).filter(([,v])=>v!==null&&v!==undefined&&!Array.isArray(v)&&typeof v!=='object').map(([k,v])=>(
              <div key={k} style={{padding:'12px 16px',background:C.cream,borderRadius:10}}>
                <div style={{fontSize:11,color:C.gray,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{k.replace(/_/g,' ')}</div>
                <div style={{fontSize:14,fontWeight:600,color:C.charcoal}}>{typeof v==='boolean'?(v?'Yes':'No'):String(v)}</div>
              </div>
            ))}
            {property.details.utilities_included&&<div style={{padding:'12px 16px',background:C.cream,borderRadius:10,gridColumn:'1/-1'}}>
              <div style={{fontSize:11,color:C.gray,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Utilities Included</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{property.details.utilities_included.map(u=><Badge key={u} text={u} color={C.sage} bg="#CCFBF1"/>)}</div>
            </div>}
            {property.details.shared_amenities&&<div style={{padding:'12px 16px',background:C.cream,borderRadius:10,gridColumn:'1/-1'}}>
              <div style={{fontSize:11,color:C.gray,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Shared Amenities</div>
              <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{property.details.shared_amenities.map(a=><Badge key={a} text={a} color={C.sage} bg="#CCFBF1"/>)}</div>
            </div>}
          </div>
        </div>
      </div>
      <div>
        <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`,marginBottom:16}}>
          <h3 style={{fontSize:16,fontWeight:700,color:C.charcoal,margin:'0 0 14px'}}>Quick Stats</h3>
          {[['Monthly Rate',fmtKSh(property.rent)],['Rating',`${property.rating} ★`],['Type',TLBL[property.type]],['Status',SCFG[property.status]?.label||property.status]].map(([l,v])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`}}><span style={{fontSize:13,color:C.gray}}>{l}</span><span style={{fontSize:13,fontWeight:600}}>{v}</span></div>
          ))}
        </div>
        {property.type!=='land'&&<div style={{background:`linear-gradient(135deg,${C.forest},${C.forestLight})`,borderRadius:16,padding:24,color:C.white}}>
          <div style={{fontSize:11,color:C.mint,fontWeight:600,letterSpacing:'0.05em',textTransform:'uppercase',marginBottom:8}}>Investment Info</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:4}}>Annual Income</div>
          <div style={{fontSize:22,fontWeight:700,marginBottom:12}}>{fmtKSh(property.rent*12)}</div>
          {property.details.security_deposit&&<><div style={{fontSize:13,color:'rgba(255,255,255,0.7)',marginBottom:4}}>Security Deposit</div><div style={{fontSize:16,fontWeight:700}}>{fmtKSh(property.details.security_deposit)}</div></>}
        </div>}
      </div>
    </div>}
    {tab==='3d'&&<div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><h3 style={{fontSize:16,fontWeight:700,color:C.charcoal,margin:'0 0 4px'}}>3D Virtual Tour</h3><p style={{fontSize:13,color:C.gray,margin:0}}>React Three Fiber viewer — drag to rotate, scroll to zoom.</p></div>
        <Badge text="Three.js Live" color={C.emerald} bg="#D1FAE5"/>
      </div>
      {GlbViewerLazy?<GlbViewerLazy url={property.virtual_tour_url}/>:<Viewer3D/>}
    </div>}
    {tab==='gallery'&&<div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
      <h3 style={{fontSize:16,fontWeight:700,color:C.charcoal,margin:'0 0 20px'}}>Photo Gallery</h3>
      {property.media_urls&&property.media_urls.length>0?
        <div className="ivy-gallery" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {property.media_urls.map((url,i)=>(
            <div key={url} style={{height:150,borderRadius:12,overflow:'hidden',background:C.cream}}>
              <img src={url} alt={`${property.name} photo ${i+1}`} style={{width:'100%',height:'100%',objectFit:'cover'}}/>
            </div>
          ))}
        </div>
        :<div className="ivy-gallery" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {['Living Room','Master Bedroom','Kitchen','Bathroom','Balcony','Exterior'].map((room,i)=>(
            <div key={room} style={{height:150,background:`linear-gradient(135deg,${i%2===0?C.sage:C.sageLight},${i%2===0?C.sageLight:C.mint})`,borderRadius:12,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:8,color:C.white}}>
              <Camera size={24} color="rgba(255,255,255,0.6)"/><span style={{fontSize:12,fontWeight:600}}>{room}</span>
            </div>
          ))}
        </div>
      }
      {(!property.media_urls||property.media_urls.length===0)&&<div style={{marginTop:16,padding:14,background:'#FEF3C7',borderRadius:10,fontSize:13,color:'#92400E',display:'flex',gap:8,alignItems:'flex-start'}}>
        <AlertTriangle size={16} style={{flexShrink:0,marginTop:1}}/> No photos uploaded for this listing yet — landlords add these via the Listing Builder media module.
      </div>}
    </div>}
  </div>;
}
function ListingBuilder({user,setProperties,setScreen,showToast}){
  const [step,setStep]=useState(1);
  const [f,setF]=useState({name:'',address:'',type:'apartment',status:'available',rent:'',desc:'',bedrooms:'',bathrooms:'',floor:'',houseNumber:'',deposit:'',electricity:'',water:'',garbage:'',parking:false,bedsPerRoom:'',pricePerBed:'',amenities:[],gender:'mixed',termLen:'',floorArea:'',parkRatio:'',camSplit:'',zoning:[],acreage:'',titleDeed:'',lat:'',lng:'',zoningUse:'',perNight:'',cleanFee:'',maxGuests:'',minStay:''});
  const [files,setFiles]=useState([]);const [glb,setGlb]=useState(null);const [busy,setBusy]=useState(false);
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  const tog=(k,v)=>setF(p=>({...p,[k]:p[k].includes(v)?p[k].filter(x=>x!==v):[...p[k],v]}));
  const submit=()=>{
    setBusy(true);
    setTimeout(()=>{
      const d={};
      if(f.type==='apartment'){if(f.bedrooms)d.bedrooms=+f.bedrooms;if(f.bathrooms)d.bathrooms=+f.bathrooms;if(f.floor)d.floor=f.floor;if(f.houseNumber)d.house_number=f.houseNumber;if(f.deposit)d.refundable_deposit=+f.deposit;if(f.electricity)d.electricity_charge=+f.electricity;if(f.water)d.water_charge=+f.water;if(f.garbage)d.garbage_charge=+f.garbage;d.parking=f.parking;}
      else if(f.type==='student_housing'){if(f.bedsPerRoom)d.beds_per_room=+f.bedsPerRoom;if(f.pricePerBed)d.price_per_bed=+f.pricePerBed;if(f.amenities.length)d.shared_amenities=f.amenities;d.gender_designation=f.gender;if(f.termLen)d.term_length_months=+f.termLen;if(f.floor)d.floor=f.floor;if(f.houseNumber)d.house_number=f.houseNumber;if(f.deposit)d.refundable_deposit=+f.deposit;if(f.electricity)d.electricity_charge=+f.electricity;if(f.water)d.water_charge=+f.water;if(f.garbage)d.garbage_charge=+f.garbage;}
      else if(f.type==='commercial'){if(f.floorArea)d.floor_area_sqm=+f.floorArea;if(f.floor)d.floor=f.floor;if(f.houseNumber)d.house_number=f.houseNumber;if(f.parkRatio)d.parking_ratio=f.parkRatio;if(f.camSplit)d.cam_split_percent=+f.camSplit;if(f.zoning.length)d.zoning_permissions=f.zoning;if(f.deposit)d.refundable_deposit=+f.deposit;if(f.electricity)d.electricity_charge=+f.electricity;if(f.water)d.water_charge=+f.water;if(f.garbage)d.garbage_charge=+f.garbage;}
      else if(f.type==='land'){if(f.acreage)d.acreage=+f.acreage;if(f.titleDeed)d.title_deed_status=f.titleDeed;if(f.lat&&f.lng)d.gis_coordinates={lat:+f.lat,lng:+f.lng};if(f.zoningUse)d.zoning_use=f.zoningUse;}
      else if(f.type==='airbnb'){if(f.perNight)d.per_night_rate=+f.perNight;if(f.cleanFee)d.cleaning_fee=+f.cleanFee;if(f.maxGuests)d.max_guests=+f.maxGuests;if(f.minStay)d.min_stay=+f.minStay;}
      setProperties(p=>[{id:'p'+Date.now(),name:f.name,address:f.address,type:f.type,status:f.status,landlord_id:user.id,rent:+f.rent,rating:4.5,details:d,desc:f.desc||'A premium property listed on IVY.'},...p]);
      showToast('Listing published successfully!','success');setScreen('properties');setBusy(false);
    },1000);
  };
  const amOpts=['WiFi','Laundry','Communal Kitchen','Study Rooms','Gym','CCTV','Security Guard'];
  const znOpts=['Office','Retail','Light Industrial','Restaurant','Healthcare','Education'];
  const ok1=f.name&&f.address&&f.rent;
  const PillBtn=({k,v,arr,color=C.forest})=><button onClick={()=>tog(k,v)} style={{padding:'7px 16px',borderRadius:20,border:`1.5px solid ${arr.includes(v)?color:C.border}`,background:arr.includes(v)?color+'20':C.white,color:arr.includes(v)?color:C.gray,fontSize:13,cursor:'pointer',fontWeight:arr.includes(v)?600:400}}>{v}</button>;
  return <div style={{maxWidth:800,margin:'0 auto'}}>
    <button onClick={()=>setScreen('properties')} style={{display:'flex',alignItems:'center',gap:6,background:'none',border:'none',color:C.gray,cursor:'pointer',fontSize:14,marginBottom:20,padding:0}}><ArrowLeft size={16}/>Back</button>
    <div style={{display:'flex',gap:8,marginBottom:32}}>
      {['Basic Info','Property Details','Media Upload','Review & Publish'].map((s,i)=>(
        <div key={s} style={{flex:1,display:'flex',flexDirection:'column',gap:6,alignItems:'center'}}>
          <div style={{width:'100%',height:4,borderRadius:2,background:step>i+1?C.forest:step===i+1?C.mint:C.border}}/>
          <span style={{fontSize:11,color:step===i+1?C.forest:C.gray,fontWeight:step===i+1?700:400}}>{s}</span>
        </div>
      ))}
    </div>
    <div style={{background:C.cardBg,borderRadius:20,padding:32,border:`1px solid ${C.border}`}}>
      {step===1&&<div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.charcoal,margin:'0 0 24px'}}>Basic Information</h2>
        <Fld label="Property Name" value={f.name} onChange={v=>u('name',v)} placeholder="e.g. Westlands Luxury Apartments" req/>
        <Fld label="Full Address" value={f.address} onChange={v=>u('address',v)} placeholder="e.g. Westlands, Nairobi, Kenya" req/>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Drp label="Property Type" value={f.type} onChange={v=>u('type',v)} req opts={Object.entries(TLBL).map(([k,v])=>({v:k,l:v}))}/>
          <Drp label="Initial Status" value={f.status} onChange={v=>u('status',v)} opts={['available','pending'].map(s=>({v:s,l:SCFG[s]?.label}))}/>
        </div>
        <Fld label={f.type==='airbnb'?'Per Night Rate (KSh)':f.type==='land'?'Asking Price (KSh)':'Monthly Rent (KSh)'} type="number" value={f.rent} onChange={v=>u('rent',v)} placeholder="0" req/>
        <Fld label="Description" value={f.desc} onChange={v=>u('desc',v)} placeholder="Describe the property…" rows={3}/>
      </div>}
      {step===2&&<div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.charcoal,margin:'0 0 8px'}}>Property Details</h2>
        <p style={{fontSize:14,color:C.gray,margin:'0 0 16px'}}>Specific fields for <strong>{TLBL[f.type]}</strong>. Dynamic fields update based on property type.</p>
        <div style={{marginBottom:20,padding:'12px 16px',background:`${C.forest}12`,border:`1px solid ${C.forest}30`,borderRadius:10,fontSize:13,color:C.forest,display:'flex',gap:8,alignItems:'center'}}><Zap size={15}/>Dynamic form active: <strong>{TLBL[f.type]}</strong></div>
        {f.type==='apartment'&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Fld label="Bedrooms" type="number" value={f.bedrooms} onChange={v=>u('bedrooms',v)} placeholder="e.g. 3"/>
            <Fld label="Bathrooms" type="number" value={f.bathrooms} onChange={v=>u('bathrooms',v)} placeholder="e.g. 2"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Fld label="Floor" value={f.floor} onChange={v=>u('floor',v)} placeholder="e.g. 3rd Floor" hint="Optional"/>
            <Fld label="House / Unit Number" value={f.houseNumber} onChange={v=>u('houseNumber',v)} placeholder="e.g. 3B" hint="Optional"/>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:10}}>
            <div style={{flex:1}}><Fld label="Refundable Deposit (KSh)" type="number" value={f.deposit} onChange={v=>u('deposit',v)} placeholder="Usually 1–2 months rent" hint="Optional — leave blank if none applies."/></div>
            <button type="button" onClick={()=>u('deposit',f.rent||'')} disabled={!f.rent} style={{marginBottom:16,padding:'10px 14px',background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,fontSize:12,fontWeight:600,color:f.rent?C.forest:C.gray,cursor:f.rent?'pointer':'not-allowed',whiteSpace:'nowrap'}}>Same as rent</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <Fld label="Electricity Charge (KSh)" type="number" value={f.electricity} onChange={v=>u('electricity',v)} placeholder="Optional" hint="Optional"/>
            <Fld label="Water Charge (KSh)" type="number" value={f.water} onChange={v=>u('water',v)} placeholder="Optional" hint="Optional"/>
            <Fld label="Garbage Charge (KSh)" type="number" value={f.garbage} onChange={v=>u('garbage',v)} placeholder="Optional" hint="Optional"/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',background:C.cream,borderRadius:10,border:`1px solid ${C.border}`}}>
            <button onClick={()=>u('parking',!f.parking)} style={{width:44,height:24,borderRadius:12,background:f.parking?C.forest:C.border,border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s',flexShrink:0}}>
              <div style={{width:18,height:18,borderRadius:'50%',background:C.cardBg,position:'absolute',top:3,left:f.parking?23:3,transition:'left 0.2s'}}/>
            </button>
            <span style={{fontSize:14,fontWeight:500,color:C.charcoal}}>Parking Available</span>
          </div>
        </>}
        {f.type==='student_housing'&&<>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Fld label="Beds per Room" type="number" value={f.bedsPerRoom} onChange={v=>u('bedsPerRoom',v)} placeholder="e.g. 2"/>
            <Fld label="Price per Bed (KSh)" type="number" value={f.pricePerBed} onChange={v=>u('pricePerBed',v)} placeholder="e.g. 15000"/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Fld label="Term Length (Months)" type="number" value={f.termLen} onChange={v=>u('termLen',v)} placeholder="e.g. 6"/>
            <Drp label="Gender Designation" value={f.gender} onChange={v=>u('gender',v)} opts={[{v:'mixed',l:'Mixed'},{v:'male',l:'Male Only'},{v:'female',l:'Female Only'}]}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Fld label="Floor" value={f.floor} onChange={v=>u('floor',v)} placeholder="e.g. 2nd Floor" hint="Optional"/>
            <Fld label="Room Number" value={f.houseNumber} onChange={v=>u('houseNumber',v)} placeholder="e.g. B204" hint="Optional"/>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:10}}>
            <div style={{flex:1}}><Fld label="Refundable Deposit (KSh)" type="number" value={f.deposit} onChange={v=>u('deposit',v)} placeholder="Optional" hint="Optional — leave blank if none applies."/></div>
            <button type="button" onClick={()=>u('deposit',f.rent||'')} disabled={!f.rent} style={{marginBottom:16,padding:'10px 14px',background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,fontSize:12,fontWeight:600,color:f.rent?C.forest:C.gray,cursor:f.rent?'pointer':'not-allowed',whiteSpace:'nowrap'}}>Same as rent</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <Fld label="Electricity Charge (KSh)" type="number" value={f.electricity} onChange={v=>u('electricity',v)} placeholder="Optional" hint="Optional"/>
            <Fld label="Water Charge (KSh)" type="number" value={f.water} onChange={v=>u('water',v)} placeholder="Optional" hint="Optional"/>
            <Fld label="Garbage Charge (KSh)" type="number" value={f.garbage} onChange={v=>u('garbage',v)} placeholder="Optional" hint="Optional"/>
          </div>
          <div style={{marginBottom:16}}><label style={{display:'block',fontSize:13,fontWeight:600,color:C.charcoalLight,marginBottom:10}}>Shared Amenities</label>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{amOpts.map(x=><PillBtn key={x} k="amenities" v={x} arr={f.amenities} color={C.sage}/>)}</div>
          </div>
        </>}
        {f.type==='commercial'&&<>
          <Fld label="Floor Area (sqm)" type="number" value={f.floorArea} onChange={v=>u('floorArea',v)} placeholder="e.g. 250"/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Fld label="Floor" value={f.floor} onChange={v=>u('floor',v)} placeholder="e.g. Ground Floor" hint="Optional"/>
            <Fld label="Unit / Suite Number" value={f.houseNumber} onChange={v=>u('houseNumber',v)} placeholder="e.g. Suite 14" hint="Optional"/>
          </div>
          <Fld label="Parking Ratio" value={f.parkRatio} onChange={v=>u('parkRatio',v)} placeholder="e.g. 1:50 (1 space per 50 sqm)"/>
          <Fld label="CAM Split (%)" type="number" value={f.camSplit} onChange={v=>u('camSplit',v)} placeholder="e.g. 15" hint="Common Area Maintenance cost shared with tenant"/>
          <div style={{display:'flex',alignItems:'flex-end',gap:10}}>
            <div style={{flex:1}}><Fld label="Refundable Deposit (KSh)" type="number" value={f.deposit} onChange={v=>u('deposit',v)} placeholder="Optional" hint="Optional — leave blank if none applies."/></div>
            <button type="button" onClick={()=>u('deposit',f.rent||'')} disabled={!f.rent} style={{marginBottom:16,padding:'10px 14px',background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,fontSize:12,fontWeight:600,color:f.rent?C.forest:C.gray,cursor:f.rent?'pointer':'not-allowed',whiteSpace:'nowrap'}}>Same as rent</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
            <Fld label="Electricity Charge (KSh)" type="number" value={f.electricity} onChange={v=>u('electricity',v)} placeholder="Optional" hint="Optional"/>
            <Fld label="Water Charge (KSh)" type="number" value={f.water} onChange={v=>u('water',v)} placeholder="Optional" hint="Optional"/>
            <Fld label="Garbage Charge (KSh)" type="number" value={f.garbage} onChange={v=>u('garbage',v)} placeholder="Optional" hint="Optional"/>
          </div>
          <div style={{marginBottom:16}}><label style={{display:'block',fontSize:13,fontWeight:600,color:C.charcoalLight,marginBottom:10}}>Zoning Permissions</label>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>{znOpts.map(x=><PillBtn key={x} k="zoning" v={x} arr={f.zoning} color={C.charcoal}/>)}</div>
          </div>
        </>}
        {f.type==='land'&&<>
          <Fld label="Acreage" type="number" value={f.acreage} onChange={v=>u('acreage',v)} placeholder="e.g. 0.5"/>
          <Drp label="Title Deed Status" value={f.titleDeed} onChange={v=>u('titleDeed',v)} opts={[{v:'',l:'Select…'},{v:'Freehold Title',l:'Freehold Title'},{v:'Leasehold (99yr)',l:'Leasehold (99yr)'},{v:'Leasehold (45yr)',l:'Leasehold (45yr)'},{v:'Agricultural',l:'Agricultural'}]}/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
            <Fld label="GIS Latitude" type="number" value={f.lat} onChange={v=>u('lat',v)} placeholder="-1.286389"/>
            <Fld label="GIS Longitude" type="number" value={f.lng} onChange={v=>u('lng',v)} placeholder="36.817223"/>
          </div>
          <Fld label="Zoning Use" value={f.zoningUse} onChange={v=>u('zoningUse',v)} placeholder="e.g. Residential Development, Commercial"/>
        </>}
        {f.type==='airbnb'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <Fld label="Per Night Rate (KSh)" type="number" value={f.perNight} onChange={v=>u('perNight',v)} placeholder="e.g. 8500"/>
          <Fld label="Cleaning Fee (KSh)" type="number" value={f.cleanFee} onChange={v=>u('cleanFee',v)} placeholder="e.g. 1500"/>
          <Fld label="Max Guests" type="number" value={f.maxGuests} onChange={v=>u('maxGuests',v)} placeholder="e.g. 6"/>
          <Fld label="Min Stay (nights)" type="number" value={f.minStay} onChange={v=>u('minStay',v)} placeholder="e.g. 2"/>
        </div>}
      </div>}
      {step===3&&<div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.charcoal,margin:'0 0 8px'}}>Media Upload</h2>
        <p style={{fontSize:14,color:C.gray,margin:'0 0 24px'}}>Upload photos and a 3D virtual tour file for the listing.</p>
        <div style={{border:`2px dashed ${C.border}`,borderRadius:16,padding:40,textAlign:'center',marginBottom:20,background:C.cream,cursor:'pointer'}} onClick={()=>document.getElementById('ivy_fi')?.click()}>
          <Camera size={36} color={C.grayLight} style={{marginBottom:12}}/>
          <div style={{fontSize:16,fontWeight:700,color:C.charcoal,marginBottom:4}}>Upload Property Photos</div>
          <div style={{fontSize:13,color:C.gray,marginBottom:16}}>PNG, JPG, WEBP up to 10MB each</div>
          <input id="ivy_fi" type="file" multiple accept="image/*" style={{display:'none'}} onChange={e=>setFiles(Array.from(e.target.files||[]))}/>
          <span style={{padding:'10px 24px',background:C.forest,color:C.white,borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}>Choose Files</span>
        </div>
        {files.length>0&&<div style={{marginBottom:20}}><p style={{fontSize:13,fontWeight:600,color:C.charcoal,margin:'0 0 8px'}}>Selected ({files.length}):</p><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{files.map((fi,i)=><Badge key={i} text={fi.name.length>24?fi.name.slice(0,24)+'…':fi.name} color={C.sage} bg="#CCFBF1"/>)}</div></div>}
        <div style={{border:`2px dashed ${C.forest}40`,borderRadius:16,padding:28,background:`${C.forest}06`}}>
          <div style={{display:'flex',gap:16,alignItems:'center'}}>
            <div style={{width:48,height:48,background:`${C.forest}15`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Layers size={22} color={C.forest}/></div>
            <div style={{flex:1}}>
              <div style={{fontSize:15,fontWeight:700,color:C.charcoal,marginBottom:4}}>3D Virtual Tour (.glb file)</div>
              <div style={{fontSize:13,color:C.gray,marginBottom:10}}>Upload a GLB file for the interactive React Three Fiber viewer.</div>
              <button onClick={()=>setGlb({name:'property_tour.glb',size:'24.3 MB'})} style={{padding:'8px 20px',background:C.forest,color:C.white,border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}><Upload size={14}/>{glb?glb.name:'Upload .glb File'}</button>
              {glb&&<div style={{marginTop:8,fontSize:12,color:C.emerald,display:'flex',alignItems:'center',gap:6}}><CheckCircle size={14}/>{glb.name} ({glb.size}) — uploaded</div>}
            </div>
          </div>
        </div>
      </div>}
      {step===4&&<div>
        <h2 style={{fontSize:22,fontWeight:800,color:C.charcoal,margin:'0 0 8px'}}>Review & Publish</h2>
        <p style={{fontSize:14,color:C.gray,margin:'0 0 24px'}}>Verify all details before your listing goes live.</p>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
          {[['Name',f.name||'—'],['Address',f.address||'—'],['Type',TLBL[f.type]],['Status',SCFG[f.status]?.label||f.status],['Rent/Price',f.rent?fmtKSh(+f.rent):'—'],['Photos',files.length+' selected'],['3D Tour',glb?'Uploaded':'No']].map(([k,v])=>(
            <div key={k} style={{padding:'14px 16px',background:C.cream,borderRadius:10}}><div style={{fontSize:11,color:C.gray,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>{k}</div><div style={{fontSize:14,fontWeight:600,color:C.charcoal}}>{v}</div></div>
          ))}
        </div>
        <div style={{padding:20,background:'#D1FAE5',borderRadius:12,border:'1px solid #6EE7B7',display:'flex',gap:12,alignItems:'flex-start'}}>
          <CheckCircle size={20} color={C.emerald} style={{flexShrink:0,marginTop:2}}/>
          <div><div style={{fontSize:14,fontWeight:700,color:'#065F46',marginBottom:4}}>Ready to publish</div><div style={{fontSize:13,color:'#047857'}}>Listing will be immediately visible. A Project Manager will review for approval. Paystack payments auto-enable post-approval.</div></div>
        </div>
      </div>}
      <div style={{display:'flex',justifyContent:'space-between',marginTop:32,paddingTop:24,borderTop:`1px solid ${C.border}`}}>
        {step>1?<button onClick={()=>setStep(s=>s-1)} style={{padding:'12px 24px',background:C.cream,border:`1px solid ${C.border}`,borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',color:C.charcoal,display:'flex',alignItems:'center',gap:6}}><ArrowLeft size={15}/>Back</button>:<div/>}
        {step<4
          ?<button onClick={()=>setStep(s=>s+1)} disabled={step===1&&!ok1} style={{padding:'12px 28px',background:step===1&&!ok1?C.grayLight:C.forest,color:C.white,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:step===1&&!ok1?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:6}}>Continue<ChevronRight size={15}/></button>
          :<button onClick={submit} disabled={busy} style={{padding:'12px 32px',background:C.forest,color:C.white,border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
            {busy?<><RefreshCw size={15} style={{animation:'spin 1s linear infinite'}}/>Publishing…</>:<><CheckCircle size={15}/>Publish Listing</>}
          </button>}
      </div>
    </div>
  </div>;
}

// Module-scope, not defined inside Ledger: a component defined inside
// another component's body gets a new function identity every render,
// which makes React remount its whole subtree — including any <input>
// inside it — on every keystroke, dropping focus/cursor position.
function Modal({title,onClose,children}){
  return <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
    <div style={{background:C.cardBg,borderRadius:20,padding:40,maxWidth:460,width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,0.2)'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}><h3 style={{fontSize:22,fontWeight:800,color:C.charcoal,margin:0}}>{title}</h3><button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:C.gray}}><X size={20}/></button></div>
      {children}
    </div>
  </div>;
}

export function Ledger({user,ledger,setLedger,leases,showToast}){
  const [showPay,setShowPay]=useState(false);const [showWD,setShowWD]=useState(false);
  const [payAmt,setPayAmt]=useState('');const [wdAmt,setWdAmt]=useState('');
  const sys=ledger.reduce((s,t)=>s+t.system_cut,0);
  const vol=ledger.filter(t=>t.type==='payment').reduce((s,t)=>s+t.amount,0);
  const llInc=ledger.filter(t=>t.type==='payment').reduce((s,t)=>s+t.landlord_share,0);
  const lease=leases.find(l=>l.client_id===user.id&&l.status==='active');
  const pa=+payAmt,sp=pa>=1000?calcSplit(pa):null;
  const wa=+wdAmt,wc=wa>=10000?calcWD(wa):null;
  const doPayment=()=>{
    if(!sp){showToast('Minimum payment is KSh 1,000','error');return;}
    const overpay=lease&&pa>lease.rent_amount?pa-lease.rent_amount:0;
    setLedger(p=>[{id:'tx'+Date.now(),date:new Date().toISOString().split('T')[0],type:'payment',amount:pa,desc:`Rent Payment — ${new Date().toLocaleString('default',{month:'long',year:'numeric'})}${overpay>0?` (Overpayment Credit: ${fmtKSh(overpay)})`:''}`,system_cut:sp.systemCut,landlord_share:sp.landlordShare,tier:sp.tier,uid:user.id},...p]);
    showToast(`Payment of ${fmtKSh(pa)} processed! Tier ${sp.tier} — IVY cut: ${fmtKSh(sp.systemCut)}, Landlord: ${fmtKSh(sp.landlordShare)}.`,'success');
    setShowPay(false);setPayAmt('');
  };
  const doWD=()=>{
    if(!wc)return;
    setLedger(p=>[{id:'tx'+Date.now(),date:new Date().toISOString().split('T')[0],type:'withdrawal',amount:wa,desc:`Withdrawal — ${user.name} (Tier ${wc.tier}: ${wc.rate}% fee)`,system_cut:wc.fee,landlord_share:wc.net,tier:wc.tier,uid:user.id},...p]);
    showToast(`Withdrawal of ${fmtKSh(wc.net)} initiated (Tier ${wc.tier}: ${wc.rate}% = ${fmtKSh(wc.fee)} IVY fee).`,'success');
    setShowWD(false);setWdAmt('');
  };

  return <div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:28}}>
      {user.role==='super_agent'&&<MCard icon={Wallet} label="IVY System Balance" value={fmtKSh(sys)} trend={12} color={C.gold}/>}
      {(user.role==='landlord'||user.role==='super_agent')&&<MCard icon={TrendingUp} label="Landlord Revenue" value={fmtKSh(llInc)} trend={8} color={C.forest}/>}
      {user.role==='client'&&lease&&<MCard icon={CreditCard} label="Account Balance" value={lease.balance<=0?`${fmtKSh(Math.abs(lease.balance))} CR`:fmtKSh(lease.balance)} color={lease.balance<=0?C.emerald:C.amber} sub={lease.balance<=0?'Credit (next cycle)':'Outstanding'}/>}
      <MCard icon={DollarSign} label="Total Transactions" value={ledger.length} color={C.sage}/>
      {user.role==='super_agent'&&<MCard icon={BarChart2} label="Platform Volume" value={fmtKSh(vol)} color={C.blue}/>}
    </div>
    <div style={{display:'flex',gap:12,marginBottom:24}}>
      {user.role==='client'&&<button onClick={()=>setShowPay(true)} style={{padding:'12px 28px',background:C.forest,color:C.white,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}><CreditCard size={16}/>Make a Payment (Paystack)</button>}
      {user.role==='landlord'&&<button onClick={()=>setShowWD(true)} style={{padding:'12px 28px',background:C.sage,color:C.white,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}><Download size={16}/>Request Withdrawal</button>}
      {user.role==='super_agent'&&<button onClick={()=>setShowWD(true)} style={{padding:'12px 28px',background:C.gold,color:C.white,border:'none',borderRadius:12,fontSize:14,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:8}}><Download size={16}/>Master Withdrawal</button>}
    </div>
    <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`,marginBottom:24}}>
      <h3 style={{fontSize:16,fontWeight:700,color:C.charcoal,margin:'0 0 16px',display:'flex',alignItems:'center',gap:8}}><Zap size={16} color={C.gold}/>Revenue Split Tiers</h3>
      <div className="ivy-gallery" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
        {[{t:1,range:'KSh 10K–50K',cut:'KSh 20',wd:'2.0%',c:C.sage},{t:2,range:'KSh 50K–200K',cut:'KSh 50',wd:'2.5%',c:C.gold},{t:3,range:'Above KSh 200K',cut:'KSh 500',wd:'3.0%',c:C.forest}].map(x=>(
          <div key={x.t} style={{padding:'16px 18px',background:x.c+'10',borderRadius:12,border:`1px solid ${x.c}30`}}>
            <div style={{fontSize:12,fontWeight:700,color:x.c,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Tier {x.t}</div>
            <div style={{fontSize:11,color:C.gray,marginBottom:6}}>{x.range}</div>
            <div style={{fontSize:13,color:C.charcoal,marginBottom:2}}><strong>On Payment:</strong> {x.cut}</div>
            <div style={{fontSize:13,color:C.charcoal}}><strong>On Withdrawal:</strong> {x.wd}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`}}>
      <SHdr title="Transaction History" icon={FileText}/>
      <div style={{overflowX:'auto'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
            {(user.role==='client'?['Date','Description','Amount','Type']:['Date','Description','Amount','System Cut','Landlord Share','Tier','Type']).map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',fontSize:11,color:C.gray,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',whiteSpace:'nowrap'}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {ledger.map(tx=>(
              <tr key={tx.id} style={{borderBottom:`1px solid ${C.border}`}}>
                <td style={{padding:'12px',color:C.gray,whiteSpace:'nowrap'}}>{tx.date}</td>
                <td style={{padding:'12px',color:C.charcoal,maxWidth:260,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tx.desc}</td>
                <td style={{padding:'12px',fontWeight:700,color:tx.type==='payment'?C.emerald:C.blue,whiteSpace:'nowrap'}}>{fmtKSh(tx.amount)}</td>
                {user.role!=='client'&&<>
                  <td style={{padding:'12px',color:C.amber,whiteSpace:'nowrap'}}>{fmtKSh(tx.system_cut)}</td>
                  <td style={{padding:'12px',color:C.forest,fontWeight:600,whiteSpace:'nowrap'}}>{fmtKSh(tx.landlord_share)}</td>
                  <td style={{padding:'12px',whiteSpace:'nowrap'}}><Badge text={`Tier ${tx.tier}`} color={tx.tier===1?C.sage:tx.tier===2?C.gold:C.forest} bg={tx.tier===1?'#CCFBF1':tx.tier===2?'#FEF3C7':'#D1FAE5'}/></td>
                </>}
                <td style={{padding:'12px',whiteSpace:'nowrap'}}><Badge text={tx.type} color={tx.type==='payment'?C.emerald:C.blue} bg={tx.type==='payment'?'#D1FAE5':'#DBEAFE'}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    {showPay&&<Modal title="Make a Payment" onClose={()=>setShowPay(false)}>
      <div style={{padding:16,background:`${C.forest}10`,borderRadius:12,marginBottom:20,border:`1px solid ${C.forest}25`}}>
        <div style={{fontSize:12,color:C.forest,fontWeight:600,marginBottom:2}}>POWERED BY PAYSTACK</div>
        <div style={{fontSize:13,color:C.gray}}>M-Pesa & Card accepted. Transactions encrypted & secured.</div>
      </div>
      {lease&&<div style={{padding:14,background:C.cream,borderRadius:10,marginBottom:20,border:`1px solid ${C.border}`}}>
        <div style={{fontSize:12,color:C.gray,marginBottom:2}}>Monthly Rent</div>
        <div style={{fontSize:20,fontWeight:700,color:C.forest}}>{fmtKSh(lease.rent_amount)}</div>
        {lease.balance<0&&<div style={{fontSize:12,color:C.emerald,marginTop:4}}>Credit of {fmtKSh(Math.abs(lease.balance))} on your account.</div>}
      </div>}
      <Fld label="Payment Amount (KSh)" type="number" value={payAmt} onChange={setPayAmt} placeholder="e.g. 85000" req/>
      {sp&&<div style={{background:'#D1FAE5',border:'1px solid #6EE7B7',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'#065F46',marginBottom:8}}>Transaction Breakdown — Tier {sp.tier}</div>
        <div style={{fontSize:13,display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:'#047857'}}>Amount</span><span style={{fontWeight:600}}>{fmtKSh(pa)}</span></div>
        <div style={{fontSize:13,display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:C.amber}}>IVY Cut</span><span style={{fontWeight:600,color:C.amber}}>− {fmtKSh(sp.systemCut)}</span></div>
        <div style={{fontSize:13,display:'flex',justifyContent:'space-between',borderTop:'1px solid #6EE7B7',paddingTop:6,marginTop:4}}><span style={{color:C.forest,fontWeight:600}}>Landlord Receives</span><span style={{fontWeight:700,color:C.forest}}>{fmtKSh(sp.landlordShare)}</span></div>
        {lease&&pa>lease.rent_amount&&<div style={{marginTop:8,fontSize:12,color:'#065F46',background:'rgba(255,255,255,0.5)',padding:'6px 10px',borderRadius:8}}>Overpayment of {fmtKSh(pa-lease.rent_amount)} → account credit.</div>}
      </div>}
      <button onClick={doPayment} disabled={!sp} style={{width:'100%',padding:14,background:sp?C.forest:C.grayLight,color:C.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:sp?'pointer':'not-allowed'}}>
        {sp?`Pay ${fmtKSh(pa)} via Paystack`:'Enter an amount to continue'}
      </button>
    </Modal>}
    {showWD&&<Modal title="Withdrawal Request" onClose={()=>setShowWD(false)}>
      <Fld label="Withdrawal Amount (KSh)" type="number" value={wdAmt} onChange={setWdAmt} placeholder="e.g. 420000" req/>
      {wc&&<div style={{background:'#DBEAFE',border:'1px solid #93C5FD',borderRadius:12,padding:16,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:'#1D4ED8',marginBottom:8}}>Breakdown — Tier {wc.tier} ({wc.rate}% fee)</div>
        <div style={{fontSize:13,display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:C.gray}}>Requested</span><span style={{fontWeight:600}}>{fmtKSh(wa)}</span></div>
        <div style={{fontSize:13,display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{color:C.amber}}>IVY Fee ({wc.rate}%)</span><span style={{fontWeight:600,color:C.amber}}>− {fmtKSh(wc.fee)}</span></div>
        <div style={{fontSize:13,display:'flex',justifyContent:'space-between',borderTop:'1px solid #93C5FD',paddingTop:6,marginTop:4}}><span style={{color:'#1D4ED8',fontWeight:600}}>You Receive</span><span style={{fontWeight:700,color:'#1D4ED8'}}>{fmtKSh(wc.net)}</span></div>
      </div>}
      <button onClick={doWD} disabled={!wc} style={{width:'100%',padding:14,background:wc?C.sage:C.grayLight,color:C.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:wc?'pointer':'not-allowed'}}>
        {wc?`Withdraw ${fmtKSh(wc.net)}`:'Enter amount ≥ KSh 10,000'}
      </button>
    </Modal>}
  </div>;
}

function Chat({user,messages,setMessages}){
  const [stream,setStream]=useState('maintenance');const [input,setInput]=useState('');const endRef=useRef(null);
  const cfg={maintenance:{label:'Maintenance',color:C.amber,bg:'#FEF3C7',desc:'Report repairs, plumbing, electrical, and facility issues'},security:{label:'Security',color:C.red,bg:'#FEE2E2',desc:'Report security concerns, unauthorized access, or incidents'},billing:{label:'Billing',color:C.emerald,bg:'#D1FAE5',desc:'Inquiries about rent, payments, credits, and invoices'}};
  const REPLIES={maintenance:["I'll check on that right away.","Work order created. Priority: Medium.","Our technician will be there 10–11 AM.","Issue logged successfully."],security:["Security team alerted.","Reviewing CCTV footage now.","Gate access logged.","Security manager will follow up."],billing:["Payment received and recorded.","Invoice sent to your email.","Balance updated in real-time.","Payment history fully up to date."]};
  const send=()=>{
    if(!input.trim())return;
    const msg={id:'m'+Date.now(),sender:user.name,content:input,time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),sent:true,av:user.initials};
    setMessages(p=>({...p,[stream]:[...p[stream],msg]}));setInput('');
    setTimeout(()=>{
      const reply={id:'m'+Date.now(),sender:stream==='maintenance'?'Matthew Gatheca':'Ivy Jepkosgei',content:REPLIES[stream][Math.floor(Math.random()*REPLIES[stream].length)],time:new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}),sent:user.role!=='client',av:stream==='maintenance'?'MG':'IJ'};
      setMessages(p=>({...p,[stream]:[...p[stream],reply]}));
    },1200);
  };
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:'smooth'});},[messages,stream]);
  const sc=cfg[stream];
  return <div style={{display:'flex',flexDirection:'column',height:'calc(100vh - 140px)',background:C.cardBg,borderRadius:16,border:`1px solid ${C.border}`,overflow:'hidden'}}>
    <div style={{padding:'16px 20px',borderBottom:`1px solid ${C.border}`,background:C.cream}}>
      <div style={{display:'flex',gap:8,marginBottom:10}}>
        {Object.entries(cfg).map(([k,s])=>(
          <button key={k} onClick={()=>setStream(k)} style={{padding:'8px 18px',borderRadius:10,border:`1.5px solid ${stream===k?s.color:C.border}`,background:stream===k?s.bg:C.white,color:stream===k?s.color:C.gray,fontWeight:stream===k?700:400,fontSize:13,cursor:'pointer'}}>
            {s.label}
          </button>
        ))}
      </div>
      <p style={{fontSize:12,color:C.gray,margin:0}}>{sc.desc}</p>
    </div>
    <div style={{flex:1,overflowY:'auto',padding:20,display:'flex',flexDirection:'column',gap:12}}>
      {(messages[stream]||[]).map(msg=>(
        <div key={msg.id} style={{display:'flex',gap:10,alignItems:'flex-end',flexDirection:msg.sent?'row-reverse':'row'}}>
          <Av initials={msg.av} size={32} color={msg.sent?C.forest:C.sageLight}/>
          <div style={{maxWidth:'65%'}}>
            <div style={{fontSize:11,color:C.gray,marginBottom:4,textAlign:msg.sent?'right':'left'}}>{msg.sender} · {msg.time}</div>
            <div style={{padding:'10px 14px',borderRadius:msg.sent?'16px 4px 16px 16px':'4px 16px 16px 16px',background:msg.sent?C.forest:C.cream,color:msg.sent?C.white:C.charcoal,fontSize:14,lineHeight:1.5,border:msg.sent?'none':`1px solid ${C.border}`}}>
              {msg.content}
            </div>
          </div>
        </div>
      ))}
      <div ref={endRef}/>
    </div>
    <div style={{padding:16,borderTop:`1px solid ${C.border}`,display:'flex',gap:10,background:C.cardBg}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder={`Message ${sc.label} team…`} style={{flex:1,padding:'12px 16px',border:`1.5px solid ${C.border}`,borderRadius:12,fontSize:14,outline:'none',fontFamily:'inherit'}}/>
      <button onClick={send} disabled={!input.trim()} style={{width:44,height:44,background:input.trim()?C.forest:C.grayLight,color:C.white,border:'none',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',cursor:input.trim()?'pointer':'not-allowed',flexShrink:0}}><Send size={17}/></button>
    </div>
  </div>;
}

export function Tickets({user,tickets,setTickets,showToast}){
  const upd=(id,status)=>{setTickets(p=>p.map(t=>t.id===id?{...t,status}:t));showToast(`Ticket updated → ${SCFG[status]?.label||status}`,'success');};
  const canManage=user.role==='maintenance'||user.role==='project_manager'||user.role==='super_agent';
  return <div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      <MCard icon={AlertCircle} label="Open" value={tickets.filter(t=>t.status==='open').length} color={C.red}/>
      <MCard icon={RefreshCw} label="In Progress" value={tickets.filter(t=>t.status==='in_progress').length} color={C.amber}/>
      <MCard icon={CheckCircle} label="Resolved" value={tickets.filter(t=>t.status==='resolved').length} color={C.emerald}/>
    </div>
    <div style={{display:'flex',flexDirection:'column',gap:16}}>
      {tickets.map(t=>(
        <div key={t.id} style={{background:C.cardBg,borderRadius:16,padding:24,border:`1px solid ${C.border}`,borderLeft:`4px solid ${t.priority==='critical'?C.red:t.priority==='high'?C.amber:t.priority==='medium'?C.blue:C.gray}`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
            <div>
              <div style={{fontSize:16,fontWeight:700,color:C.charcoal,marginBottom:4}}>{t.title}</div>
              <div style={{fontSize:13,color:C.gray}}>{t.property} · <strong>{t.unit}</strong> · Reported by {t.client}</div>
            </div>
            <div style={{display:'flex',gap:8,alignItems:'center',flexShrink:0}}>
              <Badge text={t.priority} color={t.priority==='critical'?C.red:t.priority==='high'?C.amber:t.priority==='medium'?C.blue:C.gray} bg={t.priority==='critical'?'#FEE2E2':t.priority==='high'?'#FEF3C7':t.priority==='medium'?'#DBEAFE':'#F3F4F6'}/>
              <Badge text={SCFG[t.status]?.label||t.status} color={SCFG[t.status]?.color} bg={SCFG[t.status]?.bg}/>
            </div>
          </div>
          <p style={{fontSize:13,color:C.gray,margin:'0 0 16px',lineHeight:1.6}}>{t.description}</p>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
            <span style={{fontSize:12,color:C.grayLight}}>Reported: {t.created}</span>
            {canManage&&<div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {t.status==='open'&&<button onClick={()=>upd(t.id,'in_progress')} style={{padding:'7px 16px',background:'#FEF3C7',color:C.amber,border:`1px solid ${C.amber}30`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer'}}>Start Work</button>}
              {t.status==='in_progress'&&<button onClick={()=>upd(t.id,'resolved')} style={{padding:'7px 16px',background:'#D1FAE5',color:C.emerald,border:`1px solid ${C.emerald}30`,borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:4}}><Check size={12}/>Mark Resolved</button>}
              {t.status==='resolved'&&<button onClick={()=>upd(t.id,'open')} style={{padding:'7px 16px',background:C.cream,color:C.gray,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,cursor:'pointer'}}>Reopen</button>}
            </div>}
          </div>
        </div>
      ))}
    </div>
  </div>;
}

export function UserMgmt({users,setUsers,showToast,currentUserId,onImpersonate}){
  const [showCreate,setShowCreate]=useState(false);
  const [editingUser,setEditingUser]=useState(null);
  const [form,setForm]=useState({name:'',username:'',email:'',role:'client'});
  const [editForm,setEditForm]=useState({name:'',username:'',role:'client'});
  const roleOpts=[{v:'client',l:'Client'},{v:'landlord',l:'Landlord'},{v:'project_manager',l:'Project Manager'},{v:'maintenance',l:'Maintenance'},{v:'super_agent',l:'Super Agent'}];

  const createUser=()=>{
    if(!form.name.trim()||!form.username.trim()||!form.email.trim()){showToast('Name, username, and email are required.','error');return;}
    const initials=form.name.trim().split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase();
    setUsers(p=>[...p,{id:'u'+Date.now(),username:form.username.trim(),password:'temp123',name:form.name.trim(),role:form.role,mustChangePW:true,initials,email:form.email.trim()}]);
    showToast(`Account created for ${form.name}. (Demo mode — temp password: temp123)`,'success');
    setShowCreate(false);setForm({name:'',username:'',email:'',role:'client'});
  };
  const openEdit=(u)=>{setEditingUser(u);setEditForm({name:u.name,username:u.username,role:u.role});};
  const saveEdit=()=>{
    if(!editForm.name.trim()||!editForm.username.trim()){showToast('Name and username can\'t be empty.','error');return;}
    setUsers(p=>p.map(u=>u.id===editingUser.id?{...u,name:editForm.name.trim(),username:editForm.username.trim(),role:editForm.role,initials:editForm.name.trim().split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}:u));
    showToast('User updated.','success');setEditingUser(null);
  };
  const deleteUser=(u)=>{
    if(!confirm(`Permanently delete ${u.name}'s account? (Demo mode — this cannot be undone within this session.)`))return;
    setUsers(p=>p.filter(x=>x.id!==u.id));
    showToast(`${u.name}'s account deleted.`,'success');
  };
  const impersonate=(u)=>{
    if(!confirm(`Log in as ${u.name}? This will switch your current session to theirs.`))return;
    onImpersonate(u);
  };

  return <div>
    <div style={{display:'flex',gap:16,flexWrap:'wrap',marginBottom:24}}>
      {Object.entries(RCFG).map(([role,cfg])=>(<MCard key={role} icon={Users} label={cfg.label} value={users.filter(u=>u.role===role).length} color={cfg.color}/>))}
    </div>
    <div style={{background:C.cardBg,borderRadius:16,border:`1px solid ${C.border}`,overflow:'hidden'}}>
      <div style={{padding:'20px 24px',borderBottom:`1px solid ${C.border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h2 style={{fontSize:18,fontWeight:700,color:C.charcoal,margin:0}}>All Platform Users</h2>
        <button onClick={()=>setShowCreate(true)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',background:C.forest,color:C.white,border:'none',borderRadius:10,fontSize:13,fontWeight:600,cursor:'pointer'}}><Plus size={14}/>Create User</button>
      </div>
      <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
        <thead><tr style={{borderBottom:`1px solid ${C.border}`,background:C.cream}}>
          {['User','Email','Role','Status','Actions'].map(h=><th key={h} style={{padding:'12px 20px',textAlign:'left',fontSize:12,color:C.gray,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>)}
        </tr></thead>
        <tbody>
          {users.map(u=>(
            <tr key={u.id} style={{borderBottom:`1px solid ${C.border}`}}>
              <td style={{padding:'14px 20px'}}><div style={{display:'flex',alignItems:'center',gap:10}}><Av initials={u.initials} size={36} color={RCFG[u.role]?.color||C.sage}/><div><div style={{fontWeight:600,color:C.charcoal}}>{u.name}</div><div style={{fontSize:12,color:C.gray}}>@{u.username}</div></div></div></td>
              <td style={{padding:'14px 20px',color:C.gray}}>{u.email}</td>
              <td style={{padding:'14px 20px'}}><Badge text={RCFG[u.role]?.label} color={RCFG[u.role]?.color} bg={RCFG[u.role]?.bg}/></td>
              <td style={{padding:'14px 20px'}}><Badge text={u.mustChangePW?'Pending PW Change':'Active'} color={u.mustChangePW?C.amber:C.emerald} bg={u.mustChangePW?'#FEF3C7':'#D1FAE5'}/></td>
              <td style={{padding:'14px 20px'}}><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                <button onClick={()=>openEdit(u)} style={{padding:'6px 12px',background:C.cream,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12,cursor:'pointer',color:C.charcoal}}>Edit</button>
                {u.id!==currentUserId&&<>
                  <button onClick={()=>impersonate(u)} style={{padding:'6px 12px',background:'#DBEAFE',border:'1px solid #93C5FD',borderRadius:8,fontSize:12,cursor:'pointer',color:'#1D4ED8'}}>Log in as</button>
                  <button onClick={()=>deleteUser(u)} style={{padding:'6px 12px',background:'#FEE2E2',border:'1px solid #FCA5A5',borderRadius:8,fontSize:12,cursor:'pointer',color:C.red}}>Delete</button>
                </>}
              </div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {showCreate&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.cardBg,borderRadius:20,padding:36,maxWidth:440,width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontSize:20,fontWeight:800,color:C.charcoal,margin:0}}>Create User</h3>
          <button onClick={()=>setShowCreate(false)} style={{background:'none',border:'none',cursor:'pointer',color:C.gray}}><X size={20}/></button>
        </div>
        <Fld label="Full Name" value={form.name} onChange={v=>setForm(f=>({...f,name:v}))} req/>
        <Fld label="Username" value={form.username} onChange={v=>setForm(f=>({...f,username:v}))} req/>
        <Fld label="Email" value={form.email} onChange={v=>setForm(f=>({...f,email:v}))} req/>
        <Drp label="Role" value={form.role} onChange={v=>setForm(f=>({...f,role:v}))} opts={roleOpts} req/>
        <button onClick={createUser} style={{width:'100%',marginTop:8,padding:14,background:C.forest,color:C.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer'}}>Create Account</button>
      </div>
    </div>}

    {editingUser&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20}}>
      <div style={{background:C.cardBg,borderRadius:20,padding:36,maxWidth:420,width:'100%',boxShadow:'0 32px 80px rgba(0,0,0,0.2)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontSize:20,fontWeight:800,color:C.charcoal,margin:0}}>Edit User</h3>
          <button onClick={()=>setEditingUser(null)} style={{background:'none',border:'none',cursor:'pointer',color:C.gray}}><X size={20}/></button>
        </div>
        <Fld label="Full Name" value={editForm.name} onChange={v=>setEditForm(f=>({...f,name:v}))} req/>
        <Fld label="Username" value={editForm.username} onChange={v=>setEditForm(f=>({...f,username:v}))} req/>
        <Drp label="Role" value={editForm.role} onChange={v=>setEditForm(f=>({...f,role:v}))} opts={roleOpts} req/>
        <button onClick={saveEdit} style={{width:'100%',marginTop:8,padding:14,background:C.forest,color:C.white,border:'none',borderRadius:12,fontSize:15,fontWeight:700,cursor:'pointer'}}>Save Changes</button>
      </div>
    </div>}
  </div>;
}

export const TITLES={dashboard:'Dashboard',properties:'Properties',users:'User Management',ledger:'Financial Ledger',chat:'Operations Chat',tickets:'Maintenance Tickets','listing-builder':'New Listing','property-detail':'Property Detail',withdrawals:'Withdrawals',approvals:'Pending Approvals',lease:'My Lease',schedule:'Schedule',logs:'Activity Logs',profile:'My Profile','system-info':'System Info','my-team':'My Team'};

function MyProfileDemo({user,setUser,showToast}){
  const [fullName,setFullName]=useState(user.name);
  const [username,setUsername]=useState(user.username);
  const [newPw,setNewPw]=useState('');
  const [confirmPw,setConfirmPw]=useState('');
  const save=()=>{
    if(!fullName.trim()||!username.trim()){showToast('Name and username can\'t be empty.','error');return;}
    setUser(u=>({...u,name:fullName.trim(),username:username.trim(),initials:fullName.trim().split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}));
    showToast('Profile updated.','success');
  };
  const changePw=()=>{
    if(newPw.length<8){showToast('Password must be at least 8 characters.','error');return;}
    if(newPw!==confirmPw){showToast('Passwords do not match.','error');return;}
    setNewPw('');setConfirmPw('');
    showToast('Password updated. (Demo mode — not persisted.)','success');
  };
  return <div style={{maxWidth:640,display:'flex',flexDirection:'column',gap:24}}>
    <div style={{background:C.cardBg,borderRadius:16,padding:28,border:`1px solid ${C.border}`}}>
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:24}}>
        <Av initials={user.initials} size={64} color={RCFG[user.role]?.color||C.sage}/>
        <div>
          <div style={{fontSize:18,fontWeight:700,color:C.charcoal}}>{user.name}</div>
          <Badge text={RCFG[user.role]?.label||user.role} color={RCFG[user.role]?.color} bg={RCFG[user.role]?.bg}/>
        </div>
      </div>
      <div style={{fontSize:14,fontWeight:700,color:C.charcoal,display:'flex',alignItems:'center',gap:8,marginBottom:16}}><Users size={16}/>Profile details</div>
      <label style={{fontSize:13,fontWeight:600,color:C.charcoal}}>Full Name</label>
      <input value={fullName} onChange={e=>setFullName(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,margin:'6px 0 16px',fontSize:14,fontFamily:'inherit'}}/>
      <label style={{fontSize:13,fontWeight:600,color:C.charcoal}}>Username</label>
      <input value={username} onChange={e=>setUsername(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,margin:'6px 0 20px',fontSize:14,fontFamily:'inherit'}}/>
      <button onClick={save} style={{padding:'10px 22px',background:C.forest,color:C.white,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>Save Changes</button>
    </div>
    <div style={{background:C.cardBg,borderRadius:16,padding:28,border:`1px solid ${C.border}`}}>
      <div style={{fontSize:14,fontWeight:700,color:C.charcoal,display:'flex',alignItems:'center',gap:8,marginBottom:16}}><Key size={16}/>Change password</div>
      <label style={{fontSize:13,fontWeight:600,color:C.charcoal}}>New Password</label>
      <input type="password" value={newPw} onChange={e=>setNewPw(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,margin:'6px 0 16px',fontSize:14,fontFamily:'inherit'}}/>
      <label style={{fontSize:13,fontWeight:600,color:C.charcoal}}>Confirm New Password</label>
      <input type="password" value={confirmPw} onChange={e=>setConfirmPw(e.target.value)} style={{width:'100%',padding:'10px 14px',borderRadius:10,border:`1px solid ${C.border}`,margin:'6px 0 20px',fontSize:14,fontFamily:'inherit'}}/>
      <button onClick={changePw} style={{padding:'10px 22px',background:C.sage,color:C.white,border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer'}}>Update Password</button>
    </div>
  </div>;
}

export default function App(){
  const [screen,setScreen]=useState('landing');
  const [user,setUser]=useState(null);
  const [col,setCol]=useState(false);
  const [props,setProps]=useState(INIT_PROPS);
  const [leases,setLeases]=useState(INIT_LEASES);
  const [ledger,setLedger]=useState(INIT_LEDGER);
  const [tickets,setTickets]=useState(INIT_TICKETS);
  const [msgs,setMsgs]=useState(INIT_MSGS);
  const [users,setUsers]=useState(USERS_DB);
  const [sel,setSel]=useState(null);
  const [toast,setToast]=useState(null);

  const showToast=(msg,type='success')=>{setToast({msg,type});setTimeout(()=>setToast(null),4500);};

  useEffect(()=>{
    const s=document.createElement('style');
    s.textContent=`@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');*{box-sizing:border-box;}::-webkit-scrollbar{width:4px;height:4px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:#A3D98C;border-radius:2px;}input:focus,select:focus,textarea:focus{border-color:#7FCB63!important;box-shadow:0 0 0 3px rgba(99,188,70,0.1);}@keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}`;
    document.head.appendChild(s);return()=>{try{document.head.removeChild(s);}catch(e){}};
  },[]);

  const login=(u)=>{setUser({...u});if(u.mustChangePW){setScreen('change-password');}else{setScreen('dashboard');}};
  const logout=()=>{setUser(null);setScreen('landing');};
  const pwDone=()=>{setUser(u=>({...u,mustChangePW:false}));setScreen('dashboard');showToast('Password updated! Welcome, '+user.name+'.','success');};

  const getDash=()=>{
    if(!user)return null;
    if(user.role==='super_agent')return <SADash user={user} properties={props} leases={leases} ledger={ledger} users={users} setScreen={setScreen}/>;
    if(user.role==='project_manager')return <PMDash properties={props} leases={leases} tickets={tickets} setScreen={setScreen}/>;
    if(user.role==='landlord')return <LLDash user={user} properties={props} ledger={ledger} setScreen={setScreen}/>;
    if(user.role==='maintenance')return <MTDash user={user} tickets={tickets} setScreen={setScreen}/>;
    return <CLDash user={user} leases={leases} properties={props} setScreen={setScreen}/>;
  };

  const renderScreen=()=>{
    switch(screen){
      case 'dashboard':return getDash();
      case 'properties':return <Properties user={user} properties={props} setSel={setSel} setScreen={setScreen}/>;
      case 'property-detail':return <PropDetail property={sel} user={user} setScreen={setScreen} leases={leases} setLeases={setLeases} showToast={showToast}/>;
      case 'listing-builder':return <ListingBuilder user={user} setProperties={setProps} setScreen={setScreen} showToast={showToast}/>;
      case 'ledger':return <Ledger user={user} ledger={ledger} setLedger={setLedger} leases={leases} showToast={showToast}/>;
      case 'chat':return <Chat user={user} messages={msgs} setMessages={setMsgs}/>;
      case 'tickets':return <Tickets user={user} tickets={tickets} setTickets={setTickets} showToast={showToast}/>;
      case 'users':return <UserMgmt users={users} setUsers={setUsers} showToast={showToast} currentUserId={user.id} onImpersonate={login}/>;
      case 'profile':return <MyProfileDemo user={user} setUser={setUser} showToast={showToast}/>;
      default:return getDash();
    }
  };

  const ToastEl=()=>toast?<div style={{position:'fixed',top:20,right:20,zIndex:9999,background:toast.type==='success'?C.forest:C.red,color:C.white,padding:'14px 20px',borderRadius:12,boxShadow:'0 8px 32px rgba(0,0,0,0.2)',display:'flex',alignItems:'center',gap:10,maxWidth:420,animation:'fadeUp 0.3s ease'}}>
    {toast.type==='success'?<CheckCircle size={17}/>:<AlertCircle size={17}/>}
    <span style={{fontSize:14,fontWeight:500,flex:1}}>{toast.msg}</span>
    <button onClick={()=>setToast(null)} style={{background:'none',border:'none',color:'rgba(255,255,255,0.7)',cursor:'pointer',padding:0,marginLeft:8}}><X size={14}/></button>
  </div>:null;

  if(screen==='landing')return <><Landing onEnter={()=>setScreen('login')}/><ToastEl/></>;
  if(screen==='login')return <><Login onLogin={login} onBack={()=>setScreen('landing')}/><ToastEl/></>;
  if(screen==='change-password')return <><ChangePW user={user} onDone={pwDone}/><ToastEl/></>;

  const sw=col?72:240;
  return <div style={{display:'flex',minHeight:'100vh',fontFamily:"var(--font-outfit), sans-serif",background:C.cream}}>
    <Sidebar user={user} active={screen} setScreen={setScreen} onLogout={logout} col={col} setCol={setCol}/>
    <div style={{flex:1,marginLeft:sw,transition:'margin-left 0.25s cubic-bezier(0.4,0,0.2,1)',display:'flex',flexDirection:'column',minHeight:'100vh'}}>
      <TopBar title={TITLES[screen]||'Dashboard'} user={user} setScreen={setScreen}/>
      <main style={{flex:1,padding:'28px 28px 48px',overflowY:'auto'}}>{renderScreen()}</main>
    </div>
    <ToastEl/>
  </div>;
}
