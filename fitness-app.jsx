import { useState, useEffect, useRef } from "react";

const FONTS = [
  { id:"sf",        label:"SF Pro (기본)",          value:"-apple-system, BlinkMacSystemFont, sans-serif" },
  { id:"patrick",   label:"Patrick Hand (필기체)",  value:"'Patrick Hand', cursive" },
  { id:"nanumbrush",label:"Nanum Brush Script",     value:"'Nanum Brush Script', cursive" },
  { id:"nanumpen",  label:"Nanum Pen Script",       value:"'Nanum Pen Script', cursive" },
  { id:"gothic",    label:"Gothic A1 (깔끔)",       value:"'Gothic A1', sans-serif" },
  { id:"rounded",   label:"Nunito (부드러움)",      value:"'Nunito', sans-serif" },
];

const GOLF_COURSES = [
  { id:1,  name:"수원CC",        region:"경기", pars:[4,3,5,4,4,3,5,4,4,4,4,3,5,4,3,5,4,4] },
  { id:4,  name:"남서울CC",      region:"경기", pars:[4,4,3,5,4,4,3,4,5,4,4,3,5,4,4,3,4,5] },
  { id:5,  name:"한양CC",        region:"경기", pars:[4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4] },
  { id:6,  name:"88CC",          region:"경기", pars:[4,4,3,5,4,3,4,5,4,4,4,3,5,4,4,3,5,4] },
  { id:7,  name:"파인크리크CC",  region:"경기", pars:[4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4] },
  { id:8,  name:"레이크사이드CC",region:"경기", pars:[4,4,3,5,4,4,3,4,5,4,4,3,5,4,4,3,4,5] },
  { id:9,  name:"이천CC",        region:"경기", pars:[4,4,3,5,4,3,4,5,4,4,4,3,5,4,4,3,5,4] },
  { id:10, name:"베어크리크CC",  region:"경기", pars:[4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4] },
  { id:11, name:"제주CC",        region:"제주", pars:[4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4] },
  { id:12, name:"핀크스GC",      region:"제주", pars:[4,4,3,5,4,4,3,4,5,4,4,3,5,4,4,3,4,5] },
  { id:13, name:"나인브릿지",    region:"제주", pars:[4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4] },
  { id:0,  name:"직접 입력",     region:"기타", pars:[4,4,3,5,4,4,3,4,5,4,4,3,5,4,4,3,4,5] },
];

const DEFAULT_FAV = ["벤치프레스","스쿼트","데드리프트","풀업","오버헤드프레스","레그프레스","랫풀다운","바벨로우","인클라인프레스","레그컬"];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const fmtDate = (str) => {
  if (!str) return "";
  const parts = str.split("-");
  const days = ["일","월","화","수","목","금","토"];
  const day = days[new Date(str).getDay()];
  return `${parts[0]}.${parts[1]}.${parts[2]} (${day})`;
};

const SAMPLE_RECORDS = [
  { id:1, date:"2026-03-28", type:"health", subType:"upper", title:"상체 루틴", duration:"58분",
    exercises:[
      {name:"벤치프레스",    sets:[{weight:80,reps:10},{weight:80,reps:8},{weight:75,reps:8}]},
      {name:"인클라인프레스",sets:[{weight:24,reps:12},{weight:24,reps:10}]},
      {name:"트라이셉스",    sets:[{weight:20,reps:15},{weight:20,reps:12}]},
    ]},
  { id:2, date:"2026-03-26", type:"health", subType:"lower", title:"하체 루틴", duration:"65분",
    exercises:[
      {name:"스쿼트",    sets:[{weight:100,reps:8},{weight:100,reps:8},{weight:95,reps:8}]},
      {name:"레그프레스",sets:[{weight:160,reps:12},{weight:160,reps:10}]},
      {name:"레그컬",    sets:[{weight:45,reps:12},{weight:45,reps:12}]},
    ]},
  { id:3, date:"2026-03-24", type:"golf", subType:"", title:"연습장 세션", duration:"90분",
    exercises:[
      {name:"드라이버",  sets:[{weight:null,reps:30,note:"스윙궤도 교정"}]},
      {name:"7번 아이언",sets:[{weight:null,reps:40,note:"임팩트 집중"}]},
    ]},
];

const mkScores = () => Array.from({length:18}, ()=>({score:"", putts:""}));

const normalizeWorkoutExercises = (exs) => exs.map((ex, idx) => ({
  ...ex,
  id: ex.id || `ex-${Date.now()}-${idx}`,
  name: ex.name ?? "",
  sets: Array.isArray(ex.sets) && ex.sets.length > 0 ? ex.sets : [{weight:null,reps:0}],
  target: ex.target ?? (Array.isArray(ex.sets) ? ex.sets.length : 1),
}));

export default function App() {
  const [font, setFont]           = useState(FONTS[0]);
  const [activeTab, setActiveTab] = useState("home");
  const [subView, setSubView]     = useState(null);
  const [records, setRecords]     = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("fitness-records");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === SAMPLE_RECORDS.length && parsed.every((r,i) => r.id === SAMPLE_RECORDS[i].id && r.title === SAMPLE_RECORDS[i].title && r.type === SAMPLE_RECORDS[i].type)) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  });
  const [selRec, setSelRec]       = useState(null);
  const [copiedId, setCopiedId]   = useState(null);
  const [toast, setToast]         = useState(null);
  const [recFilter, setRecFilter] = useState("all");

  const [timerSec, setTimerSec]   = useState(90);
  const [timerDisp, setTimerDisp] = useState(90);
  const [timerOn, setTimerOn]     = useState(false);
  const timerRef = useRef(null);

  const [workoutExercises, setWorkoutExercises] = useState([]);
  const [exCounters, setExCounters]             = useState({});
  const [workoutDone, setWorkoutDone]           = useState(false);
  const [workoutSubType, setWorkoutSubType]     = useState("upper");
  const startTime = useRef(new Date());

  const [newRec, setNewRec] = useState({type:"health",subType:"upper",title:"",date:todayStr(),exercises:[{name:"",sets:[{weight:"",reps:""}]}]});
  const [favs, setFavs]     = useState(DEFAULT_FAV);

  const [course, setCourse]               = useState("");
  const [golfPars, setGolfPars]           = useState(Array(18).fill(4));
  const [scores, setScores]               = useState(mkScores());
  const [golfPhoto, setGolfPhoto]         = useState(null);
  const [golfNote, setGolfNote]           = useState("");
  const [golfDate, setGolfDate]           = useState(todayStr());
  const [golfRounds, setGolfRounds]       = useState(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("fitness-golf-rounds");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 3 && parsed.every((r,i) => r.id === i+1 && typeof r.course === "string")) {
        return [];
      }
      return parsed;
    } catch {
      return [];
    }
  });
  const [lightMode, setLightMode]         = useState(false);
  const photoRef   = useRef(null);
  const galleryRef = useRef(null);

  const [notifs, setNotifs] = useState({workout:false,rest:false,weekly:false,golf:false});

  useEffect(() => {
    if (timerOn && timerDisp > 0) {
      timerRef.current = setInterval(() => {
        setTimerDisp(p => {
          if (p <= 1) {
            setTimerOn(false);
            notifyRestComplete();
            toast2("⏱ 휴식 완료! 다음 세트!");
            return 0;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerOn, notifs.rest]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("fitness-records", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("fitness-golf-rounds", JSON.stringify(golfRounds));
  }, [golfRounds]);


  const toast2 = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500); };
  const notifyRestComplete = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([300,100,300,100,500]);
      return;
    }
    if (typeof window !== "undefined" && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
      osc.onended = () => ctx.close();
    }
  };
  const parseDurationToMinutes = (str) => {
    if (!str) return 0;
    const hourMatch = str.match(/(\d+)\s*h/i);
    const minuteMatch = str.match(/(\d+)\s*분/i);
    let minutes = 0;
    if (hourMatch) {
      minutes += parseInt(hourMatch[1], 10) * 60;
    }
    if (minuteMatch) {
      minutes += parseInt(minuteMatch[1], 10);
    }
    if (!hourMatch && !minuteMatch) {
      const numeric = parseInt(str, 10);
      if (!isNaN(numeric)) minutes = numeric;
    }
    return minutes;
  };
  const formatMinutes = (minutes) => {
    if (!minutes) return "0분";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0) return m > 0 ? `${h}h ${m}m` : `${h}h`;
    return `${m}분`;
  };
  const today = new Date();
  const thisMonthRecords = records.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();
  });
  const monthlyCount = thisMonthRecords.length;
  const totalMinutes = thisMonthRecords.reduce((sum, r) => sum + parseDurationToMinutes(r.duration), 0);
  const totalTimeLabel = formatMinutes(totalMinutes);
  const recordDateSet = new Set(records.map(r => r.date).filter(Boolean));
  const getCurrentStreak = () => {
    if (recordDateSet.size === 0) return 0;
    const sortedDates = [...recordDateSet].sort();
    let lastDate = sortedDates[sortedDates.length - 1];
    let streak = 0;
    const normalize = (date) => new Date(new Date(date).getFullYear(), new Date(date).getMonth(), new Date(date).getDate());
    let current = normalize(lastDate);
    while (recordDateSet.has(current.toISOString().slice(0,10))) {
      streak += 1;
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() - 1);
    }
    return streak;
  };
  const currentStreak = getCurrentStreak();
  const pct    = (timerDisp / timerSec) * 100;
  const fmt    = (sec) => `${Math.floor(sec/60)}:${String(sec%60).padStart(2,"0")}`;
  const go     = (tab, sub=null) => { setActiveTab(tab); setSubView(sub); setSelRec(null); };

  const handleStartWorkout = (r) => {
    setWorkoutExercises(normalizeWorkoutExercises(r.exercises));
    setWorkoutSubType(r.subType || "upper");
    setExCounters({});
    startTime.current = new Date();
    setWorkoutDone(false);
    go("workout");
    toast2("🚀 운동 시작! 파이팅!");
  };

  const totalSets = () => Object.values(exCounters).reduce((a,b)=>a+b,0);
  const elapsed   = () => Math.max(1, Math.floor((new Date()-startTime.current)/60000));
  const addWorkoutExercise = () => setWorkoutExercises(p => [...p, {id:`ex-${Date.now()}-${p.length}`,name:"",target:1,sets:[{weight:null,reps:0}]}]);
  const updateWorkoutExercise = (id, field, value) => setWorkoutExercises(p => p.map(ex => ex.id===id ? {...ex,[field]:field === "target" ? value : value} : ex));
  const removeWorkoutExercise = (id) => {
    setWorkoutExercises(p => p.filter(ex => ex.id !== id));
    setExCounters(p => {
      const next = {};
      for (const [key, value] of Object.entries(p)) {
        if (key !== id) next[key] = value;
      }
      return next;
    });
  };

  const finishWorkout = () => {
    const d = new Date();
    const rec = {
      id: Date.now(),
      date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`,
      type:"health", subType:workoutSubType,
      title: workoutSubType==="upper"?"상체 루틴":"하체 루틴",
      duration:`${elapsed()}분`,
      exercises: workoutExercises.map(ex=>({
        name:ex.name,
        sets:Array.from({length:exCounters[ex.id]||0},(_,i)=>ex.sets[i]||{weight:null,reps:0}),
      })).filter(e=>e.name && e.sets.length>0),
    };
    setRecords(p=>[rec,...p]);
    setWorkoutDone(true);
  };

  const addEx  = ()     => setNewRec(p=>({...p,exercises:[...p.exercises,{name:"",sets:[{weight:"",reps:""}]}]}));
  const addSet = (ei)   => setNewRec(p=>{const e=[...p.exercises];e[ei]={...e[ei],sets:[...e[ei].sets,{weight:"",reps:""}]};return{...p,exercises:e};});
  const upName = (ei,v) => setNewRec(p=>{const e=[...p.exercises];e[ei]={...e[ei],name:v};return{...p,exercises:e};});
  const upSet  = (ei,si,f,v) => setNewRec(p=>{const e=[...p.exercises];const s=[...e[ei].sets];s[si]={...s[si],[f]:v};e[ei]={...e[ei],sets:s};return{...p,exercises:e};});
  const addFav = (name) => { setNewRec(p=>({...p,exercises:[...p.exercises.filter(e=>e.name),{name,sets:[{weight:"",reps:""}]}]})); toast2(`${name} 추가!`); };
  const togFav = (name) => setFavs(p=>p.includes(name)?p.filter(f=>f!==name):[...p,name]);
  const saveRec = () => {
    if (!newRec.title) { toast2("⚠️ 제목을 입력해주세요"); return; }
    setRecords(p=>[{id:Date.now(),date:newRec.date,type:newRec.type,subType:newRec.subType,title:newRec.title,duration:"직접입력",exercises:newRec.exercises.filter(e=>e.name)},...p]);
    setNewRec({type:"health",subType:"upper",title:"",date:todayStr(),exercises:[{name:"",sets:[{weight:"",reps:""}]}]});
    go("record"); toast2("💾 기록 저장됐어요!");
  };

  const deleteRec = (id) => {
    if (!window.confirm("이 기록을 삭제하시겠어요?")) return;
    setRecords(p => p.filter(r => r.id !== id));
    if (selRec?.id === id) {
      setSelRec(null);
      setSubView(null);
    }
    toast2("🗑️ 기록이 삭제되었습니다.");
  };

  const deleteGolfRound = (id) => {
    if (!window.confirm("이 라운드를 삭제하시겠어요?")) return;
    setGolfRounds(p => p.filter(r => r.id !== id));
    toast2("🗑️ 라운드가 삭제되었습니다.");
  };

  const golfRoundCount = golfRounds.length;
  const golfBestScore = golfRoundCount > 0 ? Math.min(...golfRounds.map(r => Number(r.score))) : null;
  const golfAvgScore = golfRoundCount > 0 ? Math.round(golfRounds.reduce((sum, r) => sum + Number(r.score), 0) / golfRoundCount) : null;

  const totalScore = scores.reduce((s,h)=>s+(parseInt(h.score)||0),0);
  const totalPar   = golfPars.reduce((a,b)=>a+b,0);
  const totalPutts = scores.reduce((s,h)=>s+(parseInt(h.putts)||0),0);
  const diff       = totalScore - totalPar;
  const handlePhoto = (e) => { const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=ev=>setGolfPhoto(ev.target.result); r.readAsDataURL(f); };
  const upScore     = (i,f,v) => setScores(p=>{const s=[...p];s[i]={...s[i],[f]:v};return s;});
  const upPar       = (i,v)   => setGolfPars(p=>{const ps=[...p];ps[i]=parseInt(v);return ps;});
  const scoreColor  = (sc,par) => { if(!sc) return tc; const d=parseInt(sc)-par; return d<0?grn:d===0?"#60A5FA":org; };
  const getIcon     = (type,sub) => type==="golf"?"⛳":sub==="lower"?"🐘":"🦁";

  const isLight = lightMode && activeTab==="golf";
  const bg  = isLight?"#F0F4EE":"#0A0A0A";
  const tc  = isLight?"#1A1A1A":"#F5F5F7";
  const crd = isLight?"#FFFFFF":"#141414";
  const bdr = isLight?"#DDE8D8":"#222";
  const sub = isLight?"#888":"#555";
  const F   = font.value;
  const rootFontSize = (font.id==="nanumbrush" || font.id==="nanumpen") ? 15 : 14;
  const org = "#FF6B35"; const grn = "#22C55E";

  const SL  = ({children}) => <div style={{fontSize:11,color:sub,fontWeight:700,letterSpacing:1.1,textTransform:"uppercase",marginBottom:12,fontFamily:F}}>{children}</div>;
  const Crd = ({children,style={}}) => <div style={{background:crd,borderRadius:18,padding:18,border:`1px solid ${bdr}`,marginBottom:12,...style}}>{children}</div>;
  const TB  = ({id,icon,label}) => (
    <button onClick={()=>go(id)} style={{flex:1,background:"none",border:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:0,fontFamily:F}}>
      <div style={{fontSize:20,opacity:activeTab===id?1:0.28,transform:activeTab===id?"scale(1.15)":"scale(1)",transition:"all 0.2s"}}>{icon}</div>
      <div style={{fontSize:10,fontWeight:700,color:activeTab===id?org:"#444",transition:"color 0.2s",fontFamily:F}}>{label}</div>
    </button>
  );
  const Tog = ({on,cb}) => (
    <button onClick={cb} style={{width:48,height:28,borderRadius:14,border:"none",cursor:"pointer",background:on?`linear-gradient(135deg,${org},#FF3A6E)`:"#252525",position:"relative",transition:"background 0.3s",flexShrink:0}}>
      <div style={{position:"absolute",top:3,left:on?22:3,width:22,height:22,borderRadius:"50%",background:"#fff",transition:"left 0.3s",boxShadow:"0 1px 4px rgba(0,0,0,0.4)"}}/>
    </button>
  );

  // 날짜 input — 공통 스타일 (overflow fix)
  const dateInputStyle = {
    width:"100%", display:"block", boxSizing:"border-box",
    background:"#1A1A1C", border:`1px solid ${bdr}`,
    borderRadius:13, padding:"12px 16px",
    color:"#fff", fontSize:14, fontWeight:600, fontFamily:F,
    WebkitAppearance:"none", appearance:"none",
  };

  const pageTitle = () => {
    if(activeTab==="home")                       return "Jinho Fit 💪";
    if(activeTab==="record"&&subView===null)     return "운동 기록";
    if(activeTab==="record"&&subView==="add")    return "새 기록 입력";
    if(activeTab==="record"&&subView==="detail") return "기록 상세";
    if(activeTab==="workout"&&workoutDone)       return "운동 완료! 🎉";
    if(activeTab==="workout")                    return "운동 중 🔥";
    if(activeTab==="golf"&&subView===null)       return "골프";
    if(activeTab==="golf"&&subView==="card")     return "스코어카드";
    if(activeTab==="settings")                   return "설정";
    return "";
  };

  const filtered = records.filter(r => recFilter==="all" || r.type===recFilter);

  return (
    <div style={{fontFamily:F,background:bg,minHeight:"100vh",color:tc,maxWidth:390,margin:"0 auto",position:"relative",overflow:"hidden",width:"100%",boxSizing:"border-box",fontSize:rootFontSize}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&family=Nanum+Pen+Script&family=Patrick+Hand&family=Gothic+A1:wght@400;600;700;900&family=Nunito:wght@400;600;700;800;900&display=swap');
        @keyframes fd{from{opacity:0;transform:translateX(-50%) translateY(-8px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
        @keyframes su{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pop{0%{transform:scale(0.85);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
        *{box-sizing:border-box!important;-webkit-tap-highlight-color:transparent}
        ::-webkit-scrollbar{display:none}
        input,textarea,select{outline:none}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none}
        input[type=date]{color-scheme:dark;-webkit-appearance:none;appearance:none;width:100%!important;max-width:100%!important}
      `}</style>

      {/* Toast */}
      {toast&&(
        <div style={{position:"fixed",top:56,left:"50%",transform:"translateX(-50%)",background:"rgba(18,18,20,0.97)",color:"#fff",padding:"11px 20px",borderRadius:13,fontSize:13,fontWeight:700,zIndex:9999,boxShadow:"0 4px 24px rgba(0,0,0,0.6)",border:"1px solid rgba(255,255,255,0.08)",animation:"fd 0.2s ease",whiteSpace:"nowrap",fontFamily:F}}>
          {toast}
        </div>
      )}


      {/* Workout Complete Modal */}
      {workoutDone&&activeTab==="workout"&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:28}}>
          <div style={{background:"#141414",borderRadius:26,padding:32,width:"100%",textAlign:"center",animation:"pop 0.4s ease",border:"1px solid #222"}}>
            <div style={{fontSize:64,marginBottom:12}}>🎉</div>
            <div style={{fontSize:26,fontWeight:900,fontFamily:F,marginBottom:6}}>운동 완료!</div>
            <div style={{fontSize:14,color:"#666",fontFamily:F,marginBottom:24}}>기록이 자동 저장됐어요 💪</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
              <div style={{background:"#1A1A1C",borderRadius:16,padding:18}}>
                <div style={{fontSize:26,fontWeight:900,color:org,fontFamily:F}}>{elapsed()}분</div>
                <div style={{fontSize:11,color:"#555",marginTop:4,fontFamily:F}}>운동 시간</div>
              </div>
              <div style={{background:"#1A1A1C",borderRadius:16,padding:18}}>
                <div style={{fontSize:26,fontWeight:900,color:grn,fontFamily:F}}>{totalSets()}세트</div>
                <div style={{fontSize:11,color:"#555",marginTop:4,fontFamily:F}}>총 세트</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <button onClick={()=>{setWorkoutDone(false);setExCounters({});startTime.current=new Date();go("record");}} style={{padding:14,background:"#1A1A1C",border:`1px solid ${bdr}`,borderRadius:14,color:"#aaa",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>📋 기록 보기</button>
              <button onClick={()=>{setWorkoutDone(false);setExCounters({});startTime.current=new Date();go("home");}} style={{padding:14,background:`linear-gradient(135deg,${org},#FF3A6E)`,border:"none",borderRadius:14,color:"#fff",fontSize:13,fontWeight:800,cursor:"pointer",fontFamily:F}}>🏠 홈으로</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{padding:"52px 22px 0",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:12,color:sub,fontWeight:600,letterSpacing:0.4,fontFamily:F}}>{new Date().toLocaleDateString("ko-KR",{month:"long",day:"numeric",weekday:"short"})}</div>
          <div style={{fontSize:23,fontWeight:800,marginTop:4,letterSpacing:-0.5,fontFamily:F}}>{pageTitle()}</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          {activeTab==="golf"&&(
            <button onClick={()=>setLightMode(p=>!p)} style={{width:36,height:36,borderRadius:"50%",background:lightMode?"#FBBF24":"#1E1E20",border:"none",fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
              {lightMode?"🌙":"☀️"}
            </button>
          )}
          <button onClick={()=>go("settings")} style={{width:40,height:40,borderRadius:"50%",background:"linear-gradient(135deg,#FF6B35,#FF3A6E)",border:"none",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,cursor:"pointer",color:"#fff",flexShrink:0}}>J</button>
        </div>
      </div>

      {/* Content */}
      <div style={{padding:"18px 0 100px",overflowY:"auto",overflowX:"hidden",maxHeight:"calc(100vh - 118px)"}}>

        {/* HOME */}
        {activeTab==="home"&&subView===null&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:22}}>
              {[{l:"이번달",v:`${monthlyCount}회`,c:org},{l:"총 시간",v:totalTimeLabel,c:grn},{l:"연속",v:`${currentStreak}일`,c:"#60A5FA"}].map(s=>(
                <div key={s.l} style={{background:crd,borderRadius:16,padding:"16px 12px",border:`1px solid ${bdr}`}}>
                  <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:F}}>{s.v}</div>
                  <div style={{fontSize:11,color:sub,marginTop:4,fontWeight:600,fontFamily:F}}>{s.l}</div>
                </div>
              ))}
            </div>
            <SL>빠른 시작</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
              <button onClick={()=>go("workout")} style={{background:"linear-gradient(135deg,#FF6B35,#FF3A6E)",border:"none",borderRadius:18,padding:"20px 16px",color:"#fff",cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:28,marginBottom:8}}>🦁</div>
                <div style={{fontSize:16,fontWeight:800,fontFamily:F}}>헬스</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:2,fontFamily:F}}>웨이트 트레이닝</div>
              </button>
              <button onClick={()=>go("golf")} style={{background:"linear-gradient(135deg,#1A6B3C,#22C55E)",border:"none",borderRadius:18,padding:"20px 16px",color:"#fff",cursor:"pointer",textAlign:"left"}}>
                <div style={{fontSize:28,marginBottom:8}}>⛳</div>
                <div style={{fontSize:16,fontWeight:800,fontFamily:F}}>골프</div>
                <div style={{fontSize:12,opacity:0.8,marginTop:2,fontFamily:F}}>스코어 & 연습</div>
              </button>
            </div>
            <SL>최근 운동</SL>
            {records.slice(0,2).map(r=>(
              <div key={r.id} onClick={()=>{setSelRec(r);setActiveTab("record");setSubView("detail");}} style={{background:crd,borderRadius:16,padding:15,border:`1px solid ${bdr}`,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"pointer"}}>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <div style={{width:42,height:42,borderRadius:12,background:r.type==="health"?"rgba(255,107,53,0.15)":"rgba(34,197,94,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{getIcon(r.type,r.subType)}</div>
                  <div>
                    <div style={{fontSize:14,fontWeight:700,fontFamily:F}}>{r.title}</div>
                    <div style={{fontSize:11,color:sub,marginTop:2,fontFamily:F}}>{fmtDate(r.date)} · {r.duration}</div>
                  </div>
                </div>
                <div style={{color:"#333",fontSize:20}}>›</div>
              </div>
            ))}
          </div>
        )}

        {/* RECORD LIST */}
        {activeTab==="record"&&subView===null&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <button onClick={()=>setSubView("add")} style={{width:"100%",padding:15,background:`linear-gradient(135deg,${org},#FF3A6E)`,border:"none",borderRadius:16,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:14,fontFamily:F}}>+ 새 운동 기록 입력</button>
            <div style={{display:"flex",gap:8,marginBottom:16}}>
              {[{id:"all",label:"전체"},{id:"health",label:"🦁 헬스"},{id:"golf",label:"⛳ 골프"}].map(f=>(
                <button key={f.id} onClick={()=>setRecFilter(f.id)} style={{padding:"7px 14px",borderRadius:20,border:"none",background:recFilter===f.id?org:"#1E1E20",color:recFilter===f.id?"#fff":"#555",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F,transition:"all 0.2s"}}>{f.label}</button>
              ))}
            </div>
            {filtered.map(r=>(
              <Crd key={r.id}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <div style={{width:44,height:44,borderRadius:13,background:r.type==="health"?"rgba(255,107,53,0.15)":"rgba(34,197,94,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{getIcon(r.type,r.subType)}</div>
                    <div>
                      <div style={{fontSize:15,fontWeight:700,fontFamily:F}}>{r.title}</div>
                      <div style={{fontSize:11,color:sub,marginTop:2,fontFamily:F}}>{fmtDate(r.date)} · {r.duration}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setSelRec(r);setSubView("detail");}} style={{background:"none",border:`1px solid ${bdr}`,borderRadius:9,padding:"5px 12px",color:"#666",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F,flexShrink:0}}>상세</button>
                    <button onClick={()=>deleteRec(r.id)} style={{background:"none",border:`1px solid ${bdr}`,borderRadius:9,padding:"5px 12px",color:"#FF6B35",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F,flexShrink:0}}>삭제</button>
                  </div>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                  {r.exercises.map(e=><span key={e.name} style={{background:"#1E1E20",borderRadius:8,padding:"4px 10px",fontSize:11,color:"#888",fontWeight:600,fontFamily:F}}>{e.name}</span>)}
                </div>
                <button onClick={()=>handleStartWorkout(r)} style={{width:"100%",padding:12,background:r.type==="health"?"rgba(255,107,53,0.1)":"rgba(34,197,94,0.1)",border:`1px solid ${r.type==="health"?"rgba(255,107,53,0.25)":"rgba(34,197,94,0.25)"}`,borderRadius:12,color:r.type==="health"?org:grn,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>
                  이 운동 오늘 그대로 시작하기 →
                </button>
              </Crd>
            ))}
          </div>
        )}

        {/* ADD RECORD — ① 날짜 overflow 완전 고정 */}
        {activeTab==="record"&&subView==="add"&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <button onClick={()=>setSubView(null)} style={{background:"none",border:"none",color:org,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:16,padding:0,fontFamily:F}}>← 뒤로</button>

            <SL>운동 종류</SL>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:20}}>
              {[{id:"upper",type:"health",icon:"🦁",label:"상체"},{id:"lower",type:"health",icon:"🐘",label:"하체"},{id:"",type:"golf",icon:"⛳",label:"골프"}].map(t=>{
                const active = newRec.type===t.type&&(t.type==="golf"||newRec.subType===t.id);
                return (
                  <button key={t.id+t.type} onClick={()=>setNewRec(p=>({...p,type:t.type,subType:t.id}))} style={{padding:"12px 6px",background:active?(t.type==="health"?"rgba(255,107,53,0.15)":"rgba(34,197,94,0.15)"):"#1A1A1C",border:`1px solid ${active?(t.type==="health"?org:grn):"#2a2a2a"}`,borderRadius:14,color:active?(t.type==="health"?org:grn):"#555",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F}}>
                    <span style={{marginRight:4}}>{t.icon}</span>{t.label}
                  </button>
                );
              })}
            </div>

            <SL>날짜</SL>
            {/* ① 날짜 wrapper로 감싸서 overflow 완전 차단 */}
            <div style={{width:"100%",overflow:"hidden",marginBottom:20}}>
              <input type="date" value={newRec.date}
                onChange={e=>setNewRec(p=>({...p,date:e.target.value}))}
                style={dateInputStyle}/>
            </div>

            <SL>루틴 이름</SL>
            <input value={newRec.title} onChange={e=>setNewRec(p=>({...p,title:e.target.value}))} placeholder="예: 상체 루틴, 하체 데이..."
              style={{width:"100%",background:"#1A1A1C",border:`1px solid ${bdr}`,borderRadius:13,padding:"13px 16px",color:"#fff",fontSize:16,fontWeight:600,marginBottom:20,fontFamily:F}}/>

            <SL>⭐ 즐겨찾기 종목</SL>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:20}}>
              {favs.map(name=>(
                <button key={name} onClick={()=>addFav(name)} style={{padding:"7px 12px",background:"rgba(255,107,53,0.1)",border:"1px solid rgba(255,107,53,0.25)",borderRadius:20,color:org,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>+ {name}</button>
              ))}
            </div>

            <SL>운동 목록</SL>
            {newRec.exercises.map((ex,ei)=>(
              <Crd key={ei} style={{padding:"14px"}}>
                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                  <input value={ex.name} onChange={e=>upName(ei,e.target.value)} placeholder="운동 이름"
                    style={{flex:1,minWidth:0,background:"#1E1E20",border:"none",borderRadius:10,padding:"10px 12px",color:newRec.type==="health"?org:grn,fontSize:13,fontWeight:700,fontFamily:F}}/>
                  <button onClick={()=>togFav(ex.name)} style={{background:"none",border:"none",fontSize:16,cursor:"pointer",flexShrink:0,padding:"4px"}}>
                    {favs.includes(ex.name)?"⭐":"☆"}
                  </button>
                </div>
                {ex.sets.map((set,si)=>(
                  <div key={si} style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <span style={{fontSize:11,color:"#444",fontWeight:700,fontFamily:F,flexShrink:0,width:24}}>S{si+1}</span>
                    {newRec.type==="health"?(
                      <>
                        <input value={set.weight} onChange={e=>upSet(ei,si,"weight",e.target.value)} placeholder="kg" type="number"
                          style={{flex:1,minWidth:0,background:"#1E1E20",border:`1px solid #2a2a2a`,borderRadius:9,padding:"9px 4px",color:"#fff",fontSize:13,fontWeight:600,textAlign:"center",fontFamily:F}}/>
                        <span style={{color:"#333",fontSize:11,flexShrink:0}}>×</span>
                        <input value={set.reps} onChange={e=>upSet(ei,si,"reps",e.target.value)} placeholder="횟수" type="number"
                          style={{flex:1,minWidth:0,background:"#1E1E20",border:`1px solid #2a2a2a`,borderRadius:9,padding:"9px 4px",color:"#fff",fontSize:13,fontWeight:600,textAlign:"center",fontFamily:F}}/>
                        <span style={{color:"#444",fontSize:11,flexShrink:0,fontFamily:F}}>회</span>
                      </>
                    ):(
                      <input value={set.reps} onChange={e=>upSet(ei,si,"reps",e.target.value)} placeholder="횟수 / 메모"
                        style={{flex:1,minWidth:0,background:"#1E1E20",border:`1px solid #2a2a2a`,borderRadius:9,padding:"9px 10px",color:"#fff",fontSize:13,fontFamily:F}}/>
                    )}
                  </div>
                ))}
                <button onClick={()=>addSet(ei)} style={{background:"none",border:`1px dashed #2a2a2a`,borderRadius:9,padding:"8px",color:"#555",fontSize:12,fontWeight:700,cursor:"pointer",width:"100%",fontFamily:F}}>+ 세트 추가</button>
              </Crd>
            ))}
            <button onClick={addEx} style={{width:"100%",padding:13,background:"#141414",border:`1px dashed #2a2a2a`,borderRadius:14,color:"#555",fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:20,fontFamily:F}}>+ 운동 추가</button>
            <button onClick={saveRec} style={{width:"100%",padding:16,background:`linear-gradient(135deg,${org},#FF3A6E)`,border:"none",borderRadius:16,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 24px rgba(255,107,53,0.3)",fontFamily:F}}>💾 저장하기</button>
          </div>
        )}

        {/* RECORD DETAIL */}
        {activeTab==="record"&&subView==="detail"&&selRec&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <button onClick={()=>setSubView(null)} style={{background:"none",border:"none",color:org,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:16,padding:0,fontFamily:F}}>← 목록으로</button>
            <Crd>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
                <div>
                  <div style={{fontSize:20,fontWeight:800,fontFamily:F}}>{selRec.title}</div>
                  <div style={{fontSize:12,color:sub,marginTop:4,fontFamily:F}}>{fmtDate(selRec.date)} · {selRec.duration}</div>
                </div>
                <div style={{fontSize:36}}>{getIcon(selRec.type,selRec.subType)}</div>
              </div>
              {selRec.exercises.map((ex,i)=>(
                <div key={i} style={{marginBottom:14,paddingBottom:14,borderBottom:i<selRec.exercises.length-1?`1px solid ${bdr}`:"none"}}>
                  <div style={{fontSize:13,fontWeight:700,marginBottom:8,color:selRec.type==="health"?org:grn,fontFamily:F}}>{ex.name}</div>
                  {ex.sets.map((set,si)=>(
                    <div key={si} style={{display:"flex",alignItems:"center",gap:10,marginBottom:6,background:"#1A1A1C",borderRadius:9,padding:"8px 12px"}}>
                      <span style={{fontSize:11,color:"#444",fontWeight:700,width:20,fontFamily:F}}>S{si+1}</span>
                      {set.weight!==null?(
                        <span style={{fontSize:13,fontWeight:600,fontFamily:F}}>{set.weight}kg × {set.reps}회</span>
                      ):(
                        <span style={{fontSize:12,color:"#777",fontFamily:F}}>{set.reps}회 {set.note&&`· ${set.note}`}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </Crd>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:14}}>
              <button onClick={()=>deleteRec(selRec.id)} style={{padding:15,background:"#1A1A1C",border:"1px solid "+bdr,borderRadius:16,color:"#FF6B35",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:F}}>🗑️ 삭제</button>
              <button onClick={()=>handleStartWorkout(selRec)} style={{padding:15,background:selRec.type==="health"?"linear-gradient(135deg,"+org+",#FF3A6E)":"linear-gradient(135deg,#1A6B3C,#22C55E)",border:"none",borderRadius:16,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",fontFamily:F}}>
                오늘 이 루틴 그대로 시작하기 🚀
              </button>
            </div>
          </div>
        )}

        {/* WORKOUT */}
        {activeTab==="workout"&&!workoutDone&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <Crd>
              <SL>휴식 타이머</SL>
              <div style={{display:"flex",justifyContent:"center",marginBottom:16}}>
                <div style={{position:"relative",width:120,height:120}}>
                  <svg width="120" height="120" style={{transform:"rotate(-90deg) scale(-1,1)",transformOrigin:"center"}}>
                    <circle cx="60" cy="60" r="52" fill="none" stroke="#1E1E20" strokeWidth="7"/>
                    <circle cx="60" cy="60" r="52" fill="none" stroke={timerOn?org:"#333"} strokeWidth="7"
                      strokeDasharray={2*Math.PI*52}
                      strokeDashoffset={(2*Math.PI*52)*(1-pct/100)}
                      strokeLinecap="round" style={{transition:"stroke-dashoffset 0.8s ease,stroke 0.3s"}}/>
                  </svg>
                  <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontSize:26,fontWeight:800,color:timerOn?org:"#fff",letterSpacing:-1,fontFamily:F}}>{fmt(timerDisp)}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:14}}>
                {[30,60,90,120,180].map(s=>(
                  <button key={s} onClick={()=>{setTimerSec(s);setTimerDisp(s);setTimerOn(false);clearInterval(timerRef.current);}} style={{background:timerSec===s?org:"#1E1E20",border:"none",borderRadius:10,padding:"7px 13px",color:timerSec===s?"#fff":"#666",fontSize:12,fontWeight:700,cursor:"pointer",transition:"all 0.2s",fontFamily:F}}>{s}초</button>
                ))}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                <button onClick={()=>{if(!timerOn){setTimerDisp(timerSec);setTimerOn(true);}}} style={{padding:13,borderRadius:13,border:"none",background:timerOn?"#1A1A1C":"linear-gradient(135deg,"+org+",#FF3A6E)",color:timerOn?"#444":"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>▶ 시작</button>
                <button onClick={()=>{setTimerOn(false);clearInterval(timerRef.current);setTimerDisp(timerSec);}} style={{padding:13,borderRadius:13,border:"1px solid "+bdr,background:"transparent",color:"#666",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:F}}>■ 초기화</button>
              </div>
            </Crd>
            {workoutExercises.length===0 ? (
              <Crd style={{textAlign:"center"}}>
                <div style={{fontSize:18,fontWeight:800,fontFamily:F,marginBottom:10}}>운동 루틴이 없습니다.</div>
                <div style={{fontSize:13,color:sub,lineHeight:1.6,marginBottom:20,fontFamily:F}}>먼저 기록 탭에서 루틴을 선택하거나 새 운동 기록을 추가해주세요.</div>
                <button onClick={()=>go("record")} style={{padding:14,width:"100%",background:`linear-gradient(135deg,${org},#FF3A6E)`,border:"none",borderRadius:16,color:"#fff",fontSize:14,fontWeight:800,cursor:"pointer",fontFamily:F}}>기록 탭으로 이동</button>
              </Crd>
            ) : (
              <div>
                <Crd>
                  <SL>종목별 세트 카운터</SL>
                  {workoutExercises.map((ex,i)=>{
                    const cnt = exCounters[ex.id]||0;
                    const targetRaw = ex.target !== undefined ? ex.target : ex.sets.length;
                    const target = Number(targetRaw) || ex.sets.length;
                    const done = cnt>=target;
                    return (
                      <div key={ex.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 0",borderBottom:i<workoutExercises.length-1?"1px solid "+bdr:"none"}}>
                        <div style={{width:"65%"}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <input type="text" value={ex.name} onChange={e=>updateWorkoutExercise(ex.id,"name",e.target.value)} placeholder="운동명 입력"
                              style={{width:"100%",background:"#1A1A1C",border:`1px solid ${bdr}`,borderRadius:11,padding:"8px 10px",color:done?grn:tc,fontSize:16,fontFamily:F}}/>
                            <button onClick={()=>removeWorkoutExercise(ex.id)} style={{padding:"6px 10px",background:"none",border:"1px solid #FF6B35",borderRadius:10,color:"#FF6B35",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F}}>삭제</button>
                          </div>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:8}}>
                            <span style={{fontSize:11,color:sub,fontFamily:F}}>목표 </span>
                            <input type="number" min={1} value={targetRaw} onChange={e=>updateWorkoutExercise(ex.id,"target",e.target.value)} onBlur={e=>{ if (e.target.value.trim()==="") updateWorkoutExercise(ex.id,"target",1); }}
                              style={{width:60,background:"#1A1A1C",border:`1px solid ${bdr}`,borderRadius:11,padding:"8px 10px",color:done?grn:tc,fontSize:16,fontFamily:F,textAlign:"center"}}/>
                            <span style={{fontSize:11,color:sub,fontFamily:F}}>세트</span>
                          </div>
                        </div>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                          <button onClick={()=>setExCounters(p=>({...p,[ex.id]:Math.max(0,cnt-1)}))} style={{width:34,height:34,borderRadius:10,border:"1px solid "+bdr,background:"#1A1A1C",color:"#fff",fontSize:18,fontWeight:300,cursor:"pointer"}}>-</button>
                          <span style={{fontSize:22,fontWeight:900,color:done?grn:org,fontFamily:F,minWidth:28,textAlign:"center"}}>{cnt}</span>
                          <button onClick={()=>setExCounters(p=>({...p,[ex.id]:cnt+1}))} style={{width:34,height:34,borderRadius:10,border:"none",background:"linear-gradient(135deg,"+org+",#FF3A6E)",color:"#fff",fontSize:18,cursor:"pointer"}}>+</button>
                        </div>
                      </div>
                    );
                  })}
                  <button onClick={addWorkoutExercise} style={{width:"100%",padding:14,background:"#141414",border:`1px dashed ${bdr}`,borderRadius:14,color:"#555",fontSize:13,fontWeight:700,cursor:"pointer",marginTop:14,fontFamily:F}}>+ 운동 추가</button>
                </Crd>
                <button onClick={finishWorkout} style={{width:"100%",padding:16,background:"linear-gradient(135deg,#1A6B3C,#22C55E)",border:"none",borderRadius:16,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 24px rgba(34,197,94,0.2)",fontFamily:F}}>
                  🏁 운동 완료 & 저장
                </button>
              </div>
            )}
          </div>
        )}

        {/* GOLF HOME */}
        {activeTab==="golf"&&subView===null&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:22}}>
              {[
                {l:"총 라운드", v:`${golfRoundCount}회`, c:grn},
                {l:"베스트", v:golfBestScore!==null?`${golfBestScore}타`:"-", c:"#60A5FA"},
                {l:"평균", v:golfAvgScore!==null?`${golfAvgScore}타`:"-", c:"#FBBF24"}
              ].map(s=>(
                <div key={s.l} style={{background:crd,borderRadius:16,padding:"16px 12px",border:`1px solid ${bdr}`}}>
                  <div style={{fontSize:22,fontWeight:800,color:s.c,fontFamily:F}}>{s.v}</div>
                  <div style={{fontSize:11,color:sub,marginTop:4,fontWeight:600,fontFamily:F}}>{s.l}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setSubView("card")} style={{width:"100%",padding:16,background:"linear-gradient(135deg,#1A6B3C,#22C55E)",border:"none",borderRadius:16,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",marginBottom:16,fontFamily:F,boxShadow:"0 8px 24px rgba(34,197,94,0.2)"}}>⛳ 새 라운드 스코어 입력</button>
            <SL>최근 라운드</SL>
            {golfRounds.length===0 ? (
              <div style={{background:crd,borderRadius:15,padding:20,color:sub,textAlign:"center"}}>저장된 라운드가 없습니다.</div>
            ) : golfRounds.map((r)=>(
              <div key={r.id} style={{background:crd,borderRadius:15,padding:"15px 18px",border:`1px solid ${bdr}`,marginBottom:10,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontSize:14,fontWeight:700,fontFamily:F,color:tc}}>{r.course}</div>
                  <div style={{fontSize:11,color:sub,marginTop:2,fontFamily:F}}>{fmtDate(r.date)}</div>
                </div>
                <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:8}}>
                  <div style={{fontSize:22,fontWeight:800,color:"#FBBF24",fontFamily:F}}>{r.score}</div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <div style={{fontSize:11,color:sub,fontFamily:F}}>파 72 · {r.diff}</div>
                    <button onClick={()=>deleteGolfRound(r.id)} style={{background:"none",border:"1px solid #FF6B35",borderRadius:10,padding:"5px 10px",color:"#FF6B35",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:F}}>삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* GOLF SCORECARD */}
        {activeTab==="golf"&&subView==="card"&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <button onClick={()=>setSubView(null)} style={{background:"none",border:"none",color:grn,fontSize:13,fontWeight:700,cursor:"pointer",marginBottom:16,padding:0,fontFamily:F}}>← 뒤로</button>
            <Crd style={{border:`1px solid rgba(34,197,94,0.2)`}}>
              <SL>라운드 정보</SL>
              <div style={{width:"100%",marginBottom:10,minWidth:0}}>
                <input type="text" value={course} onChange={e=>setCourse(e.target.value)} placeholder="골프장 이름 입력"
                  style={{...dateInputStyle, width:"100%",maxWidth:"100%",minWidth:0, fontSize:16, background:isLight?"#F5F5F0":"#1A1A1C", color:tc, border:`1px solid ${course?"rgba(34,197,94,0.35)":bdr}`}}/>
              </div>
              <div style={{width:"100%",overflow:"hidden"}}>
                <input type="date" value={golfDate} onChange={e=>setGolfDate(e.target.value)}
                  style={{...dateInputStyle, background:isLight?"#F5F5F0":"#1A1A1C", color:tc}}/>
              </div>
            </Crd>

            <Crd style={{border:`1px solid rgba(34,197,94,0.15)`}}>
              <SL>스코어카드 사진</SL>
              <input type="file" accept="image/*" capture="environment" ref={photoRef} onChange={handlePhoto} style={{display:"none"}}/>
              <input type="file" accept="image/*" ref={galleryRef} onChange={handlePhoto} style={{display:"none"}}/>
              {golfPhoto?(
                <div style={{position:"relative"}}>
                  <img src={golfPhoto} alt="scorecard" style={{width:"100%",borderRadius:12,maxHeight:180,objectFit:"cover"}}/>
                  <button onClick={()=>setGolfPhoto(null)} style={{position:"absolute",top:8,right:8,background:"rgba(0,0,0,0.65)",border:"none",borderRadius:"50%",width:28,height:28,color:"#fff",fontSize:14,cursor:"pointer"}}>✕</button>
                </div>
              ):(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                  <button onClick={()=>photoRef.current?.click()} style={{padding:"16px 10px",background:"rgba(34,197,94,0.07)",border:`1px dashed rgba(34,197,94,0.3)`,borderRadius:13,color:grn,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,lineHeight:1.7}}>📷<br/><span style={{fontSize:11,opacity:0.8}}>카메라로 찍기</span></button>
                  <button onClick={()=>galleryRef.current?.click()} style={{padding:"16px 10px",background:"rgba(34,197,94,0.07)",border:`1px dashed rgba(34,197,94,0.3)`,borderRadius:13,color:grn,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:F,lineHeight:1.7}}>🖼️<br/><span style={{fontSize:11,opacity:0.8}}>갤러리에서 선택</span></button>
                </div>
              )}
            </Crd>

            <Crd>
              <SL>홀별 스코어</SL>
              {[{label:"전반",color:grn,from:0,to:9},{label:"후반",color:"#FBBF24",from:9,to:18}].map(({label,color,from,to})=>{
                const sTotal=scores.slice(from,to).reduce((s,h)=>s+(parseInt(h.score)||0),0);
                const pTotal=scores.slice(from,to).reduce((s,h)=>s+(parseInt(h.putts)||0),0);
                return(
                  <div key={label} style={{marginBottom:18}}>
                    <div style={{fontSize:11,color,fontWeight:700,marginBottom:8,letterSpacing:0.5,fontFamily:F}}>▸ {label} ({from+1}~{to}홀)</div>
                    <div style={{display:"grid",gridTemplateColumns:"32px repeat(9,1fr)",gap:3,marginBottom:4}}>
                      <div/>{Array.from({length:9},(_,k)=><div key={k} style={{fontSize:9,color:"#444",textAlign:"center",fontFamily:F}}>{from+k+1}H</div>)}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"32px repeat(9,1fr)",gap:3,marginBottom:4,alignItems:"center"}}>
                      <div style={{fontSize:9,color:sub,fontFamily:F}}>파</div>
                      {golfPars.slice(from,to).map((par,k)=>(
                        <select key={k} value={par} onChange={e=>upPar(from+k,e.target.value)} style={{width:"100%",background:isLight?"#E8EEE4":"#1E1E20",border:`1px solid ${isLight?"#ccc":"#2a2a2a"}`,borderRadius:7,padding:"5px 0",color:"#FBBF24",fontSize:11,fontWeight:700,textAlign:"center",fontFamily:F,cursor:"pointer"}}>
                          <option value="3">3</option><option value="4">4</option><option value="5">5</option>
                        </select>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"32px repeat(9,1fr)",gap:3,marginBottom:4,alignItems:"center"}}>
                      <div style={{fontSize:9,color:sub,fontFamily:F}}>타수</div>
                      {scores.slice(from,to).map((h,k)=>(
                        <input key={k} value={h.score} onChange={e=>upScore(from+k,"score",e.target.value)} type="number"
                          style={{width:"100%",background:isLight?"#E8EEE4":"#1E1E20",border:`1px solid ${isLight?"#ccc":"#2a2a2a"}`,borderRadius:7,padding:"7px 2px",color:scoreColor(h.score,golfPars[from+k]),fontSize:12,fontWeight:800,textAlign:"center",fontFamily:F}}/>
                      ))}
                    </div>
                    <div style={{display:"grid",gridTemplateColumns:"32px repeat(9,1fr)",gap:3,alignItems:"center"}}>
                      <div style={{fontSize:9,color:sub,fontFamily:F}}>퍼트</div>
                      {scores.slice(from,to).map((h,k)=>(
                        <input key={k} value={h.putts} onChange={e=>upScore(from+k,"putts",e.target.value)} type="number"
                          style={{width:"100%",background:isLight?"#DDE8D8":"#1A1A1C",border:`1px solid ${isLight?"#bbb":"#252525"}`,borderRadius:7,padding:"5px 2px",color:"#60A5FA",fontSize:11,fontWeight:700,textAlign:"center",fontFamily:F}}/>
                      ))}
                    </div>
                    <div style={{fontSize:11,color:sub,textAlign:"right",marginTop:8,fontFamily:F}}>
                      {label}: <span style={{color:tc,fontWeight:700}}>{sTotal||"-"}</span>
                      <span style={{marginLeft:10}}>퍼트: <span style={{color:"#60A5FA",fontWeight:700}}>{pTotal||"-"}</span></span>
                    </div>
                  </div>
                );
              })}
              <div style={{background:isLight?"#EAF2E6":"#1A1A1C",borderRadius:13,padding:"14px 16px",marginTop:4}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:totalPutts>0?10:0}}>
                  <span style={{fontSize:13,fontWeight:700,color:sub,fontFamily:F}}>총 스코어</span>
                  <div>
                    <span style={{fontSize:28,fontWeight:900,color:"#FBBF24",fontFamily:F}}>{totalScore||"-"}</span>
                    {totalScore>0&&<span style={{fontSize:13,fontWeight:700,color:diff<0?grn:diff===0?"#60A5FA":org,marginLeft:8,fontFamily:F}}>{diff>=0?"+":""}{diff}</span>}
                  </div>
                </div>
                {totalPutts>0&&(
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:sub,fontFamily:F}}>총 퍼트</span>
                    <span style={{fontSize:18,fontWeight:800,color:"#60A5FA",fontFamily:F}}>{totalPutts}</span>
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:14,marginTop:12}}>
                {[{c:grn,l:"버디↓"},{c:"#60A5FA",l:"파"},{c:org,l:"보기↑"}].map(x=>(
                  <div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:x.c}}/>
                    <span style={{fontSize:10,color:sub,fontFamily:F}}>{x.l}</span>
                  </div>
                ))}
              </div>
            </Crd>

            <Crd>
              <SL>메모</SL>
              <textarea value={golfNote} onChange={e=>setGolfNote(e.target.value)} placeholder="오늘 라운드 메모..." rows={3}
                style={{width:"100%",background:isLight?"#F0F4EE":"#1A1A1C",border:`1px solid ${isLight?"#ccc":"#2a2a2a"}`,borderRadius:11,padding:"12px 14px",color:tc,fontSize:13,resize:"none",fontFamily:F}}/>
            </Crd>

            <button onClick={()=>{toast2("⛳ 스코어카드 저장됐어요!");setSubView(null);}} style={{width:"100%",padding:16,background:"linear-gradient(135deg,#1A6B3C,#22C55E)",border:"none",borderRadius:16,color:"#fff",fontSize:15,fontWeight:800,cursor:"pointer",boxShadow:"0 8px 24px rgba(34,197,94,0.2)",fontFamily:F}}>저장하기</button>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab==="settings"&&(
          <div style={{padding:"0 20px",animation:"su 0.3s ease"}}>
            <Crd>
              <div style={{display:"flex",alignItems:"center",gap:14}}>
                <div style={{width:54,height:54,borderRadius:"50%",background:`linear-gradient(135deg,${org},#FF3A6E)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,fontWeight:700,color:"#fff"}}>J</div>
                <div>
                  <div style={{fontSize:18,fontWeight:800,fontFamily:F}}>Jinho</div>
                  <div style={{fontSize:12,color:sub,marginTop:2,fontFamily:F}}>🦁 헬스 · ⛳ 골프 · 4일 연속 🔥</div>
                </div>
              </div>
            </Crd>
            <SL>글씨체</SL>
            <Crd>
              {FONTS.map((f,i)=>(
                <button key={f.id} onClick={()=>setFont(f)} style={{width:"100%",display:"flex",justifyContent:"space-between",alignItems:"center",padding:"13px 4px",background:"none",border:"none",borderBottom:i<FONTS.length-1?`1px solid ${bdr}`:"none",cursor:"pointer"}}>
                  <div>
                    <span style={{fontSize:15,color:font.id===f.id?"#fff":"#666",fontWeight:font.id===f.id?700:400,fontFamily:f.value}}>{f.label}</span>
                    <span style={{fontSize:12,color:"#444",marginLeft:8,fontFamily:f.value}}>가나다 Aa</span>
                  </div>
                  {font.id===f.id&&<div style={{width:8,height:8,borderRadius:"50%",background:org}}/>}
                </button>
              ))}
            </Crd>
            <SL>알림 설정</SL>
            <Crd>
              {[
                {id:"workout",icon:"🦁",label:"운동 리마인더",   sub2:"매일 오전 7시"},
                {id:"rest",   icon:"⏱", label:"휴식 타이머 진동",sub2:"타이머 종료 시 진동"},
                {id:"weekly", icon:"📊",label:"주간 리포트",    sub2:"매주 일요일 저녁"},
                {id:"golf",   icon:"⛳",label:"골프 라운드 알림",sub2:"라운드 1시간 전"},
              ].map((n,i,arr)=>(
                <div key={n.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 4px",borderBottom:i<arr.length-1?`1px solid ${bdr}`:"none"}}>
                  <div style={{display:"flex",alignItems:"center",gap:12}}>
                    <span style={{fontSize:20}}>{n.icon}</span>
                    <div>
                      <div style={{fontSize:14,fontWeight:600,fontFamily:F}}>{n.label}</div>
                      <div style={{fontSize:11,color:sub,marginTop:2,fontFamily:F}}>{n.sub2}</div>
                    </div>
                  </div>
                  <Tog on={notifs[n.id]} cb={()=>setNotifs(p=>({...p,[n.id]:!p[n.id]}))}/>
                </div>
              ))}
            </Crd>
            <div style={{textAlign:"center",color:"#2a2a2a",fontSize:11,marginTop:8,fontFamily:F}}>Jinho Fit v4.1 · Made with ❤️</div>
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:390,background:"rgba(8,8,8,0.96)",backdropFilter:"blur(24px)",borderTop:"1px solid #181818",display:"flex",padding:"11px 0 26px"}}>
        <TB id="home"     icon="⊙" label="홈"/>
        <TB id="record"   icon="◫" label="기록"/>
        <TB id="workout"  icon="▷" label="운동"/>
        <TB id="golf"     icon="⛳" label="골프"/>
        <TB id="settings" icon="◈" label="설정"/>
      </div>
    </div>
  );
}
