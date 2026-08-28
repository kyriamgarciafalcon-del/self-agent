'use client';

import { FormEvent, useState } from 'react';

type Item={id:number;time:string;title:string;detail:string;color:'blue'|'green'|'orange';done:boolean};
const initial:Item[]=[
  {id:1,time:'09:30',title:'项目周会',detail:'线上会议 · 45 分钟',color:'blue',done:true},
  {id:2,time:'12:20',title:'午饭后散步',detail:'健康 · 20 分钟',color:'green',done:false},
  {id:3,time:'15:00',title:'整理季度预算',detail:'专注时间 · 60 分钟',color:'blue',done:false},
  {id:4,time:'19:30',title:'给妈妈打电话',detail:'个人 · 提醒一次',color:'orange',done:false},
];
const dates=[{w:'一',d:24},{w:'二',d:25},{w:'三',d:26},{w:'四',d:27},{w:'五',d:28},{w:'六',d:29},{w:'日',d:30}];

export default function Home(){
  const [items,setItems]=useState(initial);
  const [day,setDay]=useState(28);
  const [open,setOpen]=useState(false);
  const [toast,setToast]=useState('');
  function notify(text:string){setToast(text);window.setTimeout(()=>setToast(''),2200)}
  function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);setItems(list=>[...list,{id:Date.now(),time:String(data.get('time')),title:String(data.get('title')),detail:'个人 · 提前 10 分钟提醒',color:'orange',done:false}].sort((a,b)=>a.time.localeCompare(b.time)));setOpen(false);setDay(28);notify('日程已添加')}
  return <main className="phone-app">
    <header className="app-header">
      <button className="round" aria-label="返回">‹</button>
      <div><span>日程与行动</span><h1>2026年8月</h1></div>
      <button className="round" aria-label="更多">•••</button>
    </header>

    <section className="calendar">
      <div className="week-title"><button aria-label="上一周">‹</button><strong>8月24日 — 30日</strong><button aria-label="下一周">›</button></div>
      <div className="dates">{dates.map(date=><button key={date.d} onClick={()=>setDay(date.d)} className={day===date.d?'active':''}><span>{date.w}</span><b>{date.d}</b>{date.d===28&&<i/>}</button>)}</div>
    </section>

    <section className="day-section">
      <div className="day-heading"><div><span>{day===28?'今天':`8月${day}日`} · 星期{dates.find(date=>date.d===day)?.w}</span><h2>{day===28?'今天安排得刚刚好':'这一天的安排'}</h2></div>{day===28&&<small>{items.filter(item=>item.done).length}/{items.length} 完成</small>}</div>
      {day===28?<div className="timeline">{items.map((item,index)=><article className={item.done?'done':''} key={item.id}><time>{item.time}</time><div className="track"><i className={item.color}/>{index<items.length-1&&<span/>}</div><button className="schedule-card" onClick={()=>setItems(list=>list.map(current=>current.id===item.id?{...current,done:!current.done}:current))}><div><strong>{item.title}</strong><small>{item.detail}</small></div><span className="check">{item.done?'✓':''}</span></button></article>)}</div>:<div className="empty"><span>○</span><h3>没有日程</h3><p>给这一天留点空白，或添加一件事。</p><button onClick={()=>setOpen(true)}>添加日程</button></div>}
    </section>

    <button className="add-button" onClick={()=>setOpen(true)} aria-label="新建日程">＋</button>
    <nav className="bottom-nav" aria-label="主导航"><button className="active"><span>⌂</span>首页</button><button><span>＋</span>记录</button><button><span>✦</span>管家</button><button><span>▣</span>数据</button><button><span>○</span>我的</button></nav>

    {open&&<div className="overlay" role="dialog" aria-modal="true" onMouseDown={e=>e.currentTarget===e.target&&setOpen(false)}><form onSubmit={submit} className="sheet"><div className="handle"/><header><div><span>NEW SCHEDULE</span><h2>新建日程</h2></div><button type="button" onClick={()=>setOpen(false)}>×</button></header><label>日程名称<input required autoFocus name="title" placeholder="例如：准备周末徒步装备"/></label><div className="row"><label>日期<input value={`2026-08-${day}`} readOnly/></label><label>时间<input required name="time" type="time" defaultValue="10:00"/></label></div><label>提醒<select defaultValue="10"><option value="0">准时提醒</option><option value="10">提前 10 分钟</option><option value="30">提前 30 分钟</option></select></label><button className="save" type="submit">添加日程</button></form></div>}
    {toast&&<div className="toast">✓ {toast}</div>}
  </main>
}
