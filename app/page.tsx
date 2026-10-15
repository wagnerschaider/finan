"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft, ArrowDownRight, ArrowLeft, ArrowRight, ArrowUpRight, Banknote,
  CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, CreditCard, Download, Ellipsis, Eye, EyeOff, FileText, PieChart,
  Filter, Flame, Home, LogOut, Menu, Minus, MoreHorizontal, Pencil, Plus,
  Repeat2, Search, Settings2, SlidersHorizontal, Sparkles, Tag, Trash2,
  TrendingDown, TrendingUp, Wallet, X, Zap,
} from "lucide-react";
import { Pie, PieChart as RechartsPieChart, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type TxType = "expense" | "income";
type Transaction = {
  id: string; user_id: string; recurring_rule_id: string | null; title: string;
  amount: number; type: TxType; category: string; due_date: string;
  month_key: string; is_paid: boolean; is_deleted?: boolean; notes: string | null;
};
type RecurringRule = {
  id: string; user_id: string; title: string; amount: number; type: TxType;
  category: string; day_of_month: number; start_date: string; end_date: string | null;
  active: boolean; notes: string | null;
};
type TxForm = {
  title: string; amount: string; type: TxType; category: string; due_date: string;
  is_paid: boolean; notes: string; recurring: boolean;
};

const expenseCategories = ["Moradia", "Contas", "Transporte", "Alimentação", "Saúde", "Educação", "Cartão", "Compras", "Lazer", "Assinaturas", "Outros"];
const incomeCategories = ["Salário", "Freelance", "Reembolso", "Investimentos", "Venda", "Outros"];
const palette = ["#a8562e", "#d88b59", "#e7b88b", "#6d8a75", "#7b91a1", "#c5a15d", "#8e7770", "#6f6861", "#b26a68", "#9b927b"];
const brl = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
const isoToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const monthString = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
const firstDay = (month: string) => `${month}-01`;
const lastDay = (month: string) => {
  const [year, mm] = month.split("-").map(Number);
  return `${month}-${String(new Date(year, mm, 0).getDate()).padStart(2, "0")}`;
};
const monthLabel = (month: string, long = true) => {
  const [year, mm] = month.split("-").map(Number);
  const label = new Intl.DateTimeFormat("pt-BR", { month: long ? "long" : "short", year: "numeric" }).format(new Date(year, mm - 1, 1));
  return label.replace(" de ", " / ");
};
const displayDate = (date: string) => {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const shortMonth = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(new Date(year, month - 1, 1)).replace(".", "");
  return `${String(day).padStart(2, "0")} ${shortMonth}`;
};
const toNumber = (value: string | number) => {
  if (typeof value === "number") return value;
  const clean = value.trim().replace(/[^0-9,.-]/g, "");
  if (clean.includes(",")) return Number(clean.replace(/\./g, "").replace(",", "."));
  const parts = clean.split(".");
  if (parts.length > 1 && parts[parts.length - 1].length === 3) return Number(clean.replace(/\./g, ""));
  return Number(clean);
};
const formatMoneyInput = (value: string) => {
  const amount = toNumber(value);
  return Number.isFinite(amount) ? amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value;
};

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`brand ${compact ? "brand-compact" : ""}`}><span className="brand-mark"><span /></span><span className="brand-word">entre<span className="brand-dot">.</span></span></div>;
}

function AuthScreen() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError(""); setMessage("");
    const result = mode === "login"
      ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
      : await supabase.auth.signUp({ email: email.trim(), password });
    if (result.error) setError(result.error.message.includes("Invalid login credentials") ? "E-mail ou senha incorretos." : result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre.");
    setBusy(false);
  };

  return <main className="auth-shell">
    <section className="auth-art">
      <Brand />
      <div className="auth-art-copy">
        <span className="eyebrow"><span className="eyebrow-dot" /> CLAREZA, MÊS A MÊS</span>
        <h1>Seu dinheiro.<br /><em>Seu ritmo.</em></h1>
        <p>Uma forma mais leve de enxergar o que entra, o que sai e o que fica.</p>
        <div className="auth-preview">
          <div className="preview-top"><span>RESUMO DO MÊS</span><span className="preview-pill">● Visão geral</span></div>
          <span className="preview-caption">Saldo disponível</span>
          <strong>R$ 987,00</strong>
          <div className="preview-bars"><span style={{ width: "78%" }} /><span style={{ width: "46%" }} /></div>
          <div className="preview-legend"><span><i className="legend-income" /> Entradas</span><span><i className="legend-expense" /> Despesas</span></div>
        </div>
      </div>
      <div className="auth-art-bottom"><span>FEITO PARA A VIDA REAL</span><span>01 — 12</span></div>
    </section>
    <section className="auth-form-side">
      <div className="auth-form-wrap">
        <div className="auth-mobile-brand"><Brand /></div>
        <span className="eyebrow">SUAS FINANÇAS, EM UM SÓ LUGAR</span>
        <h2>{mode === "login" ? "Que bom ter você de volta." : "Comece por aqui."}</h2>
        <p className="muted auth-intro">{mode === "login" ? "Entre para acompanhar seu mês de perto." : "Crie sua conta para guardar seus lançamentos com segurança."}</p>
        <form onSubmit={submit} className="auth-form">
          <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required /></label>
          <label>Senha<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo de 6 caracteres" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required /></label>
          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}
          <button className="btn btn-primary auth-submit" disabled={busy}>{busy ? "Aguarde…" : mode === "login" ? "Entrar na minha conta" : "Criar minha conta"}<ArrowRight size={17} /></button>
        </form>
        <p className="auth-switch">{mode === "login" ? "Ainda não tem uma conta?" : "Já tem uma conta?"} <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>{mode === "login" ? "Criar conta" : "Fazer login"}</button></p>
        <div className="auth-privacy"><span className="privacy-lock">⌑</span> Seus dados são privados e vinculados à sua conta.</div>
      </div>
    </section>
  </main>;
}

function SetupScreen() {
  return <main className="setup-screen"><div className="setup-card"><Brand /><span className="eyebrow">QUASE LÁ</span><h1>Conecte suas finanças.</h1><p>O app está pronto, mas ainda faltam as credenciais do Supabase. Configure as variáveis de ambiente para habilitar login e salvar seus dados.</p><div className="setup-code"><code>NEXT_PUBLIC_SUPABASE_URL</code><code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code></div><p className="muted">Veja o passo a passo no arquivo <strong>README.md</strong> do projeto.</p></div></main>;
}

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [month, setMonth] = useState(monthString());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [view, setView] = useState<"overview" | "recurring">("overview");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [txModal, setTxModal] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [ruleEditing, setRuleEditing] = useState<RecurringRule | null>(null);
  const [filter, setFilter] = useState<"all" | "expense" | "income" | "pending">("all");
  const [search, setSearch] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [quickAmountId, setQuickAmountId] = useState<string | null>(null);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [form, setForm] = useState<TxForm>({ title: "", amount: "", type: "expense", category: "Moradia", due_date: isoToday(), is_paid: false, notes: "", recurring: false });

  useEffect(() => {
    if (!supabase) { setAuthLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setAuthLoading(false); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const announce = (type: "success" | "error", text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(current => current?.text === text ? null : current), 3800);
  };

  const loadMonth = useCallback(async () => {
    if (!supabase || !session?.user) return;
    setLoading(true);
    const { error: occurrenceError } = await supabase.rpc("ensure_month_occurrences", { p_month: firstDay(month) });
    if (occurrenceError) {
      console.error(occurrenceError);
      announce("error", "Não foi possível atualizar as recorrências. Confira se o schema SQL foi executado no Supabase.");
    }
    const { data, error } = await supabase.from("transactions").select("*").eq("month_key", firstDay(month)).eq("is_deleted", false).order("due_date", { ascending: true }).order("created_at", { ascending: true });
    if (error) announce("error", "Não foi possível carregar os lançamentos deste mês.");
    else setTransactions((data || []) as Transaction[]);
    setLoading(false);
  }, [session?.user?.id, month]);

  const loadRules = useCallback(async () => {
    if (!supabase || !session?.user) return;
    const { data, error } = await supabase.from("recurring_rules").select("*").order("active", { ascending: false }).order("title", { ascending: true });
    if (error) announce("error", "Não foi possível carregar as recorrências.");
    else setRules((data || []) as RecurringRule[]);
  }, [session?.user?.id]);

  useEffect(() => { if (session?.user) void loadMonth(); }, [loadMonth, session?.user?.id]);
  useEffect(() => { if (session?.user) void loadRules(); }, [loadRules, session?.user?.id]);

  const expenses = useMemo(() => transactions.filter(t => t.type === "expense"), [transactions]);
  const incomes = useMemo(() => transactions.filter(t => t.type === "income"), [transactions]);
  const totalExpenses = useMemo(() => expenses.reduce((sum, t) => sum + Number(t.amount), 0), [expenses]);
  const totalIncome = useMemo(() => incomes.reduce((sum, t) => sum + Number(t.amount), 0), [incomes]);
  const pendingAmount = transactions.filter(t => !t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0);
  const paidExpense = expenses.filter(t => t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0);
  const paidIncome = incomes.filter(t => t.is_paid).reduce((sum, t) => sum + Number(t.amount), 0);
  const balance = paidIncome - paidExpense;
  const availableAfterExpenses = totalIncome - totalExpenses;
  const expenseRatio = totalIncome > 0 ? Math.round(totalExpenses / totalIncome * 100) : 0;
  const expenseByCategory = useMemo(() => {
    const grouped = new Map<string, number>();
    expenses.forEach(t => grouped.set(t.category || "Outros", (grouped.get(t.category || "Outros") || 0) + Number(t.amount)));
    return Array.from(grouped.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [expenses]);
  const filtered = useMemo(() => transactions.filter(t => {
    const typePass = filter === "all" || (filter === "pending" ? !t.is_paid : t.type === filter);
    const searchPass = `${t.title} ${t.category} ${t.notes || ""}`.toLowerCase().includes(search.toLowerCase());
    return typePass && searchPass;
  }), [transactions, filter, search]);

  const shiftMonth = (delta: number) => {
    const [year, mm] = month.split("-").map(Number);
    const next = new Date(year, mm - 1 + delta, 1);
    setMonth(monthString(next));
  };

  const openCreate = (type: TxType = "expense") => {
    setEditing(null);
    setForm({ title: "", amount: "", type, category: type === "expense" ? "Moradia" : "Salário", due_date: `${month}-${String(new Date().getDate()).padStart(2, "0")}`.replace(/-(\d{2})$/, (_m, day) => `-${String(Math.min(Number(day), new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).getDate())).padStart(2, "0")}`), is_paid: false, notes: "", recurring: false });
    setTxModal(true);
  };

  const openEdit = (tx: Transaction) => {
    setEditing(tx);
    setForm({ title: tx.title, amount: Number(tx.amount).toFixed(2).replace(".", ","), type: tx.type, category: tx.category, due_date: tx.due_date, is_paid: tx.is_paid, notes: tx.notes || "", recurring: false });
    setTxModal(true);
  };

  const saveTransaction = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !session?.user) return;
    const amount = toNumber(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) { announce("error", "Informe uma descrição e um valor válido."); return; }
    setSaving(true);
    const monthKey = firstDay(form.due_date.slice(0, 7));
    const payload = {
      title: form.title.trim(), amount, type: form.type, category: form.category,
      due_date: form.due_date, month_key: monthKey, is_paid: form.is_paid,
      notes: form.notes.trim() || null,
    };
    let error: { message: string } | null = null;
    if (editing) {
      const result = await supabase.from("transactions").update(payload).eq("id", editing.id);
      error = result.error;
    } else if (form.recurring) {
      const result = await supabase.from("recurring_rules").insert({
        user_id: session.user.id, title: payload.title, amount, type: form.type,
        category: form.category, day_of_month: Number(form.due_date.slice(8, 10)),
        start_date: form.due_date, active_from: form.due_date, active: true, notes: payload.notes,
      }).select("id").single();
      error = result.error;
      if (!error && result.data) {
        const { error: occurrenceError } = await supabase.rpc("ensure_month_occurrences", { p_month: monthKey });
        if (occurrenceError) error = occurrenceError;
        else {
          const { error: instanceError } = await supabase.from("transactions").update({ is_paid: payload.is_paid, notes: payload.notes }).eq("recurring_rule_id", result.data.id).eq("month_key", monthKey);
          if (instanceError) error = instanceError;
        }
      }
    } else {
      const result = await supabase.from("transactions").insert({ ...payload, user_id: session.user.id });
      error = result.error;
    }
    setSaving(false);
    if (error) { console.error(error); announce("error", "Não foi possível salvar. Confira a configuração do Supabase."); return; }
    setTxModal(false);
    announce("success", editing ? "Lançamento atualizado." : form.recurring ? "Recorrência criada. Ela aparecerá nos próximos meses." : "Lançamento adicionado.");
    if (form.due_date.slice(0, 7) !== month) setMonth(form.due_date.slice(0, 7));
    else void loadMonth();
    if (form.recurring || editing?.recurring_rule_id) void loadRules();
  };

  const togglePaid = async (tx: Transaction) => {
    if (!supabase) return;
    const { error } = await supabase.from("transactions").update({ is_paid: !tx.is_paid }).eq("id", tx.id);
    if (error) announce("error", "Não foi possível atualizar o status.");
    else setTransactions(current => current.map(item => item.id === tx.id ? { ...item, is_paid: !item.is_paid } : item));
  };

  const editQuickAmount = (tx: Transaction) => {
    setQuickAmountId(tx.id);
    setQuickAmount(Number(tx.amount).toFixed(2).replace(".", ","));
  };

  const saveQuickAmount = async (tx: Transaction) => {
    if (!supabase) return;
    const amount = toNumber(quickAmount);
    if (!Number.isFinite(amount) || amount <= 0) { announce("error", "Informe um valor válido maior que zero."); return; }
    setQuickSaving(true);
    const { error } = await supabase.from("transactions").update({ amount }).eq("id", tx.id);
    setQuickSaving(false);
    if (error) { announce("error", "Não foi possível atualizar o valor."); return; }
    setTransactions(current => current.map(item => item.id === tx.id ? { ...item, amount } : item));
    setQuickAmountId(null);
    announce("success", "Valor atualizado.");
  };

  const cancelQuickAmount = () => { setQuickAmountId(null); setQuickAmount(""); };

  const deleteTransaction = async (tx: Transaction) => {
    if (!supabase || !window.confirm(`Excluir “${tx.title}” deste mês?${tx.recurring_rule_id ? " A regra recorrente continuará ativa para os outros meses." : ""}`)) return;
    const result = tx.recurring_rule_id
      ? await supabase.from("transactions").update({ is_deleted: true }).eq("id", tx.id)
      : await supabase.from("transactions").delete().eq("id", tx.id);
    if (result.error) announce("error", "Não foi possível excluir o lançamento.");
    else { setTransactions(current => current.filter(item => item.id !== tx.id)); announce("success", "Lançamento excluído deste mês."); }
  };

  const toggleRule = async (rule: RecurringRule) => {
    if (!supabase) return;
    const nextMonthStart = `${monthString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))}-01`;
    const patch = rule.active ? { active: false } : { active: true, active_from: nextMonthStart };
    const { error } = await supabase.from("recurring_rules").update(patch).eq("id", rule.id);
    if (error) announce("error", "Não foi possível atualizar a recorrência.");
    else { setRules(current => current.map(r => r.id === rule.id ? { ...r, ...patch } : r)); announce("success", rule.active ? "Recorrência pausada." : "Recorrência reativada a partir do próximo mês."); }
  };

  const saveRule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !ruleEditing) return;
    const fd = new FormData(event.currentTarget);
    const amount = toNumber(String(fd.get("rule-amount") || ""));
    const title = String(fd.get("rule-title") || "").trim();
    if (!title || amount <= 0) { announce("error", "Confira o nome e o valor da recorrência."); return; }
    setSaving(true);
    const active = fd.get("rule-active") === "on";
    const activeFromPatch = !ruleEditing.active && active
      ? { active_from: `${monthString(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1))}-01` }
      : {};
    const { error } = await supabase.from("recurring_rules").update({
      ...activeFromPatch, title, amount, category: String(fd.get("rule-category") || "Outros"),
      day_of_month: Math.min(31, Math.max(1, Number(fd.get("rule-day") || 1))),
      start_date: String(fd.get("rule-start") || ruleEditing.start_date),
      end_date: String(fd.get("rule-end") || "") || null,
      active,
    }).eq("id", ruleEditing.id);
    setSaving(false);
    if (error) announce("error", "Não foi possível editar a regra.");
    else { setRuleEditing(null); void loadRules(); announce("success", "Regra atualizada. Os próximos meses usarão esses dados; o histórico permanece igual."); }
  };

  const loadExamples = async () => {
    if (!supabase || !session?.user || transactions.length > 0) return;
      const sample: Array<[string, number, TxType, string, number]> = [
      ["Aluguel",1300,"expense","Moradia",5], ["Condomínio",550,"expense","Moradia",5], ["Luz",160,"expense","Contas",10],
      ["Moto",960,"expense","Transporte",12], ["Faculdade",175,"expense","Educação",8], ["Itaú",662,"expense","Cartão",15],
      ["Inter",289,"expense","Cartão",16], ["Bradesco",350,"expense","Cartão",18], ["Nu",109,"expense","Cartão",20], ["Perfume",60,"expense","Compras",22],
      ["Salário",5150,"income","Salário",5], ["Binho",283,"income","Outros",12], ["Óculos",169,"income","Outros",20],
    ];
    const rows = sample.map(([title, amount, type, category, day]) => ({
      user_id: session.user.id, title, amount, type, category,
      due_date: `${month}-${String(day).padStart(2,"0")}`, month_key: firstDay(month), is_paid: false, notes: null,
    }));
    const { error } = await supabase.from("transactions").insert(rows);
    if (error) announce("error", "Não foi possível importar os exemplos.");
    else { await loadMonth(); announce("success", "Os 13 lançamentos da sua planilha foram importados."); }
  };

  const exportCsv = () => {
    const header = ["Data", "Descrição", "Tipo", "Categoria", "Valor", "Status", "Recorrente"];
    const lines = transactions.map(t => [t.due_date, t.title, t.type === "income" ? "Entrada" : "Despesa", t.category, Number(t.amount).toFixed(2).replace(".", ","), t.is_paid ? "Pago/recebido" : "Pendente", t.recurring_rule_id ? "Sim" : "Não"]);
    const csv = [header, ...lines].map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `entre-${month}.csv`; anchor.click(); URL.revokeObjectURL(url);
  };

  if (!isSupabaseConfigured) return <SetupScreen />;
  if (authLoading) return <main className="loading-screen"><Brand /><span className="loading-dot" /></main>;
  if (!session) return <AuthScreen />;

  const user = session.user as User;
  const emailName = (user.email || "").split("@")[0];
  const displayName = emailName ? emailName.split(/[._-]/)[0] : "você";

  return <main className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
      <div className="sidebar-brand"><Brand /></div>
      <div className="sidebar-label">MENU PRINCIPAL</div>
      <nav className="side-nav">
        <button className={`nav-item ${view === "overview" ? "active" : ""}`} onClick={() => { setView("overview"); setMobileMenu(false); }}><Home size={18}/><span>Visão geral</span>{view === "overview" && <span className="nav-current" />}</button>
        <button className={`nav-item ${view === "recurring" ? "active" : ""}`} onClick={() => { setView("recurring"); setMobileMenu(false); }}><Repeat2 size={18}/><span>Recorrências</span><span className="nav-count">{rules.filter(r=>r.active).length || "—"}</span></button>
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><span className="tip-icon"><Sparkles size={16}/></span><strong>Pequenos passos.</strong><p>Consistência vale mais que perfeição. Um mês de cada vez.</p><span className="tip-line" /></div>
        <div className="sidebar-profile"><div className="avatar">{(displayName[0] || "V").toUpperCase()}</div><div className="profile-copy"><strong>{displayName}</strong><span>{user.email}</span></div><button className="icon-button sidebar-logout" title="Sair" onClick={() => supabase?.auth.signOut()}><LogOut size={16}/></button></div>
      </div>
    </aside>

    {mobileMenu && <button className="mobile-backdrop" aria-label="Fechar menu" onClick={() => setMobileMenu(false)} />}

    <section className="main-column">
      <header className="topbar">
        <div className="topbar-left"><button className="icon-button mobile-menu-toggle" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Abrir menu"><Menu size={20}/></button><div className="mobile-brand"><Brand compact /></div><span className="topbar-context">PESSOAL <span> / </span> {view === "overview" ? "FINANÇAS" : "RECORRÊNCIAS"}</span></div>
        <div className="topbar-actions"><span className="today-dot"/><span className="topbar-date">{new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "short" }).format(new Date())}</span><div className="topbar-divider"/><button className="icon-button" title="Exportar mês para CSV" onClick={exportCsv}><Download size={17}/></button><button className="avatar top-avatar" title={user.email || "Minha conta"}>{(displayName[0] || "V").toUpperCase()}</button></div>
      </header>

      <div className="page-content">
        {notice && <div className={`toast toast-${notice.type}`} role="status"><span>{notice.type === "success" ? <CheckCircle2 size={18}/> : <CircleHelp size={18}/>}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="Fechar aviso"><X size={15}/></button></div>}

        {view === "overview" ? <>
          <div className="page-heading">
            <div><span className="eyebrow"><span className="eyebrow-dot"/> SEU DINHEIRO EM PERSPECTIVA</span><h1>Olá, {displayName}<span className="heading-period">.</span></h1><p className="muted">Aqui está o retrato das suas finanças.</p></div>
            <button className="btn btn-primary heading-add" onClick={() => openCreate("expense")}><Plus size={18}/> Novo lançamento</button>
          </div>

          <div className="month-row"><div className="month-switcher"><button className="month-arrow" onClick={() => shiftMonth(-1)} aria-label="Mês anterior"><ChevronLeft size={18}/></button><div className="month-current"><CalendarDays size={16}/><span>{monthLabel(month)}</span><ChevronDown size={14}/><input aria-label="Selecionar mês" type="month" value={month} onChange={e => e.target.value && setMonth(e.target.value)}/></div><button className="month-arrow" onClick={() => shiftMonth(1)} aria-label="Próximo mês"><ChevronRight size={18}/></button></div><button className="month-today" onClick={() => setMonth(monthString())}>Ir para este mês</button><span className="sync-label"><span className={`sync-dot ${loading ? "syncing" : ""}`}/>{loading ? "Atualizando" : "Dados sincronizados"}</span></div>

          <section className="summary-grid">
            <article className="summary-card balance-card">
              <div className="summary-card-top"><span className="summary-icon balance-icon"><Wallet size={18}/></span><span className="summary-label">SALDO DO MÊS</span><button className="icon-button balance-eye" onClick={() => setShowBalance(!showBalance)} aria-label={showBalance ? "Ocultar saldo" : "Mostrar saldo"}>{showBalance ? <Eye size={16}/> : <EyeOff size={16}/>}</button></div>
              <div className={`summary-amount balance-amount ${balance < 0 ? "negative" : ""}`}>{showBalance ? brl(balance) : "R$ ••••••"}</div>
              <div className="balance-foot"><span className={`balance-status ${balance >= 0 ? "positive" : "negative"}`}><span>{balance >= 0 ? "↗" : "↘"}</span> {balance >= 0 ? "No azul" : "Saldo negativo"}</span><span className="balance-foot-note">Recebidas − pagas</span></div>
              <div className="balance-wave"><svg viewBox="0 0 360 50" preserveAspectRatio="none" aria-hidden="true"><path d="M0 35 C24 29 32 39 55 31 S88 14 109 26 S143 35 163 19 S203 27 223 16 S257 23 278 12 S323 24 360 5 L360 50 L0 50Z" fill="currentColor" opacity=".08"/><path d="M0 35 C24 29 32 39 55 31 S88 14 109 26 S143 35 163 19 S203 27 223 16 S257 23 278 12 S323 24 360 5" fill="none" stroke="currentColor" strokeWidth="1.4" opacity=".6"/></svg></div>
            </article>
            <article className="summary-card income-card"><div className="summary-card-top"><span className="summary-icon income-icon"><ArrowDownLeft size={18}/></span><span className="summary-label">ENTRADAS</span><span className="summary-kicker">{incomes.length} {incomes.length === 1 ? "item" : "itens"}</span></div><div className="summary-amount">{showBalance ? brl(totalIncome) : "R$ ••••••"}</div><div className="summary-sub"><span className="sub-indicator income-indicator"/> <span>{brl(paidIncome)} recebidos</span><span className="sub-muted">de {brl(totalIncome)}</span></div><div className="progress-track"><span className="progress-income" style={{ width: `${totalIncome ? Math.min(100, paidIncome / totalIncome * 100) : 0}%` }}/></div></article>
            <article className="summary-card expense-card"><div className="summary-card-top"><span className="summary-icon expense-icon"><ArrowUpRight size={18}/></span><span className="summary-label">DESPESAS</span><span className="summary-kicker">{expenses.length} {expenses.length === 1 ? "item" : "itens"}</span></div><div className="summary-amount">{showBalance ? brl(totalExpenses) : "R$ ••••••"}</div><div className="summary-sub"><span className="sub-indicator expense-indicator"/> <span>{brl(paidExpense)} pagos</span><span className="sub-muted">de {brl(totalExpenses)}</span></div><div className="progress-track"><span className="progress-expense" style={{ width: `${totalExpenses ? Math.min(100, paidExpense / totalExpenses * 100) : 0}%` }}/></div></article>
            <article className="summary-card available-card"><div className="summary-card-top"><span className="summary-icon available-icon"><Banknote size={18}/></span><span className="summary-label">DISPONÍVEL</span></div><div className={`summary-amount available-amount ${availableAfterExpenses < 0 ? "negative" : ""}`}>{showBalance ? brl(availableAfterExpenses) : "R$ ••••••"}</div><div className="available-card-note">Após despesas pagas e pendentes</div></article>
          </section>

          <section className="insight-grid">
            <article className="panel spending-panel"><div className="panel-heading"><div><span className="panel-overline">PARA ONDE VAI</span><h2>Mapa das despesas</h2></div><span className="panel-icon"><SlidersHorizontal size={17}/></span></div>
              {expenses.length ? <div className="spending-content"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Pie data={expenseByCategory} dataKey="value" nameKey="name" innerRadius="70%" outerRadius="94%" paddingAngle={3} stroke="none" cornerRadius={3}>{expenseByCategory.map((entry, index) => <Cell key={entry.name} fill={palette[index % palette.length]}/>)}</Pie><Tooltip formatter={(value: unknown) => brl(Number(value))} contentStyle={{ background: "#292724", border: "1px solid #49443e", borderRadius: 10, color: "#f2ede4", fontSize: 12 }} itemStyle={{ color: "#f2ede4" }}/></RechartsPieChart></ResponsiveContainer><div className="donut-center"><span>TOTAL</span><strong>{showBalance ? brl(totalExpenses).replace(",00", "") : "••••"}</strong><small>em despesas</small></div></div><div className="category-legend">{expenseByCategory.slice(0, 5).map((entry, index) => <div className="category-line" key={entry.name}><span className="category-name"><i style={{ background: palette[index % palette.length] }}/>{entry.name}</span><div className="category-right"><strong>{brl(entry.value)}</strong><span>{totalExpenses ? Math.round(entry.value / totalExpenses * 100) : 0}%</span></div></div>)}{expenseByCategory.length > 5 && <span className="muted category-more">+ {expenseByCategory.length - 5} outras categorias</span>}</div></div> : <div className="empty-chart"><div className="empty-illustration"><PieChart size={25}/></div><strong>Seu mapa começa aqui.</strong><span>Adicione despesas para visualizar a distribuição por categoria.</span><button className="text-button" onClick={() => openCreate("expense")}>Adicionar despesa <ArrowRight size={14}/></button></div>}
            </article>
            <article className="panel health-panel"><div className="panel-heading"><div><span className="panel-overline">VISÃO DO MÊS</span><h2>Ritmo financeiro</h2></div><span className="panel-icon"><Zap size={17}/></span></div><div className="health-number-row"><strong>{expenseRatio}%</strong><span>da renda comprometida</span></div><div className="health-track"><span style={{ width: `${Math.min(100, expenseRatio)}%` }}/><i style={{ left: `${Math.min(100, expenseRatio)}%` }}/></div><div className="health-scale"><span>0%</span><span>100%</span></div><div className="health-divider"/><div className="health-stat"><span className="health-stat-icon"><Clock3 size={16}/></span><span>Em aberto no mês</span><strong>{showBalance ? brl(pendingAmount) : "••••••"}</strong></div><div className="health-note"><span className="health-note-mark">i</span><span>{totalIncome === 0 ? "Adicione suas entradas para ver quanto da sua renda está comprometida." : expenseRatio < 70 ? "Você está usando menos de 70% da renda em despesas neste mês." : expenseRatio <= 100 ? "Boa hora para olhar as próximas despesas e planejar o restante do mês." : "As despesas passaram da renda registrada. Revise os lançamentos e o que ainda está em aberto."}</span></div></article>
          </section>

          <section className="transactions-panel panel"><div className="transaction-heading"><div><span className="panel-overline">SEU MÊS, EM DETALHES</span><h2>Lançamentos <span className="title-count">{transactions.length}</span></h2></div><div className="transaction-heading-actions"><button className="btn btn-quiet export-wide" onClick={exportCsv}><Download size={16}/> Exportar</button><button className="btn btn-outline" onClick={() => openCreate("expense")}><Plus size={16}/> Adicionar</button></div></div>
            <div className="transaction-tools"><div className="searchbox"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lançamento..." /></div><div className="filter-tabs"><button className={filter === "all" ? "selected" : ""} onClick={() => setFilter("all")}>Todos <span>{transactions.length}</span></button><button className={filter === "expense" ? "selected" : ""} onClick={() => setFilter("expense")}>Despesas</button><button className={filter === "income" ? "selected" : ""} onClick={() => setFilter("income")}>Entradas</button><button className={filter === "pending" ? "selected" : ""} onClick={() => setFilter("pending")}>Em aberto</button></div><button className="icon-button filter-mobile" onClick={() => setFilter(filter === "pending" ? "all" : "pending")} title="Filtrar pendentes"><Filter size={16}/></button></div>
            {loading && transactions.length === 0 ? <div className="list-loading"><span className="loading-dot"/> Carregando lançamentos…</div> : filtered.length === 0 ? <div className="empty-transactions"><div className="empty-list-icon"><FileText size={22}/></div><strong>{transactions.length ? "Nenhum lançamento encontrado." : "Seu mês começa com um lançamento."}</strong><span>{transactions.length ? "Tente mudar os filtros ou a busca." : "Registre uma entrada ou despesa para acompanhar seu saldo."}</span><button className="btn btn-primary" onClick={() => openCreate("expense")}><Plus size={16}/> Novo lançamento</button>{!transactions.length && <button className="text-button" onClick={loadExamples}>Ou carregar os exemplos da planilha <ArrowRight size={14}/></button>}</div> : <div className="transaction-table-wrap"><table className="transaction-table"><thead><tr><th className="th-description">LANÇAMENTO</th><th>DATA</th><th>CATEGORIA</th><th>STATUS</th><th className="th-amount">VALOR</th><th className="th-actions" /></tr></thead><tbody>{filtered.map(tx => <tr key={tx.id} className={tx.is_paid ? "row-paid" : ""}><td><div className="transaction-name-cell"><span className={`tx-avatar ${tx.type === "income" ? "tx-avatar-income" : "tx-avatar-expense"}`}>{tx.type === "income" ? <ArrowDownLeft size={17}/> : <CreditCard size={16}/>}</span><div className="tx-name-wrap"><strong>{tx.title}</strong><span>{tx.recurring_rule_id && <Repeat2 size={12}/>} {tx.recurring_rule_id ? "Recorrente" : tx.type === "income" ? "Entrada" : "Despesa"}{tx.notes ? ` · ${tx.notes}` : ""}<small className="tx-date-mobile"> · {displayDate(tx.due_date)}</small></span></div></div></td><td><span className="tx-date">{displayDate(tx.due_date)}</span></td><td><span className="category-chip">{tx.category}</span></td><td><button className={`status-pill ${tx.is_paid ? "status-done" : "status-pending"}`} onClick={() => void togglePaid(tx)} title={tx.is_paid ? "Marcar como pendente" : tx.type === "income" ? "Marcar como recebido" : "Marcar despesa como paga"} aria-label={tx.is_paid ? "Marcar como pendente" : tx.type === "income" ? "Marcar como recebido" : "Marcar despesa como paga"}><span>{tx.is_paid ? <Check size={11}/> : <span className="status-dot"/>}</span>{tx.is_paid ? tx.type === "income" ? "Recebido" : "Pago" : "Pendente"}</button></td><td className={`tx-amount ${tx.type === "income" ? "amount-income" : ""}`}>{quickAmountId === tx.id ? <div className="quick-amount-editor"><input aria-label={`Editar valor de ${tx.title}`} inputMode="decimal" autoFocus value={quickAmount} onChange={event => setQuickAmount(event.target.value)} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); void saveQuickAmount(tx); } if (event.key === "Escape") cancelQuickAmount(); }} /><button className="quick-amount-action quick-amount-save" title="Salvar valor" aria-label="Salvar valor" disabled={quickSaving} onClick={() => void saveQuickAmount(tx)}><Check size={13}/></button><button className="quick-amount-action" title="Cancelar edição" aria-label="Cancelar edição" onClick={cancelQuickAmount}><X size={13}/></button></div> : <button className="tx-amount-button" title="Editar valor rapidamente" onClick={() => editQuickAmount(tx)}>{tx.type === "income" ? "+ " : "− "}{showBalance ? brl(Number(tx.amount)) : "R$ ••••••"}</button>}</td><td className="row-actions"><button className="row-action-btn" title="Editar lançamento" onClick={() => openEdit(tx)}><Pencil size={14}/></button><button className="row-action-btn delete-action" title="Excluir lançamento deste mês" onClick={() => void deleteTransaction(tx)}><Trash2 size={14}/></button></td></tr>)}</tbody></table></div>}
            <div className="transaction-footer"><span>Mostrando <strong>{filtered.length}</strong> de <strong>{transactions.length}</strong> lançamentos</span><span className="footer-period"><CalendarDays size={13}/>{monthLabel(month)}</span></div>
          </section>

          {!transactions.length && <section className="import-strip"><div className="import-strip-icon"><FileText size={19}/></div><div><strong>Vindo da sua planilha?</strong><span>Carregue os mesmos itens de despesas e rendas para começar sem digitar tudo de novo.</span></div><button className="btn btn-outline" onClick={loadExamples}><Plus size={15}/> Usar meus exemplos</button></section>}
          <footer className="page-footer"><span>entre<span className="brand-dot">.</span> <i /> Finanças pessoais sem complicação.</span><span>PRIVADO POR PADRÃO <span className="footer-lock">⌑</span></span></footer>
        </> : <>
          <div className="page-heading recurring-page-heading"><div><span className="eyebrow"><span className="eyebrow-dot"/> ORGANIZE O QUE SE REPETE</span><h1>Recorrências<span className="heading-period">.</span></h1><p className="muted">Contas fixas e entradas que aparecem mês após mês.</p></div><button className="btn btn-primary heading-add" onClick={() => openCreate("expense")}><Plus size={18}/> Nova recorrência</button></div>
          <div className="recurring-intro"><div className="recurring-intro-icon"><Repeat2 size={22}/></div><div><strong>Uma vez cadastrada, ela acompanha você.</strong><p>As ocorrências são criadas automaticamente em cada mês. Se mudar o valor de uma conta em um mês específico, edite apenas aquele lançamento — os outros meses não mudam.</p></div></div>
          <div className="rule-stats"><div><span>REGRAS ATIVAS</span><strong>{rules.filter(r => r.active).length}</strong></div><div><span>VOLUME MENSAL RECORRENTE</span><strong>{brl(rules.filter(r=>r.active).reduce((s,r)=>s+Number(r.amount),0))}</strong></div><div><span>PAUSADAS</span><strong>{rules.filter(r => !r.active).length}</strong></div></div>
          <section className="panel rules-panel"><div className="transaction-heading"><div><span className="panel-overline">SEUS COMPROMISSOS</span><h2>Regras cadastradas <span className="title-count">{rules.length}</span></h2></div><span className="rules-private"><span className="sync-dot"/> Sincronizado</span></div>
            {rules.length === 0 ? <div className="empty-transactions recurring-empty"><div className="empty-list-icon"><Repeat2 size={22}/></div><strong>Nenhuma recorrência por enquanto.</strong><span>Aluguel, salário, condomínio e assinaturas são bons candidatos para começar.</span><button className="btn btn-primary" onClick={() => openCreate("expense")}><Plus size={16}/> Criar primeira recorrência</button></div> : <div className="rule-list">{rules.map(rule => <article className={`rule-row ${!rule.active ? "rule-paused" : ""}`} key={rule.id}><div className={`rule-icon ${rule.type === "income" ? "rule-income" : "rule-expense"}`}>{rule.type === "income" ? <ArrowDownLeft size={18}/> : <Repeat2 size={18}/>}</div><div className="rule-info"><div className="rule-title-row"><strong>{rule.title}</strong><span className={`rule-state ${rule.active ? "rule-state-active" : ""}`}>{rule.active ? "Ativa" : "Pausada"}</span></div><span>{rule.category} <i/> Todo dia {String(rule.day_of_month).padStart(2,"0")} <i/> Desde {displayDate(rule.start_date)}</span></div><div className={`rule-amount ${rule.type === "income" ? "amount-income" : ""}`}>{rule.type === "income" ? "+ " : "− "}{brl(Number(rule.amount))}</div><div className="rule-actions"><button className="btn btn-quiet btn-small" onClick={() => setRuleEditing(rule)}><Pencil size={14}/> Editar</button><button className={`rule-toggle ${rule.active ? "toggle-on" : ""}`} onClick={() => void toggleRule(rule)} title={rule.active ? "Pausar recorrência" : "Reativar recorrência"}><span /></button></div></article>)}</div>}
          </section>
          <div className="rule-footnote"><CircleHelp size={16}/><p><strong>Como funciona:</strong> as regras geram uma cópia de cada lançamento no mês. Editar ou excluir uma ocorrência dentro de <em>Visão geral</em> não modifica a regra nem os demais meses. Pausar impede novas ocorrências, mantendo o histórico intacto.</p></div>
          <footer className="page-footer"><span>entre<span className="brand-dot">.</span> <i /> Finanças pessoais sem complicação.</span><span>PRIVADO POR PADRÃO <span className="footer-lock">⌑</span></span></footer>
        </>}
      </div>
    </section>

    <nav className="mobile-bottom-nav"><button className={view === "overview" ? "mobile-nav-active" : ""} onClick={() => setView("overview")}><Home size={19}/><span>Visão geral</span></button><button className="mobile-add-button" onClick={() => openCreate("expense")}><Plus size={22}/><span>Novo</span></button><button className={view === "recurring" ? "mobile-nav-active" : ""} onClick={() => { setView("recurring"); void loadRules(); }}><Repeat2 size={19}/><span>Recorrências</span></button></nav>

    {txModal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setTxModal(false); }}><section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="tx-modal-title"><div className="modal-header"><div><span className="panel-overline">{editing ? "AJUSTAR LANÇAMENTO" : "NOVO REGISTRO"}</span><h2 id="tx-modal-title">{editing ? "Editar lançamento" : "Adicionar lançamento"}</h2><p>{editing?.recurring_rule_id ? "A alteração vale apenas para esta ocorrência." : "O que entrou ou saiu do seu mês?"}</p></div><button className="icon-button modal-close" onClick={() => setTxModal(false)} aria-label="Fechar"><X size={19}/></button></div>
      <form className="tx-form" onSubmit={saveTransaction}><div className="form-type-switch"><button type="button" className={form.type === "expense" ? "type-selected type-expense" : ""} onClick={() => setForm(f => ({ ...f, type: "expense", category: expenseCategories.includes(f.category) ? f.category : "Moradia" }))}><ArrowUpRight size={17}/> Despesa</button><button type="button" className={form.type === "income" ? "type-selected type-income" : ""} onClick={() => setForm(f => ({ ...f, type: "income", category: incomeCategories.includes(f.category) ? f.category : "Salário" }))}><ArrowDownLeft size={17}/> Entrada</button></div>
        <label className="field-label">Descrição<input autoFocus value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder={form.type === "expense" ? "Ex.: Aluguel, mercado…" : "Ex.: Salário, freelance…"} required maxLength={100}/></label>
        <div className="form-two-col"><label className="field-label">Valor (R$)<div className="amount-input-wrap"><span>R$</span><input inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} onBlur={() => { if (form.amount.trim()) setForm(f => ({ ...f, amount: formatMoneyInput(f.amount) })); }} placeholder="0,00" required /></div></label><label className="field-label">Data<input type="date" value={form.due_date} min={editing?.recurring_rule_id ? firstDay(month) : undefined} max={editing?.recurring_rule_id ? lastDay(month) : undefined} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} required/></label></div>
        <label className="field-label">Categoria<select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{(form.type === "expense" ? expenseCategories : incomeCategories).map(c => <option key={c} value={c}>{c}</option>)}</select></label>
        <label className="field-label">Observações <span className="optional-label">OPCIONAL</span><textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Algum detalhe útil…" rows={2} maxLength={400}/></label>
        <div className="form-status-row"><div><strong>{form.type === "income" ? "Já recebi este valor" : "Já paguei esta despesa"}</strong><span>Você pode alterar o status depois.</span></div><button type="button" role="switch" aria-checked={form.is_paid} className={`switch ${form.is_paid ? "switch-on" : ""}`} onClick={() => setForm(f => ({ ...f, is_paid: !f.is_paid }))}><span/></button></div>
        {!editing && <label className="recurring-check"><input type="checkbox" checked={form.recurring} onChange={e => setForm(f => ({ ...f, recurring: e.target.checked }))}/><span className="custom-checkbox"><Check size={12}/></span><span className="recurring-check-copy"><strong>Repetir todo mês</strong><small>Cria uma ocorrência em cada mês futuro. Você poderá editar cada mês separadamente.</small></span><Repeat2 size={18} className="recurring-check-icon"/></label>}
        {editing?.recurring_rule_id && <div className="instance-note"><Repeat2 size={16}/><span>Este lançamento faz parte de uma recorrência. As alterações serão aplicadas <strong>somente a {monthLabel(editing.due_date.slice(0,7))}.</strong></span></div>}
        <div className="modal-footer"><button type="button" className="btn btn-quiet" onClick={() => setTxModal(false)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Salvando…" : editing ? "Salvar alterações" : "Salvar lançamento"}<ArrowRight size={16}/></button></div>
      </form>
    </section></div>}

    {ruleEditing && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setRuleEditing(null); }}><section className="modal-card rule-modal" role="dialog" aria-modal="true" aria-labelledby="rule-modal-title"><div className="modal-header"><div><span className="panel-overline">REGRA RECORRENTE</span><h2 id="rule-modal-title">Editar recorrência</h2><p>As mudanças valem para as próximas ocorrências.</p></div><button className="icon-button modal-close" onClick={() => setRuleEditing(null)} aria-label="Fechar"><X size={19}/></button></div><form className="tx-form" onSubmit={saveRule}><label className="field-label">Descrição<input name="rule-title" defaultValue={ruleEditing.title} required maxLength={100}/></label><div className="form-two-col"><label className="field-label">Valor (R$)<input name="rule-amount" defaultValue={Number(ruleEditing.amount).toFixed(2).replace(".",",")} required inputMode="decimal"/></label><label className="field-label">Dia do mês<input name="rule-day" type="number" min="1" max="31" defaultValue={ruleEditing.day_of_month} required/></label></div><label className="field-label">Categoria<select name="rule-category" defaultValue={ruleEditing.category}>{(ruleEditing.type === "expense" ? expenseCategories : incomeCategories).map(c => <option key={c} value={c}>{c}</option>)}</select></label><div className="form-two-col"><label className="field-label">Começa em<input name="rule-start" type="date" defaultValue={ruleEditing.start_date} required/></label><label className="field-label">Termina em <span className="optional-label">OPCIONAL</span><input name="rule-end" type="date" defaultValue={ruleEditing.end_date || ""}/></label></div><label className="rule-active-check"><input type="checkbox" name="rule-active" defaultChecked={ruleEditing.active}/> Regra ativa — gerar ocorrências futuras</label><div className="instance-note"><CircleHelp size={16}/><span>As alterações não reescrevem lançamentos que já existem nos meses anteriores.</span></div><div className="modal-footer"><button type="button" className="btn btn-quiet" onClick={() => setRuleEditing(null)}>Cancelar</button><button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Salvando…" : "Salvar regra"}<ArrowRight size={16}/></button></div></form></section></div>}
  </main>;
}
