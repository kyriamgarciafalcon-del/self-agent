'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';

type Tab = 'home' | 'schedule' | 'capture' | 'finance' | 'profile' | 'health' | 'data' | 'butler' | 'privacy' | 'memory' | 'vault';
type ScheduleColor = 'blue' | 'green' | 'orange';
type TransactionKind = 'expense' | 'income' | 'transfer';
type Currency = 'CNY' | 'USD' | 'HKD' | 'EUR' | 'JPY';

type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  title: string;
  detail: string;
  color: ScheduleColor;
  done: boolean;
};

type Account = { id: string; name: string; type: string; balance: number; currency: Currency; tone: 'forest' | 'clay' | 'ink' };
type Transaction = { id: string; kind: TransactionKind; amount: number; accountAmount: number; currency: Currency; merchant: string; category: string; accountId: string; targetAccountId?: string; source: string; reimbursable: boolean; createdAt: string };
type RecurringRule = { id: string; name: string; kind: 'subscription' | 'credit-card'; amount: number; currency: Currency; accountId: string; targetAccountId?: string; dueDay: number; enabled: boolean; lastRunPeriod?: string };
type HealthRecord = { id: string; kind: 'sleep' | 'meal' | 'exercise'; value: number; note: string; createdAt: string };
type MemoryItem = { id: string; kind: '目标' | '偏好' | '观察'; title: string; note: string; active: boolean };
type PrivacySettings = { health: boolean; finance: boolean; schedule: boolean };
type VaultItem = { id: string; title: string; usernameHint: string; note: string };
type AppData = { schedules: ScheduleItem[]; accounts: Account[]; transactions: Transaction[]; recurringRules: RecurringRule[]; healthRecords: HealthRecord[]; memories: MemoryItem[]; privacy: PrivacySettings; vaultItems: VaultItem[]; theme: 'light' | 'dark' };
type ExpenseDraft = { kind: 'expense'; amount: number; merchant: string; category: string; accountId: string; source: string; currency: Currency; reimbursable: boolean };
type ScheduleDraft = { kind: 'schedule'; title: string; date: string; time: string };
type CaptureDraft = ExpenseDraft | ScheduleDraft;

const TODAY = '2026-08-28';
const STORAGE_KEY = 'self-agent:local-data:v1';
const MONTH = '2026-08';
const currencies: Currency[] = ['CNY', 'USD', 'HKD', 'EUR', 'JPY'];
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
    { id: 'wechat', name: '微信余额', type: '资金账户', balance: 1280.55, currency: 'CNY', tone: 'forest' },
    { id: 'alipay', name: '支付宝', type: '资金账户', balance: 830.2, currency: 'CNY', tone: 'ink' },
    { id: 'bank', name: '日常银行卡', type: '储蓄卡', balance: 12600, currency: 'CNY', tone: 'clay' },
    { id: 'credit', name: '信用卡', type: '待还款', balance: -2340, currency: 'CNY', tone: 'ink' },
  ],
  transactions: [
    { id: 't1', kind: 'expense', amount: 36, accountAmount: 36, currency: 'CNY', merchant: '午餐', category: '餐饮', accountId: 'wechat', source: '手动记录', reimbursable: true, createdAt: '2026-08-28T12:31:00+08:00' },
    { id: 't2', kind: 'expense', amount: 18.5, accountAmount: 18.5, currency: 'CNY', merchant: '地铁出行', category: '交通', accountId: 'alipay', source: '通知草稿确认', reimbursable: false, createdAt: '2026-08-28T08:42:00+08:00' },
    { id: 't3', kind: 'income', amount: 4200, accountAmount: 4200, currency: 'CNY', merchant: '项目回款', category: '收入', accountId: 'bank', source: '手动记录', reimbursable: false, createdAt: '2026-08-27T16:18:00+08:00' },
    { id: 't4', kind: 'expense', amount: 128, accountAmount: 128, currency: 'CNY', merchant: '超市采购', category: '生活', accountId: 'alipay', source: '手动记录', reimbursable: false, createdAt: '2026-08-20T18:22:00+08:00' },
    { id: 't5', kind: 'expense', amount: 68, accountAmount: 68, currency: 'CNY', merchant: '手机套餐', category: '生活', accountId: 'bank', source: '自动扣款确认', reimbursable: false, createdAt: '2026-08-10T09:00:00+08:00' },
  ],
  recurringRules: [
    { id: 'r1', name: '云盘订阅', kind: 'subscription', amount: 30, currency: 'CNY', accountId: 'alipay', dueDay: 30, enabled: true },
    { id: 'r2', name: '信用卡还款', kind: 'credit-card', amount: 2340, currency: 'CNY', accountId: 'bank', targetAccountId: 'credit', dueDay: 5, enabled: true, lastRunPeriod: MONTH },
  ],
  healthRecords: [
    { id: 'h1', kind: 'sleep', value: 6.2, note: '昨晚睡眠', createdAt: '2026-08-28T07:10:00+08:00' },
    { id: 'h2', kind: 'exercise', value: 32, note: '快走', createdAt: '2026-08-27T19:20:00+08:00' },
    { id: 'h3', kind: 'meal', value: 2, note: '今日已记录餐数', createdAt: '2026-08-28T13:00:00+08:00' },
  ],
  memories: [
    { id: 'm1', kind: '目标', title: '每月结余至少 2,000 元', note: '用于生成财务提醒，不自动修改账户。', active: true },
    { id: 'm2', kind: '偏好', title: '23:30 前开始睡前准备', note: '提醒保持温和，不因一次未完成而批评。', active: true },
    { id: 'm3', kind: '观察', title: '睡眠不足后外卖支出可能上升', note: '只是相关性观察，7 天后复核。', active: false },
  ],
  privacy: { health: true, finance: true, schedule: true },
  vaultItems: [
    { id: 'v1', title: '招商银行', usernameHint: '账号已保存', note: '等待 Android Autofill 接管' },
    { id: 'v2', title: '个人邮箱', usernameHint: '账号已保存', note: '不在网页保存密码明文' },
  ],
  theme: 'light',
};

const navItems: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: '首页', icon: '⌂' }, { id: 'schedule', label: '日程', icon: '□' },
  { id: 'capture', label: '记录', icon: '＋' }, { id: 'finance', label: '财务', icon: '▣' },
  { id: 'profile', label: '我的', icon: '○' },
];

function money(value: number) {
  return new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}
function currencyMark(currency: Currency) { return currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency === 'HKD' ? 'HK$' : currency === 'EUR' ? '€' : 'JP¥'; }
function uid(prefix: string) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function normalizeData(raw: Partial<AppData>): AppData {
  const accounts = (raw.accounts ?? seedData.accounts).map((account) => ({ ...account, currency: account.currency ?? 'CNY' as Currency }));
  return {
    schedules: raw.schedules ?? seedData.schedules,
    accounts,
    transactions: (raw.transactions ?? seedData.transactions).map((item) => ({
      ...item,
      currency: item.currency ?? accounts.find((account) => account.id === item.accountId)?.currency ?? 'CNY',
      accountAmount: item.accountAmount ?? item.amount,
      reimbursable: item.reimbursable ?? false,
    })),
    recurringRules: raw.recurringRules ?? seedData.recurringRules,
    healthRecords: raw.healthRecords ?? seedData.healthRecords,
    memories: raw.memories ?? seedData.memories,
    privacy: raw.privacy ?? seedData.privacy,
    vaultItems: raw.vaultItems ?? seedData.vaultItems,
    theme: raw.theme ?? 'light',
  };
}
function adjustAccounts(accounts: Account[], transaction: Transaction, factor: 1 | -1) {
  return accounts.map((account) => {
    let delta = 0;
    if (account.id === transaction.accountId) delta += transaction.kind === 'income' ? transaction.accountAmount : -transaction.accountAmount;
    if (transaction.kind === 'transfer' && account.id === transaction.targetAccountId) delta += transaction.accountAmount;
    return delta ? { ...account, balance: account.balance + delta * factor } : account;
  });
}
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
    return { kind: 'expense', amount: Number(amountMatch[1]), merchant, category: categoryFor(text), accountId, source: '一句话记录', currency: 'CNY', reimbursable: false };
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
  const [sheet, setSheet] = useState<'schedule' | 'transaction' | 'account' | 'recurring' | 'health' | null>(null);
  const [financeCurrency, setFinanceCurrency] = useState<Currency>('CNY');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [captureText, setCaptureText] = useState('');
  const [draft, setDraft] = useState<CaptureDraft | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const saved = window.localStorage.getItem(STORAGE_KEY); if (saved) setData(normalizeData(JSON.parse(saved) as Partial<AppData>)); }
      catch { /* Corrupt local data should not prevent the app from opening. */ }
      finally { setHydrated(true); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }, [data, hydrated]);
  useEffect(() => {
    function onPayment(event: Event) {
      const detail = (event as CustomEvent<Partial<ExpenseDraft>>).detail;
      setDraft({ kind: 'expense', amount: Number(detail.amount ?? 0), merchant: detail.merchant || '支付成功', category: detail.category || '其他', accountId: detail.accountId || 'wechat', source: detail.source || 'Android 支付通知', currency: detail.currency || 'CNY', reimbursable: detail.reimbursable || false });
      setCaptureText('检测到一笔支付，请确认后保存'); setTab('capture');
    }
    window.addEventListener('self-agent:payment-detected', onPayment);
    return () => window.removeEventListener('self-agent:payment-detected', onPayment);
  }, []);

  const selectedSchedules = useMemo(() => data.schedules.filter((item) => item.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)), [data.schedules, selectedDate]);
  const todaySpend = useMemo(() => data.transactions.filter((item) => item.kind === 'expense' && item.currency === 'CNY' && item.createdAt.startsWith(TODAY)).reduce((sum, item) => sum + item.amount, 0), [data.transactions]);
  const totalBalance = useMemo(() => data.accounts.filter((item) => item.currency === 'CNY').reduce((sum, item) => sum + item.balance, 0), [data.accounts]);
  const nextSchedule = data.schedules.find((item) => item.date === TODAY && !item.done);
  const editingAccount = editingAccountId ? data.accounts.find((item) => item.id === editingAccountId) : undefined;
  const editingTransaction = editingTransactionId ? data.transactions.find((item) => item.id === editingTransactionId) : undefined;

  function notify(message: string) { setToast(message); window.setTimeout(() => setToast(''), 2200); }
  function toggleSchedule(id: string) { setData((current) => ({ ...current, schedules: current.schedules.map((item) => item.id === id ? { ...item, done: !item.done } : item) })); }
  function addSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const item: ScheduleItem = { id: uid('schedule'), title: String(form.get('title')), date: String(form.get('date')), time: String(form.get('time')), detail: `${String(form.get('detail') || '个人')} · 提前 10 分钟提醒`, color: 'orange', done: false };
    setData((current) => ({ ...current, schedules: [...current.schedules, item] })); setSelectedDate(item.date); setSheet(null); notify('日程已保存到本机');
  }
  function saveTransaction(input: ExpenseDraft & { transactionKind?: 'expense' | 'income'; accountAmount?: number }) {
    const transactionKind = input.transactionKind ?? 'expense';
    const transaction: Transaction = { id: uid('transaction'), kind: transactionKind, amount: Math.abs(input.amount), accountAmount: Math.abs(input.accountAmount ?? input.amount), currency: input.currency, merchant: input.merchant, category: transactionKind === 'income' ? '收入' : input.category, accountId: input.accountId, source: input.source, reimbursable: transactionKind === 'expense' && input.reimbursable, createdAt: new Date().toISOString() };
    setData((current) => ({ ...current, transactions: [transaction, ...current.transactions], accounts: adjustAccounts(current.accounts, transaction, 1) }));
  }
  function addTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const amount = Number(form.get('amount'));
    const kind = String(form.get('kind')) as TransactionKind;
    const previous = editingTransactionId ? data.transactions.find((item) => item.id === editingTransactionId) : undefined;
    const transaction: Transaction = { id: previous?.id ?? uid('transaction'), kind, amount: Math.abs(amount), accountAmount: Math.abs(amount * Number(form.get('exchangeRate') || 1)), currency: String(form.get('currency')) as Currency, merchant: String(form.get('merchant')), category: kind === 'income' ? '收入' : kind === 'transfer' ? '账户转账' : String(form.get('category')), accountId: String(form.get('accountId')), targetAccountId: kind === 'transfer' ? String(form.get('targetAccountId')) : undefined, source: previous?.source ?? '手动记录', reimbursable: kind === 'expense' && form.get('reimbursable') === 'on', createdAt: previous?.createdAt ?? new Date().toISOString() };
    if (kind === 'transfer' && transaction.accountId === transaction.targetAccountId) { notify('转出和转入账户不能相同'); return; }
    setData((current) => {
      const reversed = previous ? adjustAccounts(current.accounts, previous, -1) : current.accounts;
      return { ...current, accounts: adjustAccounts(reversed, transaction, 1), transactions: previous ? current.transactions.map((item) => item.id === previous.id ? transaction : item) : [transaction, ...current.transactions] };
    });
    setEditingTransactionId(null); setSheet(null); notify(previous ? '账目和账户余额已更新' : '流水已确认入账');
  }
  function addAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const tones: Account['tone'][] = ['forest', 'clay', 'ink'];
    const previous = editingAccountId ? data.accounts.find((item) => item.id === editingAccountId) : undefined;
    const account: Account = { id: previous?.id ?? uid('account'), name: String(form.get('name')), type: String(form.get('type')), balance: Number(form.get('balance') || 0), currency: String(form.get('currency')) as Currency, tone: previous?.tone ?? tones[data.accounts.length % tones.length] };
    setData((current) => ({ ...current, accounts: previous ? current.accounts.map((item) => item.id === previous.id ? account : item) : [...current.accounts, account] })); setEditingAccountId(null); setSheet(null); setFinanceCurrency(account.currency); notify(previous ? '账户资料和余额已更新' : '账户已添加');
  }
  function deleteTransaction() {
    const previous = editingTransactionId ? data.transactions.find((item) => item.id === editingTransactionId) : undefined;
    if (!previous || !window.confirm('确定删除这笔账目吗？对应账户余额会自动恢复。')) return;
    setData((current) => ({ ...current, accounts: adjustAccounts(current.accounts, previous, -1), transactions: current.transactions.filter((item) => item.id !== previous.id) }));
    setEditingTransactionId(null); setSheet(null); notify('账目已删除，余额已恢复');
  }
  function addRecurringRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const kind = String(form.get('ruleKind')) as RecurringRule['kind'];
    const currency = String(form.get('currency')) as Currency;
    const accountId = String(form.get('accountId'));
    const targetAccountId = kind === 'credit-card' ? String(form.get('targetAccountId')) : undefined;
    if (data.accounts.find((account) => account.id === accountId)?.currency !== currency || (targetAccountId && data.accounts.find((account) => account.id === targetAccountId)?.currency !== currency)) { notify('扣款币种需与相关账户币种一致'); return; }
    const rule: RecurringRule = { id: uid('rule'), name: String(form.get('name')), kind, amount: Number(form.get('amount')), currency, accountId, targetAccountId, dueDay: Number(form.get('dueDay')), enabled: true };
    setData((current) => ({ ...current, recurringRules: [...current.recurringRules, rule] })); setSheet(null); notify('自动扣款规则已添加');
  }
  function toggleRecurringRule(id: string) { setData((current) => ({ ...current, recurringRules: current.recurringRules.map((rule) => rule.id === id ? { ...rule, enabled: !rule.enabled } : rule) })); }
  function runRecurringRule(id: string) {
    const selected = data.recurringRules.find((rule) => rule.id === id);
    if (!selected || !selected.enabled || selected.lastRunPeriod === MONTH) { notify('本月已经处理'); return; }
    if (selected.dueDay > Number(TODAY.slice(-2))) { notify(`将在本月 ${selected.dueDay} 日到期`); return; }
    setData((current) => {
      const rule = current.recurringRules.find((item) => item.id === id);
      if (!rule) return current;
      const transaction: Transaction = { id: uid('transaction'), kind: rule.kind === 'subscription' ? 'expense' : 'transfer', amount: rule.amount, accountAmount: rule.amount, currency: rule.currency, merchant: rule.name, category: rule.kind === 'subscription' ? '订阅' : '信用卡还款', accountId: rule.accountId, targetAccountId: rule.targetAccountId, source: '自动扣款确认', reimbursable: false, createdAt: new Date().toISOString() };
      return { ...current, transactions: [transaction, ...current.transactions], accounts: current.accounts.map((account) => account.id === rule.accountId ? { ...account, balance: account.balance - rule.amount } : account.id === rule.targetAccountId ? { ...account, balance: account.balance + rule.amount } : account), recurringRules: current.recurringRules.map((item) => item.id === id ? { ...item, lastRunPeriod: MONTH } : item) };
    });
    notify(selected.kind === 'subscription' ? '订阅扣款已确认入账' : '信用卡还款已确认转账');
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
  function addHealthRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const kind = String(form.get('kind')) as HealthRecord['kind'];
    const record: HealthRecord = { id: uid('health'), kind, value: Number(form.get('value')), note: String(form.get('note') || (kind === 'sleep' ? '睡眠' : kind === 'exercise' ? '运动' : '饮食')), createdAt: new Date().toISOString() };
    setData((current) => ({ ...current, healthRecords: [record, ...current.healthRecords] })); setSheet(null); notify('健康记录已保存到本机');
  }
  function togglePrivacy(key: keyof PrivacySettings) { setData((current) => ({ ...current, privacy: { ...current.privacy, [key]: !current.privacy[key] } })); }
  function toggleMemory(id: string) { setData((current) => ({ ...current, memories: current.memories.map((item) => item.id === id ? { ...item, active: !item.active } : item) })); }
  function deleteMemory(id: string) { if (window.confirm('确定删除这条管家记忆吗？')) setData((current) => ({ ...current, memories: current.memories.filter((item) => item.id !== id) })); }
  function toggleTheme() { setData((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' })); }
  function exportLocalData() {
    const safe = { ...data, vaultItems: data.vaultItems.map(({ id, title, usernameHint, note }) => ({ id, title, usernameHint, note })) };
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([JSON.stringify(safe, null, 2)], { type: 'application/json' })); link.download = 'self-agent-data.json'; link.click(); URL.revokeObjectURL(link.href); notify('已导出脱敏本机数据');
  }
  function clearLocalData() {
    if (!window.confirm('确定恢复示例数据吗？本机新增的日程和账目会被清除。')) return;
    setData(seedData); window.localStorage.removeItem(STORAGE_KEY); notify('已恢复示例数据');
  }
  function pageTitle() { return tab === 'schedule' ? '日程与行动' : tab === 'capture' ? '快速记录' : tab === 'finance' ? '我的财务' : tab === 'profile' ? '我的' : tab === 'health' ? '健康记录' : tab === 'data' ? '数据中心' : tab === 'butler' ? '本机管家' : tab === 'privacy' ? '隐私与权限' : tab === 'memory' ? '记忆管理' : tab === 'vault' ? '密码库' : '今天'; }

  return <main className={`phone-app ${data.theme === 'dark' ? 'dark' : ''}`}>
    <header className="app-header"><button className="round" aria-label="返回首页" onClick={() => setTab('home')}>‹</button><div><span>SELF AGENT · 本机优先</span><h1>{pageTitle()}</h1></div><button className="round status-dot" aria-label="本机保存状态"><i />•••</button></header>

    {tab === 'home' && <div className="page home-page">
      <section className="hero-card"><span>8月28日 · 星期五</span><h2>早上好，今天慢慢来。</h2><p>所有内容先整理、确认后再保存。</p></section>
      <section className="summary-grid"><button onClick={() => setTab('schedule')}><span>下一项 · {nextSchedule?.time ?? '空闲'}</span><strong>{nextSchedule?.title ?? '今天没有更多日程'}</strong><small>{data.schedules.filter((item) => item.date === TODAY && item.done).length}/{data.schedules.filter((item) => item.date === TODAY).length} 已完成</small></button><button onClick={() => setTab('finance')}><span>今日支出</span><strong>¥ {money(todaySpend)}</strong><small>净资产 ¥ {money(totalBalance)}</small></button></section>
      <section className="section-block"><div className="section-title"><div><span>QUICK CAPTURE</span><h2>一句话交给管家</h2></div></div><button className="capture-callout" onClick={() => setTab('capture')}><span>＋</span><div><strong>记录一件事</strong><small>例如“午饭 36 元，微信支付”</small></div><b>›</b></button></section>
      <section className="section-block"><div className="section-title"><div><span>FEATURES</span><h2>生活工具</h2></div></div><div className="feature-grid"><button onClick={() => setTab('health')}><span>健</span><strong>健康</strong><small>睡眠与运动</small></button><button onClick={() => setTab('butler')}><span>管</span><strong>管家</strong><small>本机摘要问答</small></button><button onClick={() => setTab('data')}><span>数</span><strong>数据</strong><small>统一趋势</small></button><button onClick={() => setTab('vault')}><span>钥</span><strong>密码库</strong><small>安全元数据</small></button></div></section>
      <section className="section-block"><div className="section-title"><div><span>RECENT</span><h2>最近入账</h2></div><button onClick={() => setTab('finance')}>查看全部</button></div><TransactionList items={data.transactions.slice(0, 3)} accounts={data.accounts} /></section>
    </div>}

    {tab === 'schedule' && <div className="page schedule-page"><section className="calendar"><div className="week-title"><button aria-label="上一周">‹</button><strong>2026年8月24日 — 30日</strong><button aria-label="下一周">›</button></div><div className="dates">{dateOptions.map((date) => <button key={date.value} onClick={() => setSelectedDate(date.value)} className={selectedDate === date.value ? 'active' : ''}><span>{date.weekday}</span><b>{date.day}</b>{date.value === TODAY && <i />}</button>)}</div></section><section className="day-section"><div className="day-heading"><div><span>{selectedDate === TODAY ? '今天' : `${Number(selectedDate.slice(-2))}日`} · 星期{dateOptions.find((date) => date.value === selectedDate)?.weekday}</span><h2>{selectedSchedules.length ? '今天安排得刚刚好' : '给这一天留点空白'}</h2></div><small>{selectedSchedules.filter((item) => item.done).length}/{selectedSchedules.length} 完成</small></div>{selectedSchedules.length ? <div className="timeline">{selectedSchedules.map((item, index) => <article className={item.done ? 'done' : ''} key={item.id}><time>{item.time}</time><div className="track"><i className={item.color} />{index < selectedSchedules.length - 1 && <span />}</div><button className="schedule-card" onClick={() => toggleSchedule(item.id)}><div><strong>{item.title}</strong><small>{item.detail}</small></div><span className="check">{item.done ? '✓' : ''}</span></button></article>)}</div> : <div className="empty"><span>○</span><h3>没有日程</h3><p>给这一天留点空白，或添加一件事。</p><button onClick={() => setSheet('schedule')}>添加日程</button></div>}</section></div>}

    {tab === 'capture' && <div className="page capture-page"><section className="capture-intro"><span>INBOX</span><h2>先说下来，我来整理。</h2><p>识别为日程或账目后，你确认才会保存。</p></section><form className="capture-box" onSubmit={organizeCapture}><textarea aria-label="一句话记录" maxLength={120} value={captureText} onChange={(event) => setCaptureText(event.target.value)} placeholder={'例如：明天 9 点提醒我交水电费\n或者：午饭 36 元，微信支付'} /><div><small>{captureText.length}/120</small><button type="submit">整理一下</button></div></form><div className="suggestion-row"><button onClick={() => setCaptureText('午饭 36 元，微信支付')}>午饭 36 元</button><button onClick={() => setCaptureText('明天 9 点提醒我交水电费')}>明天 9 点提醒</button></div>{draft && <section className="draft-card"><header><div><span>待确认 · {draft.kind === 'expense' ? '支出' : '日程'}</span><h3>我整理成这样</h3></div><button aria-label="取消草稿" onClick={() => setDraft(null)}>×</button></header>{draft.kind === 'expense' ? <><div className="draft-fields"><label>金额<input inputMode="decimal" value={draft.amount || ''} onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })} /></label><label>币种<select value={draft.currency} onChange={(event) => setDraft({ ...draft, currency: event.target.value as Currency })}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label><label>商家 / 用途<input value={draft.merchant} onChange={(event) => setDraft({ ...draft, merchant: event.target.value })} /></label><label>分类<select value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}><option>餐饮</option><option>交通</option><option>生活</option><option>医疗</option><option>其他</option></select></label><label>账户<select value={draft.accountId} onChange={(event) => setDraft({ ...draft, accountId: event.target.value })}>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label></div><label className="check-option"><input type="checkbox" checked={draft.reimbursable} onChange={(event) => setDraft({ ...draft, reimbursable: event.target.checked })} />加入待报销</label></> : <div className="draft-fields"><label>日程名称<input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label><label>日期<input type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></label><label>时间<input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label></div>}<button className="confirm-button" onClick={confirmDraft}>确认保存</button></section>}</div>}

    {tab === 'finance' && <FinancePanel data={data} currency={financeCurrency} onCurrency={setFinanceCurrency} onNewTransaction={() => { setEditingTransactionId(null); setSheet('transaction'); }} onEditTransaction={(id) => { setEditingTransactionId(id); setSheet('transaction'); }} onNewAccount={() => { setEditingAccountId(null); setSheet('account'); }} onEditAccount={(id) => { setEditingAccountId(id); setSheet('account'); }} onNewRecurring={() => setSheet('recurring')} onRunRecurring={runRecurringRule} onToggleRecurring={toggleRecurringRule} />}

    {tab === 'profile' && <div className="page profile-page"><section className="profile-heading"><div>SA</div><span>SELF AGENT</span><h2>数据留在你的设备上</h2><p>网页端保存生活记录；敏感系统能力由 Android 版主动授权。</p></section><section className="profile-menu"><button onClick={() => setTab('memory')}><span>忆</span><div><strong>AI 记忆管理</strong><small>查看、暂停或删除管家记忆</small></div><b>›</b></button><button onClick={() => setTab('privacy')}><span>盾</span><div><strong>隐私与权限</strong><small>分别控制健康、财务和日程摘要</small></div><b>›</b></button><button onClick={() => setTab('vault')}><span>钥</span><div><strong>密码库</strong><small>不在网页保存密码明文</small></div><b>›</b></button><button onClick={() => setTab('data')}><span>数</span><div><strong>数据中心</strong><small>健康、财务与行动统一摘要</small></div><b>›</b></button></section><section className="profile-actions"><button onClick={toggleTheme}>{data.theme === 'dark' ? '切换浅色模式' : '切换深色模式'}</button><button onClick={exportLocalData}>导出脱敏数据</button><button onClick={clearLocalData}>恢复示例数据</button></section><p className="privacy-note">支付通知和 Autofill 仍等待 Android 原生模块接入；网页不会伪装成已获得系统权限。</p></div>}

    {tab === 'health' && <HealthPanel records={data.healthRecords} onAdd={() => setSheet('health')} />}
    {tab === 'data' && <DataPanel data={data} />}
    {tab === 'butler' && <ButlerPanel data={data} />}
    {tab === 'privacy' && <PrivacyPanel settings={data.privacy} onToggle={togglePrivacy} />}
    {tab === 'memory' && <MemoryPanel items={data.memories} onToggle={toggleMemory} onDelete={deleteMemory} />}
    {tab === 'vault' && <VaultPanel items={data.vaultItems} />}

    {(tab === 'schedule' || tab === 'finance') && <button className="add-button" onClick={() => { if (tab === 'finance') setEditingTransactionId(null); setSheet(tab === 'schedule' ? 'schedule' : 'transaction'); }} aria-label={tab === 'schedule' ? '新建日程' : '新建流水'}>＋</button>}
    <nav className="bottom-nav" aria-label="主导航">{navItems.map((item) => <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><span>{item.icon}</span>{item.label}</button>)}</nav>

    {sheet === 'schedule' && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && setSheet(null)}><form onSubmit={addSchedule} className="sheet"><div className="handle" /><header><div><span>NEW SCHEDULE</span><h2>新建日程</h2></div><button type="button" onClick={() => setSheet(null)}>×</button></header><label>日程名称<input required autoFocus name="title" placeholder="例如：准备周末徒步装备" /></label><div className="row"><label>日期<input name="date" type="date" defaultValue={selectedDate} /></label><label>时间<input required name="time" type="time" defaultValue="10:00" /></label></div><label>类型<input name="detail" placeholder="个人、工作或健康" defaultValue="个人" /></label><button className="save" type="submit">确认添加</button></form></div>}
    {sheet === 'transaction' && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && setSheet(null)}><form key={editingTransaction?.id ?? 'new-transaction'} onSubmit={addTransaction} className="sheet scroll-sheet"><div className="handle" /><header><div><span>{editingTransaction ? 'EDIT RECORD' : 'NEW RECORD'}</span><h2>{editingTransaction ? '编辑账目' : '确认一笔流水'}</h2></div><button type="button" onClick={() => setSheet(null)}>×</button></header><div className="row"><label>类型<select name="kind" defaultValue={editingTransaction?.kind ?? 'expense'}><option value="expense">支出</option><option value="income">收入</option><option value="transfer">账户转账</option></select></label><label>金额<input required name="amount" inputMode="decimal" type="number" min="0.01" step="0.01" placeholder="0.00" defaultValue={editingTransaction?.amount} /></label></div><div className="row"><label>币种<select name="currency" defaultValue={editingTransaction?.currency ?? financeCurrency}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label><label>入账汇率<input required name="exchangeRate" type="number" min="0.000001" step="0.000001" defaultValue={editingTransaction ? editingTransaction.accountAmount / editingTransaction.amount : 1} /></label></div><label>商家 / 用途<input required name="merchant" placeholder="例如：午餐" defaultValue={editingTransaction?.merchant} /></label><div className="row"><label>转出 / 收支账户<select name="accountId" defaultValue={editingTransaction?.accountId}>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label><label>转入账户（仅转账）<select name="targetAccountId" defaultValue={editingTransaction?.targetAccountId}>{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label></div><label>分类<select name="category" defaultValue={editingTransaction?.category}><option>餐饮</option><option>交通</option><option>生活</option><option>医疗</option><option>订阅</option><option>其他</option><option>账户转账</option></select></label><label className="check-option"><input name="reimbursable" type="checkbox" defaultChecked={editingTransaction?.reimbursable} />加入待报销账户</label><small className="form-tip">修改后会先撤销旧账目，再按新内容重新计算账户余额。</small><button className="save" type="submit">{editingTransaction ? '保存修改' : '确认入账'}</button>{editingTransaction && <button className="danger-button" type="button" onClick={deleteTransaction}>删除这笔账目</button>}</form></div>}
    {sheet === 'account' && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && setSheet(null)}><form key={editingAccount?.id ?? 'new-account'} onSubmit={addAccount} className="sheet"><div className="handle" /><header><div><span>{editingAccount ? 'EDIT ACCOUNT' : 'NEW ACCOUNT'}</span><h2>{editingAccount ? '编辑账户' : '添加自定义账户'}</h2></div><button type="button" onClick={() => setSheet(null)}>×</button></header><label>账户名称<input required autoFocus name="name" placeholder="例如：港币旅行卡" defaultValue={editingAccount?.name} /></label><div className="row"><label>账户类型<select name="type" defaultValue={editingAccount?.type}><option>资金账户</option><option>储蓄卡</option><option>信用卡</option><option>理财账户</option><option>储值账户</option><option>订阅账户</option><option>待收回</option><option>欠款</option><option>报销账户</option><option>物品资产</option><option>现金</option></select></label><label>币种<select name="currency" defaultValue={editingAccount?.currency}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div><label>当前余额<input name="balance" type="number" step="0.01" defaultValue={editingAccount?.balance ?? 0} /></label><small className="form-tip">可直接调整余额，用于校准实际账户金额。</small><button className="save" type="submit">{editingAccount ? '保存修改' : '保存账户'}</button></form></div>}
    {sheet === 'recurring' && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && setSheet(null)}><form onSubmit={addRecurringRule} className="sheet scroll-sheet"><div className="handle" /><header><div><span>AUTO PAYMENT</span><h2>添加自动扣款</h2></div><button type="button" onClick={() => setSheet(null)}>×</button></header><div className="row"><label>规则类型<select name="ruleKind"><option value="subscription">订阅扣款</option><option value="credit-card">信用卡还款</option></select></label><label>每月扣款日<input name="dueDay" type="number" min="1" max="31" defaultValue="1" /></label></div><label>名称<input required name="name" placeholder="例如：视频会员" /></label><div className="row"><label>金额<input required name="amount" type="number" min="0.01" step="0.01" /></label><label>币种<select name="currency">{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label></div><label>扣款账户<select name="accountId">{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label><label>还款目标账户（订阅可忽略）<select name="targetAccountId">{data.accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}</select></label><button className="save" type="submit">保存扣款规则</button></form></div>}
    {sheet === 'health' && <div className="overlay" role="dialog" aria-modal="true" onMouseDown={(event) => event.currentTarget === event.target && setSheet(null)}><form onSubmit={addHealthRecord} className="sheet"><div className="handle" /><header><div><span>HEALTH RECORD</span><h2>添加健康记录</h2></div><button type="button" onClick={() => setSheet(null)}>×</button></header><div className="row"><label>记录类型<select name="kind"><option value="sleep">睡眠小时</option><option value="exercise">运动分钟</option><option value="meal">饮食餐数</option></select></label><label>数值<input required name="value" type="number" min="0" step="0.1" /></label></div><label>备注<input name="note" placeholder="例如：昨晚睡眠、快走" /></label><button className="save" type="submit">保存记录</button></form></div>}
    {toast && <div className="toast">✓ {toast}</div>}
  </main>;
}

function HealthPanel({ records, onAdd }: { records: HealthRecord[]; onAdd: () => void }) {
  const sleep = records.find((item) => item.kind === 'sleep');
  const exercise = records.filter((item) => item.kind === 'exercise').reduce((sum, item) => sum + item.value, 0);
  const meals = records.find((item) => item.kind === 'meal');
  return <div className="page feature-page"><section className="health-hero"><span>今日身体状态</span><strong>{sleep && sleep.value >= 7 ? 86 : 78}</strong><div><h2>{sleep && sleep.value >= 7 ? '状态良好' : '睡眠稍低，其他平稳'}</h2><p>只与个人记录比较，不作医疗诊断。</p></div></section><section className="feature-section"><div className="feature-title"><div><span>HEALTH</span><h2>健康项目</h2></div><button onClick={onAdd}>＋ 添加</button></div><div className="health-grid"><article><span>睡</span><div><strong>睡眠</strong><small>最近一次</small></div><b>{sleep ? `${sleep.value} 小时` : '待记录'}</b></article><article><span>动</span><div><strong>运动</strong><small>本机记录累计</small></div><b>{exercise} 分钟</b></article><article><span>食</span><div><strong>饮食</strong><small>今日餐数</small></div><b>{meals ? `${meals.value} 餐` : '待补充'}</b></article></div></section><section className="feature-section"><div className="feature-title"><div><span>HISTORY</span><h2>最近记录</h2></div></div><div className="plain-list">{records.map((item) => <article key={item.id}><span>{item.kind === 'sleep' ? '睡' : item.kind === 'exercise' ? '动' : '食'}</span><div><strong>{item.note}</strong><small>{item.kind === 'sleep' ? `${item.value} 小时` : item.kind === 'exercise' ? `${item.value} 分钟` : `${item.value} 餐`}</small></div></article>)}</div></section></div>;
}

function DataPanel({ data }: { data: AppData }) {
  const month = data.transactions.filter((item) => item.createdAt.startsWith(MONTH) && item.currency === 'CNY');
  const income = month.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0);
  const expense = month.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const todayItems = data.schedules.filter((item) => item.date === TODAY);
  const sleepValues = data.healthRecords.filter((item) => item.kind === 'sleep').map((item) => item.value);
  const avgSleep = sleepValues.length ? sleepValues.reduce((sum, item) => sum + item, 0) / sleepValues.length : 0;
  return <div className="page feature-page"><section className="data-hero"><span>近 7 天综合状态</span><h2>稳定</h2><p>数据来自你确认保存过的本机记录。</p><div className="mini-chart">{[58,72,64,82,68,76,79].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></section><section className="feature-section"><div className="feature-title"><div><span>SUMMARY</span><h2>统一摘要</h2></div></div><div className="data-summary"><article><span>健</span><div><strong>健康</strong><small>平均睡眠 {avgSleep ? avgSleep.toFixed(1) : '—'} 小时</small></div><b>{avgSleep >= 7 ? '良好' : '观察'}</b></article><article><span>财</span><div><strong>财务</strong><small>收入 ¥{money(income)} · 支出 ¥{money(expense)}</small></div><b>{income - expense >= 0 ? '+' : '−'}¥{money(Math.abs(income - expense))}</b></article><article><span>行</span><div><strong>行动</strong><small>今日 {todayItems.length} 项日程</small></div><b>{todayItems.filter((item) => item.done).length}/{todayItems.length}</b></article></div></section><section className="evidence-card"><span>值得继续观察</span><h3>睡眠、外卖与晚间安排可能相关</h3><p>当前数据只能表示同时出现，不能证明因果。继续记录 7 天后再判断。</p></section></div>;
}

function ButlerPanel({ data }: { data: AppData }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([{ role: 'bot', text: '我只使用你允许的本机摘要，不读取密码或完整凭据。' }]);
  function answer(text: string) {
    if (/密码|验证码|私钥|助记词/.test(text)) return '密码库是独立安全域。我不能读取或复述密码、验证码、私钥和助记词。';
    if (/财务|花|钱|结余/.test(text)) {
      if (!data.privacy.finance) return '财务摘要权限已关闭。你可以在隐私与权限中重新开启。';
      const month = data.transactions.filter((item) => item.createdAt.startsWith(MONTH) && item.currency === 'CNY');
      const income = month.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0); const expense = month.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0);
      return `本月已确认收入 ${money(income)} 元、支出 ${money(expense)} 元，结余 ${money(income - expense)} 元。未读取订单号或密码。`;
    }
    if (/睡眠|疲惫|健康/.test(text)) {
      if (!data.privacy.health) return '健康摘要权限已关闭。';
      const sleep = data.healthRecords.find((item) => item.kind === 'sleep'); return sleep ? `最近一次记录睡眠 ${sleep.value} 小时。偏低只是一项观察，不等于诊断。` : '还没有睡眠记录，可以先在健康页添加。';
    }
    const open = data.schedules.filter((item) => item.date === TODAY && !item.done);
    return open.length ? `建议先处理“${open[0].title}”，完成后再安排下一项。` : '今天没有未完成日程，可以保留一点空白。';
  }
  function send(text = input) { const value = text.trim(); if (!value) return; setMessages((current) => [...current, { role: 'user', text: value }, { role: 'bot', text: answer(value) }]); setInput(''); }
  return <div className="page butler-page"><section className="butler-intro"><span>LOCAL BUTLER</span><h2>先从本机摘要开始。</h2><p>这是规则式本机管家，不冒充联网 AI。</p></section><div className="chat-suggestions"><button onClick={() => send('我现在最该做什么？')}>我现在最该做什么？</button><button onClick={() => send('分析本月财务')}>分析本月财务</button><button onClick={() => send('最近睡眠怎么样？')}>最近睡眠怎么样？</button></div><div className="chat-messages">{messages.map((message, index) => <div key={index} className={message.role}>{message.text}</div>)}</div><form className="butler-composer" onSubmit={(event) => { event.preventDefault(); send(); }}><input value={input} onChange={(event) => setInput(event.target.value)} placeholder="问问今天的状态…" /><button>发送</button></form></div>;
}

function PrivacyPanel({ settings, onToggle }: { settings: PrivacySettings; onToggle: (key: keyof PrivacySettings) => void }) {
  const rows: { key: keyof PrivacySettings; title: string; note: string }[] = [{ key: 'health', title: '健康摘要', note: '睡眠、运动和饮食的聚合记录' }, { key: 'finance', title: '财务摘要', note: '收入、支出、分类和未来扣款' }, { key: 'schedule', title: '日程与行动', note: '用于排序、提醒与完成情况' }];
  return <div className="page feature-page"><section className="security-hero"><span>当前保护状态</span><h2>本机优先</h2><p>每类摘要可以单独关闭；密码权限永久不开放。</p></section><section className="permission-list">{rows.map((row) => <article key={row.key}><div><strong>{row.title}</strong><small>{row.note}</small></div><button className={settings[row.key] ? 'on' : ''} onClick={() => onToggle(row.key)} aria-label={`${row.title}权限`}><i /></button></article>)}<article><div><strong>密码与恢复码</strong><small>密码、验证码、私钥、助记词永久禁止</small></div><button disabled aria-label="密码权限永久关闭"><i /></button></article></section><p className="security-copy">当前开关会真实影响本机管家回答时可使用的摘要范围，不只是界面状态。</p></div>;
}

function MemoryPanel({ items, onToggle, onDelete }: { items: MemoryItem[]; onToggle: (id: string) => void; onDelete: (id: string) => void }) {
  return <div className="page feature-page"><section className="feature-heading"><span>MEMORY</span><h2>你决定管家记住什么。</h2><p>记忆可以随时暂停或删除，停用后不再用于建议。</p></section><div className="memory-list">{items.map((item) => <article key={item.id} className={!item.active ? 'inactive' : ''}><header><span>{item.kind}</span><b>{item.active ? '使用中' : '已暂停'}</b></header><h3>{item.title}</h3><p>{item.note}</p><div><button onClick={() => onToggle(item.id)}>{item.active ? '暂停使用' : '重新启用'}</button><button className="danger-text" onClick={() => onDelete(item.id)}>删除</button></div></article>)}</div></div>;
}

function VaultPanel({ items }: { items: VaultItem[] }) {
  return <div className="page feature-page"><section className="vault-safe"><span>钥</span><h2>安全密码库入口</h2><p>网页只保存“账号是否存在”等非敏感元数据，不保存密码明文。</p><b>等待 Android Autofill + Keystore</b></section><section className="feature-section"><div className="feature-title"><div><span>METADATA</span><h2>账号目录</h2></div><small>{items.length} 项</small></div><div className="plain-list">{items.map((item) => <article key={item.id}><span>{item.title.slice(0, 1)}</span><div><strong>{item.title}</strong><small>{item.usernameHint} · {item.note}</small></div></article>)}</div></section><section className="vault-warning"><strong>为什么不能现在查看密码？</strong><p>浏览器本地存储不适合保存密码。正式版本必须通过系统 Autofill、Keystore 和生物识别完成。</p></section></div>;
}

function FinancePanel({ data, currency, onCurrency, onNewTransaction, onEditTransaction, onNewAccount, onEditAccount, onNewRecurring, onRunRecurring, onToggleRecurring }: { data: AppData; currency: Currency; onCurrency: (currency: Currency) => void; onNewTransaction: () => void; onEditTransaction: (id: string) => void; onNewAccount: () => void; onEditAccount: (id: string) => void; onNewRecurring: () => void; onRunRecurring: (id: string) => void; onToggleRecurring: (id: string) => void }) {
  const monthItems = data.transactions.filter((item) => item.currency === currency && item.createdAt.startsWith(MONTH));
  const monthIncome = monthItems.filter((item) => item.kind === 'income').reduce((sum, item) => sum + item.amount, 0);
  const monthExpense = monthItems.filter((item) => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0);
  const todayExpense = monthItems.filter((item) => item.kind === 'expense' && item.createdAt.startsWith(TODAY)).reduce((sum, item) => sum + item.amount, 0);
  const reimburse = monthItems.filter((item) => item.kind === 'expense' && item.reimbursable).reduce((sum, item) => sum + item.amount, 0);
  const chartDays = [5, 10, 15, 20, 25, 28].map((day) => ({ day, amount: monthItems.filter((item) => item.kind === 'expense' && Number(item.createdAt.slice(8, 10)) === day).reduce((sum, item) => sum + item.amount, 0) }));
  const maxDay = Math.max(...chartDays.map((item) => item.amount), 1);
  const mark = currencyMark(currency);
  return <div className="page finance-page">
    <section className="finance-toolbar"><div><span>2026年8月</span><h2>月度收支</h2></div><select aria-label="统计币种" value={currency} onChange={(event) => onCurrency(event.target.value as Currency)}>{currencies.map((item) => <option key={item}>{item}</option>)}</select></section>
    <section className="monthly-summary"><article><span>本月收入</span><strong className="income">+{mark}{money(monthIncome)}</strong></article><article><span>本月支出</span><strong>−{mark}{money(monthExpense)}</strong></article><article><span>本月结余</span><strong className={monthIncome - monthExpense >= 0 ? 'income' : ''}>{monthIncome - monthExpense >= 0 ? '+' : '−'}{mark}{money(Math.abs(monthIncome - monthExpense))}</strong></article></section>
    <section className="daily-card"><header><div><span>DAILY SPEND</span><h3>每日支出</h3></div><div><small>今天</small><strong>{mark}{money(todayExpense)}</strong></div></header><div className="spend-chart">{chartDays.map((item) => <div key={item.day}><span><i style={{ height: `${Math.max(5, item.amount / maxDay * 100)}%` }} /></span><small>{item.day}日</small></div>)}</div><footer><span>待报销</span><strong>{mark}{money(reimburse)}</strong></footer></section>
    <button className="bookkeeping-button" onClick={onNewTransaction}><span>＋</span><div><strong>记一笔</strong><small>选择账户、币种与报销状态</small></div><b>›</b></button>
    <section className="section-block account-section"><div className="section-title"><div><span>ACCOUNTS</span><h2>我的账户</h2></div><button onClick={onNewAccount}>＋ 添加账户</button></div><div className="account-grid">{data.accounts.map((account) => <article className={account.tone} key={account.id}><span>{account.type} · {account.currency}</span><button className="account-edit-button" onClick={() => onEditAccount(account.id)}>编辑</button><h3>{account.name}</h3><strong>{account.balance < 0 ? '−' : ''}{currencyMark(account.currency)} {money(Math.abs(account.balance))}</strong></article>)}</div></section>
    <section className="section-block"><div className="section-title"><div><span>AUTO PAYMENT</span><h2>自动扣款</h2></div><button onClick={onNewRecurring}>＋ 新规则</button></div><div className="recurring-list">{data.recurringRules.map((rule) => { const future = rule.dueDay > Number(TODAY.slice(-2)); return <article key={rule.id} className={!rule.enabled ? 'disabled' : ''}><span className="rule-icon">{rule.kind === 'subscription' ? '订' : '还'}</span><div><strong>{rule.name}</strong><small>每月 {rule.dueDay} 日 · {data.accounts.find((account) => account.id === rule.accountId)?.name}</small></div><b>{currencyMark(rule.currency)}{money(rule.amount)}</b><button disabled={!rule.enabled || rule.lastRunPeriod === MONTH || future} onClick={() => onRunRecurring(rule.id)}>{rule.lastRunPeriod === MONTH ? '本月已完成' : !rule.enabled ? '已暂停' : future ? `${rule.dueDay}日到期` : '确认扣款'}</button><button className="rule-toggle" onClick={() => onToggleRecurring(rule.id)}>{rule.enabled ? '暂停' : '启用'}</button></article>; })}</div><p className="automation-note">到期后生成待确认项目；确认才会扣减账户。Android 版可通过本机通知提醒。</p></section>
    <section className="section-block"><div className="section-title"><div><span>LEDGER · {currency}</span><h2>本月流水</h2></div></div><TransactionList items={monthItems} accounts={data.accounts} onEdit={onEditTransaction} /></section>
  </div>;
}

function TransactionList({ items, accounts, onEdit }: { items: Transaction[]; accounts: Account[]; onEdit?: (id: string) => void }) {
  if (!items.length) return <div className="list-empty">还没有流水</div>;
  return <div className="transaction-list">{items.map((item) => <article key={item.id}><span className={`transaction-icon ${item.kind}`}>{item.kind === 'income' ? '入' : item.kind === 'transfer' ? '转' : item.category.slice(0, 1)}</span><div><strong>{item.merchant}{item.reimbursable && <em>待报销</em>}</strong><small>{item.category} · {accounts.find((account) => account.id === item.accountId)?.name} · {item.source}</small></div><div className="transaction-actions"><b className={item.kind}>{item.kind === 'income' ? '+' : item.kind === 'transfer' ? '↔' : '−'}{currencyMark(item.currency)}{money(item.amount)}</b>{onEdit && <button onClick={() => onEdit(item.id)}>编辑</button>}</div></article>)}</div>;
}
