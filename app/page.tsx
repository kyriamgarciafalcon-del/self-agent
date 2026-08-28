'use client';

import { FormEvent, useMemo, useState } from 'react';

type ScheduleItem = { id:number; time:string; title:string; meta:string; type:'work'|'health'|'life'; done?:boolean };

const initialSchedule: ScheduleItem[] = [
  { id:1, time:'09:30', title:'项目周会', meta:'线上会议 · 45 分钟', type:'work', done:true },
  { id:2, time:'12:20', title:'午饭后散步', meta:'目标 20 分钟', type:'health' },
  { id:3, time:'15:00', title:'整理季度预算', meta:'专注时间 · 60 分钟', type:'work' },
  { id:4, time:'19:30', title:'给妈妈打电话', meta:'个人 · 提醒一次', type:'life' },
];
const recordTypes = [
  { name:'随手记', icon:'✎', tone:'sage' }, { name:'饮食', icon:'♨', tone:'orange' },
  { name:'运动', icon:'⌁', tone:'blue' }, { name:'体重', icon:'◇', tone:'violet' },
  { name:'支出', icon:'¥', tone:'gold' }, { name:'心情', icon:'☺', tone:'rose' },
];
const days = [{week:'一',day:24},{week:'二',day:25},{week:'三',day:26},{week:'四',day:27},{week:'五',day:28},{week:'六',day:29},{week:'日',day:30}];

export default function Home() {
  const [schedule,setSchedule]=useState(initialSchedule);
  const [recordOpen,setRecordOpen]=useState(false);
  const [eventOpen,setEventOpen]=useState(false);
  const [selectedType,setSelectedType]=useState('随手记');
  const [recordText,setRecordText]=useState('');
  const [toast,setToast]=useState('');
  const [selectedDay,setSelectedDay]=useState(28);
  const [activeNav,setActiveNav]=useState('首页');
  const completed=useMemo(()=>schedule.filter(item=>item.done).length,[schedule]);
  function showToast(message:string){setToast(message);window.setTimeout(()=>setToast(''),2400)}
  function saveRecord(){if(!recordText.trim())return;showToast(`${selectedType}已记录，稍后会自动整理`);setRecordText('');setRecordOpen(false)}
  function addEvent(event:FormEvent<HTMLFormElement>){event.preventDefault();const data=new FormData(event.currentTarget);const title=String(data.get('title')||'新日程');const time=String(data.get('time')||'10:00');setSchedule(items=>[...items,{id:Date.now(),time,title,meta:'个人 · 提前 10 分钟提醒',type:'life'}].sort((a,b)=>a.time.localeCompare(b.time)));setEventOpen(false);showToast('日程已添加')}
  const navItems=[['首页','⌂'],['记录','＋'],['管家','✦'],['数据','▥'],['我的','○']];

  return <main className="app-shell">
    <aside className="side-nav" aria-label="主导航">
      <button className="brand" aria-label="Self Agent 首页"><span>sa</span></button>
      <nav>{navItems.map(([label,icon])=><button key={label} onClick={()=>label==='记录'?setRecordOpen(true):setActiveNav(label)} className={activeNav===label?'active':''}><span className="nav-icon">{icon}</span><span>{label}</span></button>)}</nav>
      <button className="avatar" aria-label="个人资料">林</button>
    </aside>
    <section className="workspace">
      <header className="topbar">
        <div className="mobile-brand"><span>sa</span><b>self agent</b></div>
        <div className="greeting"><span className="eyebrow">8月28日 · 星期五</span><h1>早上好，林然</h1></div>
        <div className="top-actions"><button className="icon-button" aria-label="搜索">⌕</button><button className="icon-button notification" aria-label="通知">♢<i /></button><button className="primary-button" onClick={()=>setRecordOpen(true)}><span>＋</span> 快速记录</button></div>
      </header>
      <div className="content-grid">
        <section className="calendar-panel">
          <div className="section-heading"><div><span className="eyebrow">日程与行动</span><h2>今天安排得刚刚好</h2><p>4 项日程，预计占用 3 小时 5 分钟</p></div><button className="secondary-button" onClick={()=>setEventOpen(true)}>＋ 新建日程</button></div>
          <div className="week-strip" aria-label="本周日期"><button className="week-arrow" aria-label="上一周">‹</button>{days.map(day=><button key={day.day} onClick={()=>setSelectedDay(day.day)} className={selectedDay===day.day?'selected':''}><span>{day.week}</span><strong>{day.day}</strong>{day.day===28&&<i/>}</button>)}<button className="week-arrow" aria-label="下一周">›</button></div>
          <div className="schedule-header"><h3>{selectedDay===28?'今天':`8月${selectedDay}日`}</h3><div><span className="legend work"/>工作 <span className="legend health"/>健康 <span className="legend life"/>生活</div></div>
          {selectedDay===28?<div className="timeline">{schedule.map((item,index)=><article className={`event-row ${item.done?'done':''}`} key={item.id}><time>{item.time}</time><div className="line"><span className={item.type}/>{index<schedule.length-1&&<i/>}</div><button className="event-card" onClick={()=>setSchedule(items=>items.map(current=>current.id===item.id?{...current,done:!current.done}:current))}><span className={`event-tag ${item.type}`}>{item.type==='work'?'工作':item.type==='health'?'健康':'生活'}</span><strong>{item.title}</strong><small>{item.meta}</small><span className="check">{item.done?'✓':''}</span></button></article>)}</div>:<div className="empty-day"><span>☼</span><h3>这一天还没有安排</h3><p>留点空白也很好，或添加一件想做的事。</p><button onClick={()=>setEventOpen(true)}>添加日程</button></div>}
        </section>
        <aside className="insight-panel">
          <section className="progress-card"><div className="card-title"><span className="spark">✦</span><div><strong>今日进度</strong><small>保持从容的节奏</small></div></div><div className="progress-ring" style={{'--progress':`${Math.round(completed/schedule.length*100)}%`} as React.CSSProperties}><div><strong>{completed}</strong><span>/ {schedule.length}</span><small>已完成</small></div></div><p>下一项：<b>{schedule.find(item=>!item.done)?.title||'今日计划已完成'}</b></p></section>
          <section className="ai-note"><span className="ai-label">✦ AI 建议</span><p>下午的专注任务后留有充足缓冲。可以把临时事项放在 17:00 后，避免打断预算整理。</p><button onClick={()=>showToast('建议已加入今天的安排')}>采纳建议</button></section>
          <section className="quick-card"><div className="card-title"><div><strong>快速记录</strong><small>记下此刻，不打断生活</small></div><button onClick={()=>setRecordOpen(true)}>全部记录</button></div><div className="record-grid">{recordTypes.slice(0,4).map(type=><button key={type.name} onClick={()=>{setSelectedType(type.name);setRecordOpen(true)}}><span className={type.tone}>{type.icon}</span>{type.name}</button>)}</div></section>
        </aside>
      </div>
    </section>
    <button className="floating-record" onClick={()=>setRecordOpen(true)} aria-label="快速记录">＋</button>
    <nav className="bottom-nav" aria-label="移动端主导航">{navItems.map(([label,icon])=><button key={label} onClick={()=>label==='记录'?setRecordOpen(true):setActiveNav(label)} className={activeNav===label?'active':''}><span>{icon}</span>{label}</button>)}</nav>
    {recordOpen&&<div className="overlay" role="dialog" aria-modal="true" aria-label="快速记录" onMouseDown={e=>e.currentTarget===e.target&&setRecordOpen(false)}><section className="record-sheet"><div className="sheet-handle"/><header><div><span className="eyebrow">QUICK CAPTURE</span><h2>快速记录</h2><p>先记下来，AI 会帮你归类整理</p></div><button onClick={()=>setRecordOpen(false)} aria-label="关闭">×</button></header><div className="type-picker">{recordTypes.map(type=><button key={type.name} onClick={()=>setSelectedType(type.name)} className={selectedType===type.name?'selected':''}><span className={type.tone}>{type.icon}</span>{type.name}</button>)}</div><div className="input-wrap"><textarea autoFocus value={recordText} onChange={event=>setRecordText(event.target.value)} placeholder={selectedType==='饮食'?'例如：午餐吃了番茄牛腩和半碗米饭…':selectedType==='支出'?'例如：打车 38 元…':'此刻有什么想记下的？'}/><div className="input-tools"><button aria-label="语音输入">⌁</button><button aria-label="添加图片">▧</button><span>{recordText.length} / 500</span></div></div><div className="privacy-note"><span>⌾</span><p><b>仅你可见</b><br/>内容将加密保存；密码、验证码和私钥不会发送给 AI。</p></div><button className="save-button" disabled={!recordText.trim()} onClick={saveRecord}>保存记录 <span>↵</span></button></section></div>}
    {eventOpen&&<div className="overlay" role="dialog" aria-modal="true" aria-label="新建日程" onMouseDown={e=>e.currentTarget===e.target&&setEventOpen(false)}><form className="event-modal" onSubmit={addEvent}><header><div><span className="eyebrow">NEW SCHEDULE</span><h2>新建日程</h2></div><button type="button" onClick={()=>setEventOpen(false)} aria-label="关闭">×</button></header><label>日程名称<input name="title" required autoFocus placeholder="准备周末徒步装备"/></label><div className="form-row"><label>日期<input value={`2026-08-${selectedDay}`} readOnly/></label><label>时间<input name="time" type="time" defaultValue="10:00"/></label></div><label>提醒<select defaultValue="10"><option value="0">准时提醒</option><option value="10">提前 10 分钟</option><option value="30">提前 30 分钟</option></select></label><div className="modal-actions"><button type="button" onClick={()=>setEventOpen(false)}>取消</button><button type="submit">添加日程</button></div></form></div>}
    {toast&&<div className="toast" role="status"><span>✓</span>{toast}</div>}
  </main>
}
