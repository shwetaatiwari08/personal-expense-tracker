import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus, Trash2, Pencil, Search, Wallet, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, X, IndianRupee, Filter
} from "lucide-react";
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import "./styles.css";

const categories = ["Food", "Travel", "Bills", "Shopping", "Health", "Education", "Entertainment", "Other"];

const demoTransactions = [
  { id: "1", title: "Monthly Salary", amount: 45000, type: "income", category: "Other", date: "2026-09-01", note: "September salary" },
  { id: "2", title: "Groceries", amount: 2400, type: "expense", category: "Food", date: "2026-09-03", note: "" },
  { id: "3", title: "Metro & Auto", amount: 1200, type: "expense", category: "Travel", date: "2026-09-04", note: "" },
  { id: "4", title: "Electricity Bill", amount: 1800, type: "expense", category: "Bills", date: "2026-09-05", note: "" },
  { id: "5", title: "Online Shopping", amount: 3200, type: "expense", category: "Shopping", date: "2026-09-06", note: "" }
];

const ExpenseContext = createContext();

function ExpenseProvider({ children }) {
  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem("expense-tracker-transactions");
      return saved ? JSON.parse(saved) : demoTransactions;
    } catch { return demoTransactions; }
  });

  useEffect(() => {
    localStorage.setItem("expense-tracker-transactions", JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = tx => setTransactions(prev => [{ ...tx, id: crypto.randomUUID() }, ...prev]);
  const updateTransaction = tx => setTransactions(prev => prev.map(x => x.id === tx.id ? tx : x));
  const deleteTransaction = id => setTransactions(prev => prev.filter(x => x.id !== id));

  return <ExpenseContext.Provider value={{ transactions, addTransaction, updateTransaction, deleteTransaction }}>
    {children}
  </ExpenseContext.Provider>;
}

function useExpenses() { return useContext(ExpenseContext); }

function App() {
  const { transactions, addTransaction, updateTransaction, deleteTransaction } = useExpenses();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s,t) => s+t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s,t) => s+t.amount, 0);
  const balance = totalIncome - totalExpense;

  const filtered = transactions.filter(t => {
    const matchesQuery = `${t.title} ${t.category} ${t.note}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All" || t.category === filter;
    return matchesQuery && matchesFilter;
  });

  const categoryData = categories.map(category => ({
    name: category,
    value: transactions.filter(t => t.type === "expense" && t.category === category)
      .reduce((s,t) => s+t.amount, 0)
  })).filter(x => x.value > 0);

  const monthlyData = Array.from({length: 6}, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5-i));
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    return {
      month: d.toLocaleString("en-IN", { month: "short" }),
      income: transactions.filter(t => t.type === "income" && t.date.startsWith(key)).reduce((s,t)=>s+t.amount,0),
      expense: transactions.filter(t => t.type === "expense" && t.date.startsWith(key)).reduce((s,t)=>s+t.amount,0)
    };
  });

  function openAdd() { setEditing(null); setShowForm(true); }
  function openEdit(tx) { setEditing(tx); setShowForm(true); }

  return (
    <div className="app">
      <header className="header">
        <div>
          <div className="brand"><Wallet size={26}/> <span>MoneyTrack</span></div>
          <p className="subtitle">Personal Expense Tracker</p>
        </div>
        <button className="primary-btn" onClick={openAdd}><Plus size={18}/> Add Transaction</button>
      </header>

      <main className="container">
        <section className="summary-grid">
          <Summary title="Total Income" amount={totalIncome} icon={<TrendingUp/>} type="income"/>
          <Summary title="Total Expenses" amount={totalExpense} icon={<TrendingDown/>} type="expense"/>
          <Summary title="Current Balance" amount={balance} icon={<Wallet/>} type="balance"/>
        </section>

        <section className="charts-grid">
          <div className="card chart-card">
            <div className="section-head"><div><h2>Spending by Category</h2><p>Where your money goes</p></div></div>
            {categoryData.length ? <ResponsiveContainer width="100%" height={270}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {categoryData.map((_,i)=><Cell key={i} fill={`hsl(${210 + i*28} 70% ${55 - i*2}%)`}/>)}
                </Pie>
                <Tooltip formatter={v => `₹${Number(v).toLocaleString("en-IN")}`}/>
                <Legend/>
              </PieChart>
            </ResponsiveContainer> : <Empty text="Add expenses to see the category breakdown."/>}
          </div>

          <div className="card chart-card">
            <div className="section-head"><div><h2>Income vs Expenses</h2><p>Financial activity over recent months</p></div></div>
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                <XAxis dataKey="month"/>
                <YAxis tickFormatter={v=>`₹${v/1000}k`}/>
                <Tooltip formatter={v => `₹${Number(v).toLocaleString("en-IN")}`}/>
                <Legend/>
                <Bar dataKey="income" name="Income" radius={[5,5,0,0]}/>
                <Bar dataKey="expense" name="Expense" radius={[5,5,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="card transactions-card">
          <div className="section-head">
            <div><h2>Transactions</h2><p>Manage your daily income and expenses</p></div>
            <div className="controls">
              <div className="search"><Search size={17}/><input placeholder="Search..." value={query} onChange={e=>setQuery(e.target.value)}/></div>
              <div className="select-wrap"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>All</option>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
            </div>
          </div>

          {filtered.length ? <div className="table-wrap">
            <table>
              <thead><tr><th>Transaction</th><th>Category</th><th>Date</th><th>Type</th><th>Amount</th><th></th></tr></thead>
              <tbody>{filtered.map(tx =>
                <tr key={tx.id}>
                  <td><div className="tx-title">{tx.title}</div>{tx.note && <div className="tx-note">{tx.note}</div>}</td>
                  <td><span className="tag">{tx.category}</span></td>
                  <td>{new Date(tx.date + "T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td>
                  <td><span className={`type ${tx.type}`}>{tx.type === "income" ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>} {tx.type}</span></td>
                  <td className={`amount ${tx.type}`}>{tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}</td>
                  <td><div className="actions"><button onClick={()=>openEdit(tx)} aria-label="Edit"><Pencil size={16}/></button><button className="danger" onClick={()=>deleteTransaction(tx.id)} aria-label="Delete"><Trash2 size={16}/></button></div></td>
                </tr>
              )}</tbody>
            </table>
          </div> : <Empty text="No matching transactions found."/>}
        </section>
      </main>

      {showForm && <TransactionModal initial={editing} onClose={()=>setShowForm(false)} onSave={tx=>{editing ? updateTransaction(tx) : addTransaction(tx); setShowForm(false)}}/>}
    </div>
  );
}

function Summary({title, amount, icon, type}) {
  return <div className={`summary card ${type}`}><div className="summary-icon">{icon}</div><div><p>{title}</p><h3>₹{amount.toLocaleString("en-IN")}</h3><span>{type === "income" ? "Money received" : type === "expense" ? "Money spent" : "Available balance"}</span></div></div>
}

function Empty({text}) { return <div className="empty">{text}</div>; }

function TransactionModal({initial, onClose, onSave}) {
  const [form, setForm] = useState(initial || {
    title:"", amount:"", type:"expense", category:"Food",
    date:new Date().toISOString().slice(0,10), note:""
  });

  function change(e) {
    const {name,value} = e.target;
    setForm(prev => ({...prev,[name]: name==="amount" ? value : value}));
  }

  function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || Number(form.amount) <= 0) return;
    onSave({...form, amount:Number(form.amount)});
  }

  return <div className="overlay" onMouseDown={e=>e.target===e.currentTarget && onClose()}>
    <form className="modal" onSubmit={submit}>
      <div className="modal-head"><div><h2>{initial ? "Edit Transaction" : "Add Transaction"}</h2><p>Record your financial activity</p></div><button type="button" onClick={onClose}><X/></button></div>
      <label>Title<input name="title" value={form.title} onChange={change} placeholder="e.g. Grocery shopping" required/></label>
      <div className="two-col">
        <label>Amount (₹)<input name="amount" type="number" min="1" value={form.amount} onChange={change} placeholder="0" required/></label>
        <label>Date<input name="date" type="date" value={form.date} onChange={change} required/></label>
      </div>
      <div className="two-col">
        <label>Type<select name="type" value={form.type} onChange={change}><option value="expense">Expense</option><option value="income">Income</option></select></label>
        <label>Category<select name="category" value={form.category} onChange={change}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      </div>
      <label>Note (optional)<textarea name="note" value={form.note} onChange={change} placeholder="Add a short note..."/></label>
      <div className="modal-actions"><button type="button" className="secondary-btn" onClick={onClose}>Cancel</button><button className="primary-btn" type="submit"><IndianRupee size={17}/>{initial ? "Save Changes" : "Add Transaction"}</button></div>
    </form>
  </div>;
}

createRoot(document.getElementById("root")).render(<ExpenseProvider><App/></ExpenseProvider>);
