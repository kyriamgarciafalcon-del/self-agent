'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Tab = 'home' | 'schedule' | 'capture' | 'finance' | 'profile';
type ScheduleColor = 'blue' | 'green' | 'orange';
type TransactionKind = 'expense' | 'income';

type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  title: string;
  detail: string;
  color: ScheduleColor;
  done: boolean;
};

type Account = { id: string; name: string; type: string; balance: number; tone: 'forest' | 'clay' | 'ink' };
type Transaction = { id: string; kind: TransactionKind; amount: number; merchant: string; category: string; accountId: string; source: string; createdAt: string };
type AppData = { schedules: ScheduleItem[]; accounts: Account[]; transactions: Transaction[] };
type ExpenseDraft = { kind: 'expense'; amount: number; merchant: string; category: string; accountId: string; source: string };
type ScheduleDraft = { kind: 'schedule'; title: string; date: string; time: string };
type CaptureDraft = ExpenseDraft | ScheduleDraft;

const TODAY = '2026-08-28';
const STORAGE_KEY = 'self-agent:local-data:v1';
const dateOptions = [
  { weekday: '一', day: 24, value: '2026-08-24' }, { weekday: '二', day: 25, value: '2026-08-25' },
  { weekday: '三', day: 26, value: '2026-08-26' }, { weekday: '四', day: 27, value: '2026-08-27' },
  { weekday: '五', day: 28, value: TODAY }, { weekday: '六', day: 29, value: '2026-08-29' },
  { weekday: '日', day: 30, value: '2026-08-30' },
];

const seedData: AppData = {
  schedules: [
    { id: 's1', date: TODAY, time: '09:30', title: '项目周会', detail: '线上会议 · 45 分钟', color: 'blue', done: true },
    { id: 's2', date: TODAY, time: '12:20', title: '午饭后散步', detail: '健康 · 20 分钟', color: 'green', done: false },
    { id: 's3', date: TODAY, time: '15:00', title: '整理季度预算', detail: '专注时间 · 60 分钟', color: 'blue', done: false },
    { id: 's4', date: TODAY, time: '19:30', title: '给妈妈打电话', detail: '个人 · 提醒一次', color: 'orange', done: false },
  ],
  accounts: [
    { id: 'wechat', name: '微信余额', type: '资金账户', balance: 1280.55, tone: 'forest' },
    { id: 'alipay', name: '支付宝', type: '资金账户', balance: 830.2, tone: 'ink' },
    { id: 'bank', name: '日常银行卡', type: '储蓄卡', balance: 12600, tone: 'clay' },
    { id: 'credit', name: '信用卡', type: '待还款', balance: -2340, tone: 'ink' },
  ],
  transactions: [
    { id: 't1', kind: 'expense', amount: 36, merchant: '午餐', category: '餐饮', accountId: 'wechat', source: '手动记录', createdAt: '2026-08-28T12:31:00+08:00' },
    { id: 't2', kind: 'expense', amount: 18.5, merchant: '地铁出行', category: '交通', accountId: 'alipay', source: '通知草稿确认', createdAt: '2026-08-28T08:42:00+08:00' },
    { id: 't3', kind: 'income', amount: 4200, merchant: '项目回款', category: '收入', accountId: 'bank', source: '手动记录', createdAt: '2026-08-27T16:18:00+08:00' },
  ],
};

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: '首页', icon: '⌂' }, { id: 'schedule', label: '日程', icon: '□' },
  { id: 'capture', label: '记录', icon: '＋' }, { id: 'finance', label: '财务', icon: '▣' },
  { id: 'profile', label: '我的', icon: '○' },
];

function money(value: number) {
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function categoryFor(text: string) {
  if (/饭|餐|咖啡|奶茶|菜/.test(text)) return '餐饮';
  if (/车|地铁|公交|打车|加油/.test(text)) return '交通';
  if (/药|医院|挂号/.test(text)) return '医疗';
  if (/会员|订阅|话费|电费|水费/.test(text)) return '生活';
  return '其他';
}

function parseCapture(text: string): CaptureDraft {
  const amountMatch = text.match(/(?:¥|￥)?\s*(\d+(?:\.\d{1,2})?)/);
  const looksLikeExpense = Boolean(amountMatch) && /花|付|买|消费|微信|支付宝|元|块/.test(text);
  if (looksLikeExpense && amountMatch) {
    const source = /支付宝/.test(text) ? '支付宝' : /银行卡|银行/.test(text) ? '银行卡' : '微信';
    const accountId = source === '支付宝' ? 'alipay' : source === '银行卡' ? 'bank' : 'wechat';
    const merchant = text.replace(amountMatch[0], '').replace(/微信|支付宝|银行卡|银行|花了|花|支付|付款|消费|买了|买|元|块|用/g, '').trim() || '待补充商家';
    return { kind: 'expense', amount: Number(amountMatch[1]), merchant, category: categoryFor(text), accountId, source: '一句话记录' };
  }
  const timeMatch = text.match(/(\d{1,2})(?::|：|点)(\d{0,2})/);
  const hour = Math.min(Number(timeMatch?.[1] ?? 10), 23);
  const minute = Math.min(Number(timeMatch?.[2] || 0), 59);
  const title = text.replace(/今天|明天|后天/g, '').replace(/\d{1,2}(?::|：|点)\d{0,2}/, '').replace(/提醒我|提醒|安排|日程/g, '').trim() || '新日程';
  const date = /明天/.test(text) ? '2026-08-29' : /后天/.test(text) ? '2026-08-30' : TODAY;
  return { kind: 'schedule', title, date, time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` };
}

export default function Home() {
  const [data, setData] = useState<AppData>(seedData);
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [sheet, setSheet] = useState<'schedule' | 'transaction' | null>(null);
  const [toast, setToast] = useState('');
  const [captureText, setCaptureText] = useState('');
  const [draft, setDraft] = useState<CaptureDraft | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved) setData(JSON.parse(saved) as AppData); }
      catch { /* Corrupt local data should not prevent the app from opening. */ }
      finally { setHydrated(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data, hydrated]);
  useEffect(() => {
    function onPayment(event: Event) {
      const detail = (event as CustomEvent<Partial<ExpenseDraft>>).detail;
      setDraft({ kind: 'expense', amount: Number(detail.amount ?? 0), merchant: detail.merchant || '支付成功', category: detail.category || '其他', accountId: detail.accountId || 'wechat', source: detail.source || 'Android 支付通知' });
      setCaptureText('检测到一笔支付，请确认后保存'); setTab('capture');
    }
    window.addEventListener('self-agent:payment-detected', onPayment);
    return () => window.removeEventListener('self-agent:payment-detected', onPayment);
  }, []);

  const selectedSchedules = useMemo(() => data.schedules.filter((item) => item.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)), [data.schedules, selectedDate]);
  const todaySpend = useMemo(() => data.transactions.filter((item) => item.kind === 'expense' && item.createdAt.startsWith(TODAY)).reduce((sum, item) => sum + item.amount, 0), [data.transactions]);
  const totalBalance = useMemo(() => data.accounts.reduce((sum, item) => sum + item.balance, 0), [data.accounts]);
  const nextSchedule = data.schedules.find((item) => item.date === TODAY && !item.done);

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2200); }
  function toggleSchedule(id: string) { setData((current) => ({ ...current, schedules: current.schedules.map((item) => item.id === id ? { ...item, done: !item.done } : item) })); }
  function addSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const item: ScheduleItem = { id: uid('schedule'), title: String(form.get('title')), date: String(form.get('date')), time: String(form.get('time')), detail: `${String(form.get('detail') || '个人')} · 提前 10 分钟提醒`, color: 'orange', done: false };
    setData((current) => ({ ...current, schedules: [...current.schedules, item] })); setSelectedDate(item.date); setSheet(null); notify('日程已保存到本机');
  }
  function saveTransaction(input: ExpenseDraft & { transactionKind?: TransactionKind }) {
    const transactionKind = input.transactionKind ?? 'expense';
    const transaction: Transaction = { id: uid('transaction'), kind: transactionKind, amount: Math.abs(input.amount), merchant: input.merchant, category: transactionKind === 'income' ? '收入' : input.category, accountId: input.accountId, source: input.source, createdAt: new Date().toISOString() };
    setData((current) => ({ ...current, transactions: [transaction, ...current.transactions], accounts: current.accounts.map((account) => account.id === input.accountId ? { ...account, balance: account.balance + (transactionKind === 'income' ? transaction.amount : -transaction.amount) } : account) }));
  }
  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    saveTransaction({ kind: 'expense', amount: Number(form.get('amount')), merchant: String(form.get('merchant')), category: String(form.get('category')), accountId: String(form.get('accountId')), source: '手动记录', transactionKind: String(form.get('kind')) as TransactionKind });
    setSheet(null); notify('流水已确认入账');
  }
  function organizeCapture(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (captureText.trim()) setDraft(parseCapture(captureText.trim())); }
  function confirmDraft() {
    if (!draft) return;
    if (draft.kind === 'expense') {
      if (!draft.amount) { notify('请先补充金额'); return; }
      saveTransaction(draft); notify('已确认并记入账本');
    } else {
      setData((current) => ({ ...current, schedules: [...current.schedules, { id: uid('schedule'), title: draft.title, date: draft.date, time: draft.time, detail: '一句话记录 · 提前 10 分钟提醒', color: 'orange', done: false }] })); notify('已确认并加入日程');
    }
    setDraft(null); setCaptureText('');
  }
  function clearLocalData() {
    if (!window.confirm('确定恢复示例数据吗？本机新增的日程和账目会被清除。')) return;
    setData(seedData); window.localStorage.removeItem(STORAGE_KEY); notify('已恢复示例数据');
  }
  function pageTitle() { return tab === 'schedule' ? '日程与行动' : tab === 'capture' ? '快速记录' : tab === 'finance' ? '我的财务' : tab === 'profile' ? '本机管家' : '今天'; }

  return <main className="phone-app">
    <header className="app-header"><button className="round" aria-label="返回首页" onClick={() => setTab('home')}>‹</button><div><span>SELF AGENT · 本机优先</span><h1>{pageTitle()}</h1></div><button className="round status-dot" aria-label="本机保存状态"><i />•••</button></header>

    {tab === 'home' && <div className="page home-page">
      <section className="hero-card"><span>8月28日 · 星期五</span><h2>早上好，今天慢慢来。</h2><p>所有内容先整理、确认后再保存。</p></section>
      <section className="summary-grid"><button onClick={() => setTab('schedule')}><span>下一项 · {nextSchedule?.time ?? '空闲'}</span><strong>{nextSchedule?.title ?? '今天没有更多日程'}</strong><small>{data.schedules.filter((item) => item.date === TODAY && item.done).length}/{data.schedules.filter((item) => item.date === TODAY).length} 已完成</small></button><button onClick={() => setTab('finance')}><span>今日支出</span><strong>¥ {money(todaySpend)}</strong><small>净资产 ¥ {money(totalBalance)}</small></button></section>
      <section className="section-block"><div className="section-title"><div><span>QUICK CAPTURE</span><h2>一句话交给管家</h2></div></div><button className="capture-callout" onClick={() => setTab('capture')}><span>＋</span><div><strong>记录一件事</strong><small>例如“午饭 36 元，微信支付”</small></div><b>›</b></button></section>
      <section className="section-block"><div className="section-title"><div><span>RECENT</span><h2>最近入账</h2></div><button onClick={() => setTab('finance')}>查看全部</button></div><TransactionList items={data.transactions.slice(0, 3)} accounts={data.accounts} /></section>
    </div>}

    {tab === 'schedule' && <div className="page schedule-page"><section className="calendar"><div className="week-title"><button aria-label="上一周">‹</button><strong>2026年8月24日 — 30日</strong><button aria-label="下一周">›</button></div><div className="dates">{dateOptions.map((date) => <button key={date.value} onClick={() => setSelectedDate(date.value)} className={selectedDate === date.value ? 'active' : ''}><span>{date.weekday}</span><b>{date.day}</b>{date.value === TODAY && <i />}</button>)}</div></section><section className="day-section"><div className="day-heading"><div><span>{selectedDate === TODAY ? '今天' : `${Number(selectedDate.slice(-2))}日`} · 星期{dateOptions.find((date) => date.value === selectedDate)?.weekday}</span><h2>{selectedSchedules.length ? '今天安排得刚刚好' : '给这一天留点空白'}</h2></div><small>{selectedSchedules.filter((item) => item.done).length}/{selectedSchedules.length} 完成</small></div>{selectedSchedules.length ? <div className="timeline">{selectedSchedules.map((item, index) => <article className={item.done ? 'done' : ''} key={item.id}><time>{item.time}</time><div className="track"><i className={item.color} />{index < selectedSchedules.length - 1 && <span />}</div><button className="schedule-card" onClick={() => toggleSchedule(item.id)}><div><strong>{item.title}</strong><small>{item.detail}</small></div><span className="check">{item.done ? '✓' : ''}</span></button></article>)}</div> : <div className="empty"><span>○</span><h3>没有日程</h3><p>给这一天留点空白，或添加一件事。</p><button onClick={() => setSheet('schedule')}>添加日程</button></div>}</section></div>}

    {tab === 'capture' && <div className="page capture-page"><section className="capture-intro"><span>INBOX</span><h2>先说下来，我来整理。</h2><p>识别为日程或账目后，你确认才会保存。</p></section><form className="capture-box" onSubmit={organizeCapture}><textarea aria-label="一句话记录" maxLength={120} value={captureText} onChange={(event) => setCaptureText(event.target.value)} placeholder={'例如：明天 9 点提醒我交水电费\n或者：午饭 36 元，微信支付'} /><div><small>{captureText.length}/120</small><button type="submit">整理一下</button></div></form><div className="suggestion-row"><button onClick={() => setCaptureText('午饭 36 元，微信支付')}>午饭 36 元</button><button onClick={() => setCaptureText('明天 9 点提醒我交水电费')}>明天 9 点提醒</button></div>{draft && <section className="draft-card"><header><div><span>待确认 · {draft.kind === 'expense' ? '支出' : '日程'}</span><h3>我整理成这样</h3></div><button aria-label="取消草稿" onClick={() => setDraft(null)}>×</button></header>{draft.kind === 'expense' ? <div className="draft-fields"><label>金额<input inputMode="decimal" value={draft.amount || ''} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} /></label><label>商家 / 用途<input value={draft.merchant} onChange={(event) => setDraft({ ...draft, merchant: event.target.value })} /></label><label>分类<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option>餐饮</option><option>交通</option><option>生活</option><option>医疗</option><option>其他</option></select></label><label>账户<select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label></div> : <div className="draft-fields"><label>日程名称<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>日期<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label>时间<input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label></div>}<button className="confirm-button" onClick={confirmDraft}>确认保存</button></section>}</div>}

    {tab === 'finance' && <div className="page finance-page"><section className="balance-card"><span>净资产 · 已扣除待还款</span><h2>¥ {money(totalBalance)}</h2><div><small>今日支出 ¥ {money(todaySpend)}</small><button onClick={() => setSheet('transaction')}>＋ 记一笔</button></div></section><section className="section-block account-section"><div className="section-title"><div><span>ACCOUNTS</span><h2>我的账户</h2></div><small>{data.accounts.length} 个</small></div><div className="account-grid">{data.accounts.map((account) => <article className={account.tone} key={account.id}><span>{account.type}</span><h3>{account.name}</h3><strong>{account.balance < 0 ? '−' : ''}¥ {money(Math.abs(account.balance))}</strong></article>)}</div></section><section className="section-block"><div className="section-title"><div><span>LEDGER</span><h2>最近流水</h2></div></div><TransactionList items={data.transactions} accounts={data.accounts} /></section></div>}

    {tab === 'profile' && <div className="page profile-page"><section className="profile-heading"><div>SA</div><span>SELF AGENT</span><h2>数据留在你的设备上</h2><p>网页端保存日程和账本；系统权限将在 Android 版本中由你主动开启。</p></section><section className="settings-list"><article><span className="setting-icon">账</span><div><strong>支付通知记账</strong><small>Android 接入后：检测 → 整理 → 确认入账</small></div><b className="pending">待接入</b></article><article><span className="setting-icon">钥</span><div><strong>密码库与自动填充</strong><small>只通过系统 Autofill 保存，不在网页存明文</small></div><b className="safe">安全模式</b></article><article><span className="setting-icon">本</span><div><strong>本机数据</strong><small>{data.schedules.length} 条日程 · {data.transactions.length} 笔流水</small></div><b className="safe">已保存</b></article></section><button className="secondary-button" onClick={clearLocalData}>恢复示例数据</button><p className="privacy-note">密码、支付内容和账本不会进入管家对话。Android 版将使用 Keystore 与生物识别保护密码库。</p></div>}

    {(tab === 'schedule' || tab === 'finance') && <button className="add-button" onClick={() => setSheet(tab === 'schedule' ? 'schedule' : 'transaction')} aria-label={tab === 'schedule' ? '新建日程' : '新建流水'}>＋</button>}
    <nav className="bottom-nav" aria-label="主导航">{navItems.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>

    {sheet === 'schedule' && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && setSheet(null)}><form onSubmit={addSchedule} className="sheet"><div className="handle" /><header><div><span>NEW SCHEDULE</span><h2>新建日程</h2></div><button type="button" onClick={() => setSheet(null)}>×</button></header><label>日程名称<input required autoFocus name="title" placeholder="例如：准备周末徒步装备" /></label><div className="row"><label>日期<input name="date" type="date" defaultValue={selectedDate} /></label><label>时间<input required name="time" type="time" defaultValue="10:00" /></label></div><label>类型<input name="detail" placeholder="个人、工作或健康" defaultValue="个人" /></label><button className="save" type="submit">确认添加</button></form></div>}
    {sheet === 'transaction' && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && setSheet(null)}><form onSubmit={addTransaction} className="sheet"><div className="handle" /><header><div><span>NEW RECORD</span><h2>确认一笔流水</h2></div><button type="button" onClick={() => setSheet(null)}>×</button></header><div className="row"><label>类型<select name="kind" defaultValue="expense"><option value="expense">支出</option><option value="income">收入</option></select></label><label>金额<input required name="amount" inputMode="decimal" type="number" min="0.01" step="0.01" placeholder="0.00" /></label></div><label>商家 / 用途<input required name="merchant" placeholder="例如：午餐" /></label><div className="row"><label>账户<select name="accountId">{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label><label>分类<select name="category"><option>餐饮</option><option>交通</option><option>生活</option><option>医疗</option><option>其他</option></select></label></div><button className="save" type="submit">确认入账</button></form></div>}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}

function TransactionList({ items, accounts }: { items: Transaction[]; accounts: Account[] }) {
  if (!items.length) return <div className="list-empty">还没有流水</div>;
  return <div className="transaction-list">{items.map((item) => <article key={item.id}><span className={`transaction-icon ${item.kind}`}>{item.kind === 'income' ? '入' : item.category.slice(0, 1)}</span><div><strong>{item.merchant}</strong><small>{item.category} · {accounts.find((account) => account.id === item.accountId)?.name} · {item.source}</small></div><b className={item.kind}>{item.kind === 'income' ? '+' : '−'}¥{money(item.amount)}</b></article>)}</div>;
}
