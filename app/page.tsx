"use client";
import { useEffect, useMemo, useState } from "react";

type Trade={time:string;side:"BUY"|"SELL";amount:number;result:"WIN"|"LOSS"|"PENDING"};

export default function Home(){
  const [ssid,setSsid]=useState("");
  const [connected,setConnected]=useState(false);
  const [auto,setAuto]=useState(false);
  const [pair,setPair]=useState("EUR/USD");
  const [duration,setDuration]=useState("5m");
  const [amount,setAmount]=useState(1);
  const [signal,setSignal]=useState<"BUY"|"SELL"|"WAIT">("WAIT");
  const [price,setPrice]=useState(1.08420);
  const [trades,setTrades]=useState<Trade[]>([]);
  const [tab,setTab]=useState("dashboard");

  useEffect(()=>{
    const id=setInterval(()=>{
      setPrice(p=>+(p+(Math.random()-.5)*.00025).toFixed(5));
      if(connected){
        const r=Math.random();
        setSignal(r>.58?"BUY":r<.42?"SELL":"WAIT");
      }
    },1200);
    return()=>clearInterval(id);
  },[connected]);

  const stats=useMemo(()=>{
    const done=trades.filter(t=>t.result!=="PENDING");
    const wins=done.filter(t=>t.result==="WIN").length;
    return {wins,losses:done.length-wins,rate:done.length?Math.round(wins/done.length*100):0};
  },[trades]);

  function connect(){
    if(!ssid.trim()) return alert("أدخل SSID لحساب Demo.");
    setConnected(true);
  }
  function openDemo(side:"BUY"|"SELL"){
    if(!connected) return alert("اتصل بحساب Demo أولًا.");
    const win=Math.random()>.35;
    setTrades(t=>[{time:new Date().toLocaleTimeString(),side,amount,result:win?"WIN":"LOSS"},...t].slice(0,20));
  }

  return <main>
    <header className="top">
      <div><b>PO BOT PRO</b><span className={connected?"ok":"off"}>● {connected?"Connected":"Demo Offline"}</span></div>
      <button className="icon" onClick={()=>setTab("settings")}>⚙</button>
    </header>

    {tab==="settings" ? <section className="panel">
      <h2>Demo Connection</h2>
      <p className="muted">أدخل SSID لحساب Demo الذي تملكه. لا تضعه في GitHub.</p>
      <input value={ssid} onChange={e=>setSsid(e.target.value)} placeholder="SSID..." type="password"/>
      <button className="primary" onClick={connect}>{connected?"CONNECTED":"CONNECT DEMO"}</button>
      <div className="notice">هذه النسخة لا تنفذ صفقات حقيقية. زر التداول يستخدم محاكاة Demo/Paper Trading إلى أن يتم ربط موصل تداول مصرح به.</div>
      <button className="secondary" onClick={()=>setTab("dashboard")}>← Dashboard</button>
    </section> : <>
      <section className="controls">
        <select value={pair} onChange={e=>setPair(e.target.value)}><option>EUR/USD</option><option>GBP/USD</option><option>USD/JPY</option><option>EUR/JPY</option></select>
        <select value={duration} onChange={e=>setDuration(e.target.value)}><option>1m</option><option>5m</option><option>15m</option></select>
        <input type="number" min="0.1" step="0.1" value={amount} onChange={e=>setAmount(+e.target.value)}/>
      </section>

      <section className="card chart">
        <div className="chartHead"><span>{pair}</span><strong>{price.toFixed(5)}</strong></div>
        <div className="candles">{Array.from({length:32}).map((_,i)=><i key={i} style={{height:(20+Math.random()*75)+"%"}}/> )}</div>
        <div className="chartFoot">EMA 9 · EMA 21 · RSI · Demo feed</div>
      </section>

      <section className="signal">
        <small>SIGNAL</small><h1 className={signal.toLowerCase()}>{signal}</h1>
        <div className="checks"><span>EMA ✓</span><span>RSI ✓</span><span>Trend ✓</span></div>
      </section>

      <section className="actions">
        <button className="buy" onClick={()=>openDemo("BUY")}>▲ BUY</button>
        <button className="sell" onClick={()=>openDemo("SELL")}>▼ SELL</button>
      </section>

      <section className="auto card">
        <div><b>AUTO TRADING</b><span>{auto?"Strategy armed":"Manual / Paper mode"}</span></div>
        <button className={auto?"toggle on":"toggle"} onClick={()=>setAuto(!auto)}><i/></button>
      </section>

      <section className="stats card">
        <div><b>{stats.wins}</b><span>Wins</span></div><div><b>{stats.losses}</b><span>Losses</span></div><div><b>{stats.rate}%</b><span>Win Rate</span></div>
      </section>

      <section className="card history"><h3>Recent Trades</h3>{trades.length===0?<p className="muted">No demo trades yet.</p>:trades.map((t,i)=><div className="trade" key={i}><span>{t.time}</span><b className={t.side==="BUY"?"buytxt":"selltxt"}>{t.side}</b><span>${t.amount.toFixed(2)}</span><strong className={t.result==="WIN"?"wintxt":"losstxt"}>{t.result}</strong></div>)}</section>

      <nav><button className="active">⌂<span>Dashboard</span></button><button onClick={()=>setTab("settings")}>⚙<span>Settings</span></button></nav>
    </>}
  </main>
}