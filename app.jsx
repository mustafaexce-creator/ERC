import React, { useState, useEffect, useCallback } from 'https://esm.sh/react@18';
import { createRoot } from 'https://esm.sh/react-dom@18/client';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { config } from './config.js';

const MODERATOR_USERNAME = config.MODERATOR_USERNAME;
const MODERATOR_PASSWORD = config.MODERATOR_PASSWORD;
const SUPABASE_URL = config.SUPABASE_URL;
const SUPABASE_ANON_KEY = config.SUPABASE_ANON_KEY;
const TELEGRAM_BOT_TOKEN = config.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = config.TELEGRAM_CHAT_ID;

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const AVATARS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-fuchsia-500'];
const AVATAR_COLORS = AVATARS;

const sendTg = (member, team, task, link) => {
    const text = `🔔 <b>New Submission</b>\n👤 Submitted by: ${member}\n🏷 Team: ${team}\n📋 Task: ${task}\n🔗 Link: ${link}\n⏰ Submitted at: ${new Date().toLocaleString()}`;
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, parse_mode: "HTML", text })
    }).catch(() => { });
};

const Spinner = () => <svg className="animate-spin w-6 h-6 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>;
const RedSpinner = () => <div className="flex h-full w-full items-center justify-center py-20"><svg className="animate-spin w-12 h-12 text-[#E20A17]" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg></div>;

const Empty = ({ msg, icon: Icon }) => (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Icon className="w-16 h-16 mb-4 opacity-50" />
        <p className="text-gray-500 font-medium">{msg}</p>
    </div>
);

const Ico = {
    Tasks: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
    Users: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
    Trophy: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2-1.343-2-3-2zM4.5 4h15m-15 4h15m-15 4h15M6 16v2a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
    Check: (p) => <svg {...p} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
};

const Modal = ({ open, close, title, children }) => open ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 transform scale-100 opacity-100 transition-all max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">{title}</h2><button onClick={close} className="text-gray-500 font-bold text-xl hover:text-black">×</button></div>
            {children}
        </div>
    </div>
) : null;

const Confirm = ({ open, close, onConfirm, msg, loading }) => (
    <Modal open={open} close={close} title="Confirm">
        <p className="mb-6">{msg}</p>
        <div className="flex justify-end gap-3">
            <button onClick={close} disabled={loading} className="px-4 py-2 bg-gray-200 rounded-lg font-medium">Cancel</button>
            <button onClick={onConfirm} disabled={loading} className="px-4 py-2 bg-[#E20A17] text-white rounded-lg font-medium w-24 flex justify-center">{loading ? <Spinner /> : 'Confirm'}</button>
        </div>
    </Modal>
);

const SlidePanel = ({ open, close, title, children }) => open ? (
    <div className="fixed inset-0 z-40 bg-black/50 flex justify-end">
        <div className="w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto transform translate-x-0 transition-transform rounded-l-3xl">
            <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold">{title}</h2><button onClick={close} className="text-gray-500 font-bold text-xl hover:text-black">×</button></div>
            {children}
        </div>
    </div>
) : null;

// MAIN APP
export default function App() {
    const [auth, setAuth] = useState(null); // {role, user}
    const [page, setPage] = useState('My Tasks');
    const [toasts, setToasts] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const notify = useCallback((msg, type = 'success') => {
        const id = Date.now();
        setToasts(p => [...p, { id, msg, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3000);
    }, []);


    // Restore session from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('mtm_session');
        if (saved) {
            try {
                const session = JSON.parse(saved);
                if (session && session.role && session.user) {
                    setAuth(session);
                    setPage(session.role === 'Moderator' ? 'Dashboard' : 'My Tasks');
                }
            } catch (e) { localStorage.removeItem('mtm_session'); }
        }
    }, []);

    const doLogout = () => {
        setAuth(null);
        localStorage.removeItem('mtm_session');
    };

    const LoginScreen = () => {
        const [role, setRole] = useState('Member');
        const [mode, setMode] = useState('login'); // 'login' or 'register'
        const [loading, setLoading] = useState(false);
        const [initLoading, setInitLoading] = useState(true);
        const [user, setUser] = useState('');
        const [pass, setPass] = useState('');
        const [remember, setRemember] = useState(true);
        // Registration extras
        const [teams, setTeams] = useState([]);
        const [teamId, setTeamId] = useState('');

        useEffect(() => {
            supabase.from('teams').select('*').then(({ data }) => {
                setTeams(data || []);
                if (data?.length) setTeamId(data[0].id);
                setInitLoading(false);
            });
        }, []);

        const doLogin = async (e) => {
            e.preventDefault();
            setLoading(true);
            if (role === 'Moderator') {
                if (user === MODERATOR_USERNAME && pass === MODERATOR_PASSWORD) {
                    const session = { role: 'Moderator', user: { name: 'Moderator' } };
                    setAuth(session);
                    setPage('Dashboard');
                    if (remember) localStorage.setItem('mtm_session', JSON.stringify(session));
                } else notify('Invalid credentials', 'error');
            } else {
                const { data, error } = await supabase.from('members').select('*').eq('name', user).single();
                if (error || !data) { notify('Account not found', 'error'); }
                else if (data.password !== pass) { notify('Wrong password', 'error'); }
                else {
                    const session = { role: 'Member', user: data };
                    setAuth(session);
                    setPage('My Tasks');
                    if (remember) localStorage.setItem('mtm_session', JSON.stringify(session));
                }
            }
            setLoading(false);
        };

        const doRegister = async (e) => {
            e.preventDefault();
            setLoading(true);
            if (!user.trim() || !pass.trim()) { notify('Name and password required', 'error'); setLoading(false); return; }
            if (pass.length < 4) { notify('Password must be at least 4 characters', 'error'); setLoading(false); return; }
            // Check if name taken
            const { data: existing } = await supabase.from('members').select('id').eq('name', user.trim()).single();
            if (existing) { notify('Name already taken', 'error'); setLoading(false); return; }
            const { data: newMem, error } = await supabase.from('members').insert([{
                name: user.trim(),
                password: pass,
                avatar_index: Math.floor(Math.random() * 12),
                team_id: teamId || null
            }]).select().single();
            if (error) { notify('Registration failed: ' + error.message, 'error'); setLoading(false); return; }
            const session = { role: 'Member', user: newMem };
            setAuth(session);
            setPage('My Tasks');
            if (remember) localStorage.setItem('mtm_session', JSON.stringify(session));
            notify('Account created! Welcome, ' + newMem.name);
            setLoading(false);
        };

        if (initLoading) return <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center"><RedSpinner /></div>;

        return (
            <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm">
                    <div className="flex justify-center mb-4">
                        <img src="logo.png" alt="Logo" className="h-16 w-auto object-contain" />
                    </div>
                    <h1 className="text-center text-2xl font-bold font-['Inter'] mb-8 text-[#1A1A1A]">Media Task Manager</h1>
                    <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                        <button type="button" onClick={() => setRole('Member')} className={`flex-1 py-1 rounded-md text-sm font-medium ${role === 'Member' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Member</button>
                        <button type="button" onClick={() => setRole('Moderator')} className={`flex-1 py-1 rounded-md text-sm font-medium ${role === 'Moderator' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Moderator</button>
                    </div>
                    {role === 'Member' && (
                        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                            <button type="button" onClick={() => setMode('login')} className={`flex-1 py-1 rounded-md text-sm font-medium ${mode === 'login' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Login</button>
                            <button type="button" onClick={() => setMode('register')} className={`flex-1 py-1 rounded-md text-sm font-medium ${mode === 'register' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>Create Account</button>
                        </div>
                    )}
                    <form onSubmit={role === 'Member' && mode === 'register' ? doRegister : doLogin} className="space-y-4">
                        <input type="text" placeholder={role === 'Moderator' ? 'Username' : 'Your Name'} required value={user} onChange={e => setUser(e.target.value)} className="w-full border-gray-200 border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-[#E20A17] text-sm" />
                        <input type="password" placeholder="Password" required value={pass} onChange={e => setPass(e.target.value)} className="w-full border-gray-200 border rounded-2xl p-3 outline-none focus:ring-2 focus:ring-[#E20A17] text-sm" />
                        {role === 'Member' && mode === 'register' && (
                            <select value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full border rounded-lg p-3 outline-none">
                                <option value="">No Team</option>
                                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        )}
                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="accent-[#C8102E] w-4 h-4" />
                            Keep me logged in
                        </label>
                        <button type="submit" disabled={loading} className="w-full bg-[#E20A17] hover:bg-[#c20813] text-white py-3 rounded-2xl font-bold transition-colors flex justify-center shadow-md">
                            {loading ? <Spinner /> : (role === 'Member' && mode === 'register' ? 'Create Account' : 'Login')}
                        </button>
                    </form>
                </div>
            </div>
        );
    };

    const Dashboard = () => {
        const [d, setD] = useState(null);
        const [todos, setTodos] = useState([]);
        const [newTodo, setNewTodo] = useState('');

        useEffect(() => {
            const savedTodos = localStorage.getItem('todos_' + auth?.user?.id);
            if (savedTodos) setTodos(JSON.parse(savedTodos));

            Promise.all([
                supabase.from('tasks').select('*'),
                supabase.from('teams').select('*'),
                supabase.from('notifications').select('*, members(name), tasks(title)').order('created_at', { ascending: false }).limit(10)
            ]).then(([tk, tm, nt]) => setD({ tasks: tk.data || [], teams: tm.data || [], notifs: nt.data || [] })).catch(() => notify('Fetch error', 'error'));
        }, []);

        useEffect(() => {
            if (auth?.user?.id) {
                localStorage.setItem('todos_' + auth.user.id, JSON.stringify(todos));
            }
        }, [todos, auth?.user?.id]);

        const addTodo = (e) => {
            e.preventDefault();
            if (!newTodo.trim()) return;
            setTodos([...todos, { id: Date.now(), text: newTodo, done: false }]);
            setNewTodo('');
        };
        const toggleTodo = (id) => setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
        const deleteTodo = (id) => setTodos(todos.filter(t => t.id !== id));

        if (!d) return <RedSpinner />;

        const total = d.tasks.length;
        const pending = d.tasks.filter(t => t.status === 'In Review').length;
        const running = d.tasks.filter(t => t.status === 'Open').length;
        const ended = d.tasks.filter(t => t.status === 'Approved' || t.status === 'Rejected').length;
        const progressPct = total > 0 ? Math.round((ended / total) * 100) : 0;

        const chartData = d.teams.map(t => ({ ...t, count: d.tasks.filter(x => x.team_id === t.id).length }));
        const max = Math.max(...chartData.map(c => c.count), 1);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return date;
        });

        const analyticsData = last7Days.map(date => {
            const dayStr = date.toLocaleDateString('en-US', { weekday: 'short' })[0];
            const dateStr = date.toISOString().split('T')[0];
            const count = d.tasks.filter(t => t.created_at && t.created_at.startsWith(dateStr)).length;
            return { day: dayStr, count };
        });
        const maxTasksDay = Math.max(...analyticsData.map(a => a.count), 1);

        const markRead = async () => {
            await supabase.from('notifications').update({ is_read: true }).neq('is_read', true);
            setD({ ...d, notifs: d.notifs.map(n => ({ ...n, is_read: true })) });
        };

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-end mb-8 md:hidden">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Dashboard</h1>
                        <p className="text-sm text-gray-500 font-medium">Plan, prioritize, and accomplish your tasks with ease.</p>
                    </div>
                </div>
                <div className="hidden md:flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-1">Dashboard</h1>
                        <p className="text-sm text-gray-500 font-medium">Plan, prioritize, and accomplish your tasks with ease.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-[#E20A17] text-white px-6 py-2.5 rounded-full font-bold shadow-md hover:bg-[#c20813] transition-colors flex items-center gap-2">
                            <span className="text-lg">+</span> Add Project
                        </button>
                        <button className="bg-white border border-gray-200 text-gray-700 px-6 py-2.5 rounded-full font-bold shadow-sm hover:bg-gray-50 transition-colors">
                            Import Data
                        </button>
                    </div>
                </div>

                {/* Stat Cards Row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Primary Card */}
                    <div className="bg-[#E20A17] p-6 rounded-[24px] shadow-sm text-white flex flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-6 right-6 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 transform rotate-45 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                        </div>
                        <p className="text-sm font-medium opacity-90 mb-4">Total Projects</p>
                        <p className="text-5xl font-extrabold mb-6 tracking-tight">{total}</p>
                        <div className="flex items-center gap-2 text-xs font-medium bg-black/10 w-max px-3 py-1.5 rounded-full">
                            <span className="p-0.5 bg-white text-[#E20A17] rounded-sm">
                                <svg className="w-2.5 h-2.5 transform -rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            </span>
                            Increased from last month
                        </div>
                    </div>

                    {/* Secondary Cards */}
                    {[
                        { label: 'Ended Projects', val: ended, icon: 'up' },
                        { label: 'Running Projects', val: running, icon: 'up' },
                        { label: 'Pending Project', val: pending, icon: 'up', sub: 'On Discuss', noBg: true }
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-6 rounded-[24px] shadow-sm flex flex-col justify-between relative border border-gray-100">
                            <div className="absolute top-6 right-6 w-8 h-8 border border-gray-200 rounded-full flex items-center justify-center">
                                <svg className={`w-4 h-4 text-gray-500 transform ${s.icon === 'up' ? 'rotate-45' : '-rotate-45'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            </div>
                            <p className="text-sm font-medium text-gray-500 mb-4">{s.label}</p>
                            <p className="text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">{s.val}</p>
                            {s.noBg ? (
                                <p className="text-xs font-bold text-gray-400">{s.sub}</p>
                            ) : (
                                <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 w-max px-3 py-1.5 rounded-full border border-gray-100">
                                    <span className="p-0.5 bg-gray-200 text-gray-600 rounded-sm">
                                        <svg className={`w-2.5 h-2.5 transform ${s.icon === 'up' ? '-rotate-45' : 'rotate-135'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    </span>
                                    Increased from last month
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Main Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                    {/* Left Column (Stats & Team) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Project Analytics (Top Left) */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex-1">
                            <h2 className="font-bold text-lg mb-8">Team Analytics</h2>
                            <div className="flex items-end justify-around h-48 pb-6 border-b border-gray-100 px-4">
                                {chartData.slice(0, 7).map((t, i) => {
                                    const isHighlight = t.count === max && max > 0;
                                    const h = max > 0 ? `${(t.count / max) * 100}%` : '5%';
                                    return (
                                        <div key={i} className="flex flex-col items-center gap-4 w-16 group">
                                            {isHighlight && <div className="text-xs font-bold bg-gray-100 px-2 py-1 rounded-md mb-2">{t.count} Tasks</div>}
                                            <div className="w-full relative rounded-full overflow-hidden" style={{ height: '140px' }}>
                                                {/* Background pattern for unfilled vs filled */}
                                                <div className={`absolute bottom-0 w-full rounded-full transition-all duration-500 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxwYXRoIGQ9Ik0tMSwxIGwyLC0yIE0wLDQgbDQsLTQgTTMsNSBsMiwtMiIgc3Ryb2tlPSIjZThlOGU4IiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] border border-gray-200`}>
                                                    <div className="absolute bottom-0 w-full rounded-full transition-all duration-500" style={{ height: h, backgroundColor: t.count > 0 ? (t.color_accent || '#E20A17') : 'transparent', opacity: isHighlight ? 1 : 0.7 }}></div>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-800 text-center truncate w-full" style={{ color: t.color_accent }}>{t.name.split(' ')[0]}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Reminders, Progress) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Reminders / To-Do List */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col min-h-[300px] max-h-96">
                            <h2 className="font-bold text-lg mb-4">To-Do List</h2>
                            <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                                {todos.length === 0 ? (
                                    <p className="text-sm text-gray-400 text-center py-4">No tasks yet. Add one!</p>
                                ) : (
                                    todos.map(t => (
                                        <div key={t.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors border border-transparent group">
                                            <button onClick={() => toggleTodo(t.id)} className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors ${t.done ? 'bg-[#E20A17] text-white' : 'border-2 border-gray-300 hover:border-[#E20A17]'}`}>
                                                {t.done && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                            </button>
                                            <span className={`text-sm font-medium flex-1 ${t.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{t.text}</span>
                                            <button onClick={() => deleteTodo(t.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                            <form onSubmit={addTodo} className="mt-auto relative">
                                <input type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)} placeholder="Add a new task..." className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-4 pr-10 text-sm outline-none focus:ring-2 focus:ring-[#E20A17]/20 focus:border-[#E20A17]" />
                                <button type="submit" disabled={!newTodo.trim()} className="absolute right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 bg-[#E20A17] text-white rounded-lg flex items-center justify-center disabled:opacity-50 hover:bg-[#c20813] transition-colors">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                </button>
                            </form>
                        </div>

                        {/* Project Progress */}
                        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex-1 flex flex-col">
                            <h2 className="font-bold text-lg mb-2">Project Progress</h2>
                            <div className="flex-1 flex flex-col items-center justify-center">
                                {/* SVG Donut Chart */}
                                <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                                        {/* Background track */}
                                        <circle cx="50" cy="50" r="40" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                                        {/* Progress track */}
                                        <circle cx="50" cy="50" r="40" stroke="#E20A17" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * progressPct) / 100} strokeLinecap="round" className="transition-all duration-1000" />
                                        {/* Additional segments */}
                                        <circle cx="50" cy="50" r="40" stroke="#ff7575" strokeWidth="12" fill="none" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * ((running / (total || 1)) * 100)) / 100} strokeLinecap="round" className="transform origin-center transition-all duration-1000" style={{ transform: `rotate(${Math.round(progressPct * 3.6)}deg)` }} />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-4xl font-black text-gray-900">{progressPct}%</span>
                                        <span className="text-[10px] font-bold text-gray-400 mt-1">Project Ended</span>
                                    </div>
                                </div>
                                {/* Legend */}
                                <div className="flex gap-4 text-xs font-bold text-gray-500 w-full justify-center">
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#E20A17]"></div>Completed</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-[#ff7575]"></div>In Progress</div>
                                    <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div>Pending</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const TasksModal = ({ t, close, teams, onSave }) => {
        const [frm, setFrm] = useState(t?.id ? t : { title: '', description: '', team_id: teams[0]?.id, priority: 'Medium', deadline: new Date().toISOString().split('T')[0] });
        const [l, setL] = useState(false);
        const save = async (e) => {
            e.preventDefault(); setL(true);
            const payload = { title: frm.title, description: frm.description, team_id: frm.team_id, deadline: new Date(frm.deadline).toISOString(), status: frm.status || 'Open' };
            try {
                if (frm.id) { payload.updated_at = new Date().toISOString(); await supabase.from('tasks').update(payload).eq('id', frm.id); }
                else { await supabase.from('tasks').insert([payload]); }
                onSave(); close();
            } catch (e) { } finally { setL(false); }
        };
        return (
            <Modal open={true} close={close} title={frm.id ? "Edit Task" : "Create Task"}>
                <form onSubmit={save} className="space-y-4">
                    <input required type="text" placeholder="Title" value={frm.title} onChange={e => setFrm({ ...frm, title: e.target.value })} className="w-full p-2 border rounded outline-none" />
                    <textarea required placeholder="Description" value={frm.description} onChange={e => setFrm({ ...frm, description: e.target.value })} className="w-full p-2 border rounded outline-none" rows="3"></textarea>
                    <div className="grid grid-cols-2 gap-4">
                        <select value={frm.team_id} onChange={e => setFrm({ ...frm, team_id: e.target.value })} className="p-2 border rounded outline-none col-span-2">{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
                    </div>
                    <button disabled={l} className="w-full bg-[#C8102E] text-white py-2 rounded font-bold flex justify-center">{l ? <Spinner /> : 'Save'}</button>
                </form>
            </Modal>
        );
    };

    const Tasks = () => {
        const [d, setD] = useState(null);
        const [fT, setFT] = useState('All');
        const [fS, setFS] = useState('All');
        const [editT, setEditT] = useState(null);
        const [del, setDel] = useState(null);
        const [vs, setVs] = useState(null);
        const [ld, setLd] = useState(false);
        const [note, setNote] = useState('');

        const load = useCallback(() => {
            Promise.all([
                supabase.from('tasks').select('*, teams(name, color_accent)').order('created_at', { ascending: false }),
                supabase.from('submissions').select('*, members(name)'),
                supabase.from('teams').select('*')
            ]).then(([tk, sb, tmres]) => setD({ t: tk.data || [], s: sb.data || [], tm: tmres.data || [] })).catch(() => notify('Error', 'error'));
        }, [notify]);
        useEffect(() => { load(); }, [load]);

        const performDelete = async () => {
            setLd(true);
            await supabase.from('submissions').delete().eq('task_id', del.id);
            await supabase.from('tasks').delete().eq('id', del.id);
            notify('Deleted'); setDel(null); setLd(false); load();
        };

        const approveAll = async (tk) => {
            setLd(true);
            await supabase.from('submissions').update({ status: 'Approved' }).eq('task_id', tk.id);
            await supabase.from('tasks').update({ status: 'Approved', updated_at: new Date().toISOString() }).eq('id', tk.id);
            notify('Approved ALL'); setLd(false); load();
        };

        const review = async (sub, st) => {
            setLd(true);
            await supabase.from('submissions').update({ status: st }).eq('id', sub.id);
            await supabase.from('tasks').update({ status: st, updated_at: new Date().toISOString() }).eq('id', sub.task_id); // update parent
            if (st === 'Rejected') { await supabase.from('notifications').insert([{ message: `Rejected submission for`, member_id: sub.member_id, task_id: sub.task_id }]); }
            notify(st); setLd(false); setNote(''); load();
            if (vs) {
                setD(prev => ({ ...prev, s: prev.s.map(x => x.id === sub.id ? { ...x, status: st } : x) }));
            }
        };

        if (!d) return <RedSpinner />;

        const filtered = d.t.filter(x => (fT === 'All' || x.teams?.name === fT) && (fS === 'All' || x.status === fS));

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Task Management</h1>
                </div>

                <div className="flex flex-wrap gap-4 bg-white p-2 rounded-[24px] shadow-sm border border-gray-100 text-sm mb-6 w-max">
                    <select value={fT} onChange={e => setFT(e.target.value)} className="bg-transparent border-none p-2 rounded-xl outline-none font-medium text-gray-700 cursor-pointer min-w-[120px]"><option value="All">All Teams</option>{d.tm.filter(x => x.name).map(x => <option key={x.id} value={x.name}>{x.name}</option>)}</select>
                    <div className="w-px bg-gray-200"></div>
                    <select value={fS} onChange={e => setFS(e.target.value)} className="bg-transparent border-none p-2 rounded-xl outline-none font-medium text-gray-700 cursor-pointer min-w-[120px]"><option value="All">All Status</option>{['Open', 'In Review', 'Approved', 'Rejected'].map(x => <option key={x} value={x}>{x}</option>)}</select>
                </div>

                {filtered.length === 0 ? <Empty icon={Ico.Tasks} msg="No tasks found." /> : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(t => {
                            const subs = d.s.filter(s => s.task_id === t.id);
                            return (
                                <div key={t.id} className="bg-white rounded-[24px] shadow-sm p-6 border border-gray-100 flex flex-col group hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2 line-clamp-1">{t.title}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span style={{ color: t.teams?.color_accent, backgroundColor: `${t.teams?.color_accent}15` }} className="text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide uppercase">{t.teams?.name}</span>
                                                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold tracking-wide uppercase ${t.status === 'Approved' ? 'bg-green-50 text-green-700' : t.status === 'Rejected' ? 'bg-red-50 text-red-700' : t.status === 'In Review' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'}`}>{t.status}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-500 line-clamp-2 mb-6 flex-1 leading-relaxed">{t.description}</p>

                                    <div className="flex justify-between items-center text-xs font-semibold mb-6 p-3 bg-gray-50 rounded-xl">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className="text-gray-400">Submissions</span>
                                            <span className="text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{subs.length}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <button onClick={() => setEditT(t)} className="bg-gray-50 hover:bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold transition-colors">Edit</button>
                                        <button onClick={() => setVs(t)} className="bg-gray-900 text-white hover:bg-black py-2 rounded-xl text-xs font-bold transition-colors shadow-sm">Subs</button>
                                        <button onClick={() => approveAll(t)} disabled={ld} className="bg-[#E20A17] text-white hover:bg-[#c20813] py-2 rounded-xl text-xs font-bold transition-colors shadow-sm col-span-1 truncate">Approve</button>
                                        <button onClick={() => setDel(t)} className="bg-red-50 text-red-600 hover:bg-red-100 py-2 rounded-xl text-xs font-bold transition-colors">Del</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
                }

                <button onClick={() => setEditT({ title: '', description: '', team_id: d.tm[0]?.id })} className="fixed bottom-8 right-8 w-14 h-14 bg-[#E20A17] text-white rounded-full shadow-[0_4px_14px_rgba(226,10,23,0.4)] flex items-center justify-center text-3xl hover:scale-105 transition-transform pb-1 z-40">+</button>
                {editT && <TasksModal t={editT} close={() => setEditT(null)} teams={d.tm} onSave={load} />}
                <Confirm open={!!del} close={() => setDel(null)} loading={ld} onConfirm={performDelete} msg="Delete task and submissions?" />

                <SlidePanel open={!!vs} close={() => setVs(null)} title="Submissions">
                    {vs && d.s.filter(s => s.task_id === vs.id).map(s => (
                        <div key={s.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4">
                            <div className="flex justify-between mb-3"><span className="font-bold text-sm text-gray-900">{s.members?.name}</span><span className="text-xs text-gray-500 bg-white px-2 py-1 rounded shadow-sm">{new Date(s.submitted_at).toLocaleDateString()}</span></div>
                            <a href={s.submitted_link} target="_blank" className="text-xs bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg inline-block mb-4 truncate max-w-full hover:bg-gray-300 font-medium transition-colors">{s.submitted_link}</a>
                            <div className="flex gap-2 text-sm font-bold">
                                <button disabled={ld} onClick={() => review(s, 'Approved')} className="flex-1 bg-gray-900 hover:bg-black text-white py-2 rounded-xl transition-colors shadow-sm">Approve</button>
                                <div className="flex-1 space-y-2">
                                    <input type="text" placeholder="Note" value={note} onChange={e => setNote(e.target.value)} className="w-full border-gray-200 border p-2 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#E20A17] transition-shadow" />
                                    <button disabled={ld} onClick={() => review(s, 'Rejected')} className="w-full bg-[#E20A17] hover:bg-[#c20813] text-white py-2 rounded-xl transition-colors shadow-sm">Reject</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {vs && d.s.filter(s => s.task_id === vs.id).length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <p className="text-gray-500 font-medium">No submissions yet.</p>
                        </div>
                    )}
                </SlidePanel>
            </div >
        );
    };

    const Teams = () => {
        const [tab, setTab] = useState('Members');
        const [d, setD] = useState(null);
        const [search, setSc] = useState('');
        const [ld, setLd] = useState(false);
        const [rem, setRem] = useState(null);
        const [addm, setAddm] = useState(null);
        const [exT, setExT] = useState(null);
        const [editTName, setEditTName] = useState(null);

        const l = useCallback(() => {
            Promise.all([supabase.from('members').select('*, submissions(id)'), supabase.from('teams').select('*'), supabase.from('tasks').select('id, team_id, submissions(status)')])
                .then(([m, t, tk]) => setD({ m: m.data || [], tm: t.data || [], tk: tk.data || [] }));
        }, []);
        useEffect(() => { l(); }, [l]);

        const act = async (fn, msg) => { setLd(true); await fn(); notify(msg); setLd(false); l(); };
        if (!d) return <RedSpinner />;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Teams & Members</h1>
                </div>

                <div className="flex gap-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 max-w-xs mb-6 font-medium">
                    <button className={`flex-1 py-2 px-4 rounded-xl transition-all ${tab === 'Members' ? 'bg-[#E20A17] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setTab('Members')}>Members</button>
                    <button className={`flex-1 py-2 px-4 rounded-xl transition-all ${tab === 'Teams' ? 'bg-[#E20A17] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setTab('Teams')}>Teams</button>
                </div>

                {tab === 'Members' ? (
                    <div>
                        <div className="relative mb-6">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <input type="text" placeholder="Search members..." value={search} onChange={e => setSc(e.target.value)} className="w-full max-w-md pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-[#E20A17]/20 focus:border-[#E20A17] transition-all" />
                        </div>
                        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {d.m.filter(x => x.name.toLowerCase().includes(search.toLowerCase())).map(m => {
                                const tm = d.tm.find(t => t.id === m.team_id);
                                return (
                                    <div key={m.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col items-center group hover:shadow-md transition-shadow relative overflow-hidden">
                                        <div className={`w-20 h-20 rounded-full text-white flex items-center justify-center font-bold text-2xl mb-4 shadow-sm relative z-10 ${AVATAR_COLORS[m.avatar_index]}`}>
                                            {m.name.substring(0, 2)}
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg">{m.name}</h3>
                                        {tm ? <span style={{ color: tm.color_accent, backgroundColor: `${tm.color_accent}15` }} className="text-[10px] uppercase tracking-wide px-3 py-1 rounded-full font-bold mt-2">{tm.name}</span> : <span className="text-[10px] uppercase tracking-wide bg-gray-100 text-gray-500 px-3 py-1 rounded-full font-bold mt-2">No team</span>}

                                        <div className="w-full mt-6 pt-5 border-t border-gray-100 flex gap-2 relative z-10">
                                            <select onChange={e => act(() => supabase.from('members').update({ team_id: e.target.value || null }).eq('id', m.id), 'Moved')} value={m.team_id || ''} className="flex-1 bg-gray-50 border border-transparent rounded-xl text-xs p-2 outline-none font-medium text-gray-700 hover:border-gray-200 focus:bg-white focus:border-[#E20A17] focus:ring-2 focus:ring-[#E20A17]/20 transition-all cursor-pointer">
                                                <option value="">No Team</option>
                                                {d.tm.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                            </select>
                                            <button onClick={() => setRem(m)} className="p-2 w-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-[#E20A17] hover:text-white transition-colors">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <Confirm open={!!rem} close={() => setRem(null)} loading={ld} msg="Remove member? Submissions kept for record." onConfirm={() => act(() => supabase.from('members').delete().eq('id', rem.id), 'Removed').then(() => setRem(null))} />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {d.tm.map(t => {
                            const tm = d.m.filter(x => x.team_id === t.id);
                            const tks = d.tk.filter(x => x.team_id === t.id);
                            const cp = tks.length ? (tks.filter(x => x.submissions?.some(s => s.status === 'Approved')).length / tks.length) * 100 : 0;
                            return (
                                <div key={t.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 relative overflow-hidden group">
                                    <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: t.color_accent }}></div>

                                    <div className="flex justify-between items-start mt-2 mb-6">
                                        {editTName === t.id ? (
                                            <input autoFocus defaultValue={t.name} onBlur={() => setEditTName(null)} onKeyDown={e => { if (e.key === 'Enter') { act(() => supabase.from('teams').update({ name: e.target.value }).eq('id', t.id), 'Saved'); setEditTName(null); } }} className="text-lg font-bold border-b-2 border-dashed border-gray-300 outline-none w-full bg-transparent focus:border-[#E20A17]" />
                                        ) : (
                                            <h3 className="text-xl font-bold flex items-center gap-2 text-gray-900 group-hover:text-[#E20A17] transition-colors">{t.name} <button onClick={() => setEditTName(t.id)} className="text-xs text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button></h3>
                                        )}
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center opacity-20" style={{ backgroundColor: t.color_accent }}>
                                            <svg className="w-5 h-5 text-gray-900" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                                            <span className="font-extrabold text-2xl text-gray-900 mb-1">{tm.length}</span>
                                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Members</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                                            <span className="font-extrabold text-2xl text-gray-900 mb-1">{tks.length}</span>
                                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wide">Tasks</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex justify-between text-xs font-bold mb-2">
                                            <span className="text-gray-500">Progress</span>
                                            <span className="text-gray-900">{Math.round(cp)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${cp}%`, backgroundColor: t.color_accent }}></div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100 pt-4">
                                        <button onClick={() => setExT(exT === t.id ? null : t.id)} className="w-full flex items-center justify-between text-sm text-gray-700 font-bold hover:text-[#E20A17] transition-colors bg-gray-50 p-3 rounded-xl">
                                            Members List
                                            <svg className={`w-4 h-4 transform transition-transform ${exT === t.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                        </button>

                                        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${exT === t.id ? 'max-h-96 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="space-y-2">
                                                {tm.map(m => (
                                                    <div key={m.id} className="flex justify-between items-center text-sm bg-white border border-gray-100 p-2.5 rounded-xl shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] ${AVATAR_COLORS[m.avatar_index]}`}>{m.name.substring(0, 2)}</div>
                                                            <span className="font-medium">{m.name}</span>
                                                        </div>
                                                        <button onClick={() => act(() => supabase.from('members').update({ team_id: null }).eq('id', m.id), 'Removed')} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors">
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                                <button onClick={() => setAddm(t)} className="w-full border-2 border-dashed border-gray-200 hover:border-[#E20A17] hover:bg-red-50 hover:text-[#E20A17] py-3 rounded-xl text-sm text-gray-500 font-bold transition-all flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                                    Add Member
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <Modal open={!!addm} close={() => setAddm(null)} title="Add Member">
                            <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-2">
                                {d.m.filter(x => x.team_id !== addm?.id).map(m => (
                                    <button key={m.id} onClick={() => act(() => supabase.from('members').update({ team_id: addm.id }).eq('id', m.id), 'Added').then(() => setAddm(null))} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-colors text-left group">
                                        <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs ${AVATAR_COLORS[m.avatar_index]}`}>{m.name.substring(0, 2)}</div>
                                        <span className="font-bold text-gray-700 group-hover:text-red-700 leading-none">{m.name}</span>
                                    </button>
                                ))}
                                {d.m.filter(x => x.team_id !== addm?.id).length === 0 && (
                                    <div className="text-center py-8 text-gray-500 font-medium">No available members found.</div>
                                )}
                            </div>
                        </Modal>
                    </div>
                )}
            </div>
        );
    };

    const Leaderboard = () => {
        const [d, setD] = useState(null);
        const [acc, setAcc] = useState(null);
        const load = () => {
            setD(null);
            Promise.all([supabase.from('teams').select('*'), supabase.from('members').select('*'), supabase.from('submissions').select('*, tasks(team_id)')])
                .then(([tm, m, s]) => setD({ tm: tm.data || [], m: m.data || [], s: s.data || [] })).catch(() => notify('Err', 'error'));
        };
        useEffect(() => { load(); }, []);
        if (!d) return <RedSpinner />;

        const tRank = d.tm.map(t => {
            const ap = d.s.filter(s => s.status === 'Approved' && s.tasks?.team_id === t.id).length;
            return { ...t, ap };
        }).sort((a, b) => b.ap - a.ap);

        if (d.s.length === 0) return <Empty icon={Ico.Trophy} msg="No submissions yet. Get your teams moving!" />;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Leaderboard</h1>
                        <p className="text-sm text-gray-500 font-medium">Top performing teams and individuals.</p>
                    </div>
                    <button onClick={load} className="flex items-center gap-2 bg-white border border-gray-100 shadow-sm text-gray-700 px-4 py-2 rounded-full font-bold hover:bg-gray-50 transition-colors text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Refresh
                    </button>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Teams Column */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                            <h2 className="font-bold text-gray-900 text-lg">Most Active Teams</h2>
                        </div>
                        <div className="space-y-4">
                            {tRank.map((t, i) => (
                                <div key={t.id} className={`p-5 rounded-[24px] shadow-sm flex items-center gap-4 relative overflow-hidden transition-transform hover:-translate-y-1 ${i === 0 ? 'bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100' : 'bg-white border border-gray-100'}`}>
                                    {i === 0 && <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full blur-2xl -mr-10 -mt-10"></div>}

                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${i === 0 ? 'bg-white text-orange-500 shadow-sm' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-400'}`}>
                                        {i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                    </div>

                                    <div className="flex-1 relative z-10">
                                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-1">
                                            {t.name}
                                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color_accent }}></span>
                                        </h3>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{d.m.filter(m => m.team_id === t.id).length} members</p>
                                    </div>

                                    <div className="text-right relative z-10 bg-white/60 p-3 rounded-xl backdrop-blur-sm border border-white">
                                        <p className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-br from-[#E20A17] to-orange-500">{t.ap}</p>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400">Approved</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Members Column */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></div>
                            <h2 className="font-bold text-gray-900 text-lg">Most Active Members</h2>
                        </div>
                        <div className="space-y-4">
                            {d.tm.map(t => {
                                const tmems = d.m.filter(m => m.team_id === t.id).map(m => ({ ...m, c: d.s.filter(s => s.member_id === m.id).length })).sort((a, b) => b.c - a.c);
                                if (tmems.length === 0) return null;
                                const topC = tmems[0]?.c || 1;

                                return (
                                    <div key={t.id} className="bg-white rounded-[24px] shadow-sm border border-gray-100 overflow-hidden group">
                                        <div className="h-1.5 w-full" style={{ backgroundColor: t.color_accent }}></div>
                                        <button onClick={() => setAcc(acc === t.id ? null : t.id)} className="w-full text-left p-5 font-bold flex justify-between items-center hover:bg-gray-50 transition-colors">
                                            <span className="text-gray-900 text-lg">{t.name}</span>
                                            <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 transition-transform duration-300 ${acc === t.id ? 'rotate-180 bg-gray-200' : ''}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </button>

                                        <div className={`transition-all duration-300 ease-in-out ${acc === t.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                            <div className="p-5 pt-0 space-y-4 border-t border-gray-50 mt-2">
                                                {tmems.map((m, i) => (
                                                    <div key={m.id} className="flex items-center gap-4 text-sm relative">
                                                        {i === 0 && m.c > 0 && <div className="absolute -left-2 -top-2 text-lg animate-bounce z-10">👑</div>}

                                                        <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm ${AVATAR_COLORS[m.avatar_index]}`}>
                                                            {m.name.substring(0, 2)}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="font-bold text-gray-900 truncate">{m.name}</span>
                                                                <span className="font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{m.c}</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                                                <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(m.c / topC) * 100}%`, backgroundColor: i === 0 ? '#E20A17' : '#ff7575' }}></div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const MyTasks = () => {
        const [d, setD] = useState(null);
        const [urls, setUrls] = useState({});
        const [ld, setLd] = useState(false);

        const load = useCallback(() => {
            Promise.all([supabase.from('tasks').select('*').eq('team_id', auth.user.team_id), supabase.from('submissions').select('*')])
                .then(([t, s]) => setD({ t: t.data || [], s: s.data || [] })).catch(() => notify('Err', 'error'));
        }, [auth.user.team_id, notify]);
        useEffect(() => { load(); }, [load]);

        const submitTask = async (task, existing, re) => {
            setLd(true);
            if (re && existing) await supabase.from('submissions').delete().eq('id', existing.id);

            const link = urls[task.id];
            if (!link && !re) { setLd(false); return notify('Link required', 'error'); }
            if (!re) {
                await supabase.from('submissions').insert([{ task_id: task.id, member_id: auth.user.id, submitted_link: link, submitted_at: new Date().toISOString() }]);
                await supabase.from('tasks').update({ status: 'In Review' }).eq('id', task.id);

                // Fetch tg details
                supabase.from('teams').select('name').eq('id', task.team_id).single().then(({ data }) => {
                    sendTg(auth.user.name, data?.name || '', task.title, link);
                });
                notify('Link submitted! Awaiting moderator review.');
                setUrls({ ...urls, [task.id]: '' });
            }
            setLd(false); load();
        };

        if (!d) return <RedSpinner />;
        if (d.t.length === 0) return <Empty icon={Ico.Tasks} msg="No tasks assigned to your team yet." />;

        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">My Tasks</h1>
                        <p className="text-sm text-gray-500 font-medium">Projects assigned to your team.</p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {d.t.map(t => {
                        const mSub = d.s.find(s => s.task_id === t.id && s.member_id === auth.user.id);
                        const tSubs = d.s.filter(s => s.task_id === t.id).length;

                        return (
                            <div key={t.id} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col group hover:shadow-md transition-shadow relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full rounded-l-[24px]" style={{ backgroundColor: '#E20A17' }}></div>

                                <div className="pl-3 flex flex-col flex-1">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-xl text-gray-900 leading-tight flex-1 pr-4">{t.title}</h3>
                                    </div>

                                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-6">{t.description}</p>

                                    <div className="flex justify-between items-center text-xs font-semibold mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex flex-col gap-1.5 items-start">
                                            <span className="text-gray-400 uppercase tracking-wider text-[10px]">Team Submissions</span>
                                            <div className="flex items-center gap-2 text-sm text-gray-900">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                <span className="font-bold">{tSubs}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-auto build-area border-t border-gray-100 pt-5">
                                        {!mSub ? (
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <div className="relative flex-1">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                    </div>
                                                    <input type="url" placeholder="Paste your project URL..." value={urls[t.id] || ''} onChange={e => setUrls({ ...urls, [t.id]: e.target.value })} className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#E20A17]/20 focus:border-[#E20A17] focus:bg-white transition-all" />
                                                </div>
                                                <button onClick={() => submitTask(t, null, false)} disabled={ld || !urls[t.id]} className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center min-w-[100px] transition-all shadow-sm ${!urls[t.id] ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#E20A17] text-white hover:bg-[#c20813] hover:shadow-md'}`}>
                                                    {ld ? <Spinner /> : 'Submit'}
                                                </button>
                                            </div>
                                        ) : mSub.status === 'Approved' ? (
                                            <div className="bg-green-50 text-green-700 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-green-100">
                                                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                Project Approved
                                            </div>
                                        ) : mSub.status === 'Rejected' ? (
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                <div className="flex items-center gap-2 text-[#E20A17] font-bold mb-3">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                                    Feedback: Needs Update
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => submitTask(t, mSub, true)} disabled={ld} className="flex-1 bg-white border border-[#E20A17] text-[#E20A17] hover:bg-red-50 py-2.5 rounded-xl text-sm font-bold transition-colors">Re-submit URL</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <span className="flex items-center gap-1.5 text-[10px] bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-bold uppercase tracking-wide whitespace-nowrap">
                                                        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="3" stroke="currentColor" className="opacity-25"></circle><path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" className="opacity-75"></path></svg>
                                                        Reviewing
                                                    </span>
                                                    <a href={mSub.submitted_link} target="_blank" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate inline-block transition-colors">{mSub.submitted_link}</a>
                                                </div>
                                                <button onClick={() => submitTask(t, mSub, true)} disabled={ld} className="text-xs text-gray-500 font-bold hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap w-max">Update URL</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    const Profile = () => {
        const isM = auth.role === 'Member';
        const [d, setD] = useState(null);
        const [avaOpen, setAvaOpen] = useState(false);

        useEffect(() => {
            if (isM) {
                Promise.all([supabase.from('submissions').select('*, tasks(title)').eq('member_id', auth.user.id).order('submitted_at', { ascending: false }), supabase.from('teams').select('name').eq('id', auth.user.team_id).single()])
                    .then(([s, t]) => setD({ s: s.data || [], tm: t.data?.name || '' }));
            } else setD({ s: [], tm: '' });
        }, [isM]);

        const setAva = async (idx) => {
            await supabase.from('members').update({ avatar_index: idx }).eq('id', auth.user.id);
            setAuth({ ...auth, user: { ...auth.user, avatar_index: idx } });
            setAvaOpen(false);
        };

        if (!d) return <RedSpinner />;

        const apRate = d.s.length ? (d.s.filter(x => x.status === 'Approved').length / d.s.length) * 100 : 0;

        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-white rounded-xl shadow border-t-8 border-[#C8102E] p-8 text-center">
                    {isM ? (
                        <button onClick={() => setAvaOpen(true)} className={`w-32 h-32 mx-auto rounded-full text-white flex items-center justify-center font-bold text-4xl mb-4 hover:opacity-80 transition-opacity ${AVATAR_COLORS[auth.user.avatar_index]}`}>{auth.user.name.substring(0, 2)}</button>
                    ) : (
                        <div className="w-32 h-32 mx-auto rounded-full bg-[#C8102E] text-white flex items-center justify-center font-bold text-4xl mb-4">🛡️</div>
                    )}
                    <h2 className="text-2xl font-bold">{auth.user.name}</h2>
                    {isM && <span className="inline-block mt-2 px-3 py-1 bg-red-50 text-[#C8102E] rounded-full text-sm font-bold border border-red-100">{d.tm}</span>}

                    <div className="grid grid-cols-3 gap-4 mt-8 border-t pt-8">
                        <div><p className="text-3xl font-bold text-[#1A1A1A]">{d.s.length}</p><p className="text-sm text-gray-400">Submissions</p></div>
                        <div><p className="text-3xl font-bold text-green-600">{d.s.filter(x => x.status === 'Approved').length}</p><p className="text-sm text-gray-400">Approved</p></div>
                        <div><p className="text-3xl font-bold text-blue-600">{Math.round(apRate)}%</p><p className="text-sm text-gray-400">Rate</p></div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                    <h3 className="font-bold mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {d.s.slice(0, 5).map(s => (
                            <div key={s.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                                <div><p className="font-bold text-sm">{s.tasks?.title}</p><p className="text-xs text-gray-400">{new Date(s.submitted_at).toLocaleString()}</p></div>
                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${s.status === 'Approved' ? 'bg-green-100 text-green-800' : s.status === 'Rejected' ? 'bg-red-100 text-red-800' : s.status === 'In Review' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>{s.status}</span>
                            </div>
                        ))}
                        {d.s.length === 0 && <p className="text-gray-400 text-sm text-center">No recent activity.</p>}
                    </div>
                </div>

                <Modal open={avaOpen} close={() => setAvaOpen(false)} title="Choose Avatar">
                    <div className="grid grid-cols-4 gap-4">
                        {AVATARS.map((bg, i) => <button key={i} onClick={() => setAva(i)} className={`w-16 h-16 rounded-full text-white font-bold text-xl hover:ring-4 ring-offset-2 ring-gray-200 transition-all ${bg}`}>{auth.user.name.substring(0, 2)}</button>)}
                    </div>
                </Modal>
            </div>
        );
    };

    if (!auth) return <><LoginScreen /><div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t => <div key={t.id} className={`px-4 py-3 rounded-lg shadow-xl text-white font-medium min-w-[250px] transform transition-all ${t.type === 'error' ? 'bg-[#C8102E]' : t.type === 'warning' ? 'bg-yellow-500' : 'bg-green-600'}`}>{t.msg}</div>)}</div></>;

    const R = auth.role === 'Moderator';
    const links = R ? ['Dashboard', 'Tasks', 'Members & Teams', 'Leaderboard', 'Profile'] : ['My Tasks', 'Leaderboard', 'Profile'];

    const P = {
        'Dashboard': <Dashboard />, 'Tasks': <Tasks />, 'Members & Teams': <Teams />,
        'Leaderboard': <Leaderboard />, 'Profile': <Profile />, 'My Tasks': <MyTasks />
    }[page];

    return (
        <div className="flex h-screen bg-[#F5F7F5] font-['Inter'] text-[#1A1A1A] overflow-hidden">
            {/* Mobile Overlay */}
            {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-white flex flex-col transform transition-transform duration-300 shadow-[2px_0_10px_rgba(0,0,0,0.02)] ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                {/* Logo Area */}
                <div className="w-full h-32 flex items-center justify-center p-4 bg-transparent mt-2 mb-2">
                    <img src="logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 overflow-y-auto pb-4">
                    <p className="text-xs font-bold text-gray-400 mb-4 px-4 uppercase tracking-wider">Menu</p>
                    <div className="space-y-1 mb-8">
                        {links.map(l => {
                            const active = page === l;
                            return (
                                <button key={l} onClick={() => { setPage(l); setSidebarOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-semibold relative ${active ? 'text-[#E20A17] bg-[#E20A17]/10' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
                                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#E20A17] rounded-r-full" />}
                                    <span className={`${active ? 'text-[#E20A17]' : 'text-gray-400'}`}>
                                        {(() => {
                                            switch (l) {
                                                case 'Tasks': case 'My Tasks': return <Ico.Tasks className="w-5 h-5" />;
                                                case 'Members & Teams': return <Ico.Users className="w-5 h-5" />;
                                                case 'Leaderboard': return <Ico.Trophy className="w-5 h-5" />;
                                                case 'Profile': return <div className="w-5 h-5 rounded-full border-2 border-current" />;
                                                default: return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
                                            }
                                        })()}
                                    </span>
                                    {l}
                                </button>
                            );
                        })}
                    </div>

                    <p className="text-xs font-bold text-gray-400 mb-4 px-4 uppercase tracking-wider">General</p>
                    <div className="space-y-1">
                        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Settings
                        </button>
                        <button className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:text-gray-900">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Help
                        </button>
                        <button onClick={doLogout} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all text-sm font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            Logout
                        </button>
                    </div>
                </nav>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Topbar */}
                <header className="bg-white/50 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between z-10 hidden md:flex">
                    <div className="flex bg-white rounded-full items-center px-4 py-2 border border-gray-100 shadow-sm w-96">
                        <svg className="w-5 h-5 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        <input type="text" placeholder="Search task" className="bg-transparent border-none outline-none text-sm w-full font-medium placeholder-gray-400" />
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium ml-2">⌘F</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="text-gray-400 hover:text-gray-800 transition-colors"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg></button>
                        <button className="text-gray-400 hover:text-gray-800 transition-colors relative">
                            <span className="absolute top-0 right-0 w-2 h-2 bg-[#E20A17] rounded-full border border-white"></span>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </button>
                        <div className="flex items-center gap-3 border-l pl-6 border-gray-200">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900">{auth.user.name}</p>
                                <p className="text-xs text-gray-500 font-medium">{auth.role}</p>
                            </div>
                            {auth.role === 'Moderator' ? (
                                <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm bg-[#E20A17]`}>{auth.user.name.substring(0, 2)}</div>
                            ) : (
                                <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-sm ${AVATAR_COLORS[auth.user.avatar_index]}`}>{auth.user.name.substring(0, 2)}</div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Mobile Header */}
                <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between md:hidden z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-black"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
                        <span className="font-bold">{page}</span>
                    </div>
                    {auth.role === 'Moderator' ? (
                        <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs bg-[#E20A17]`}>{auth.user.name.substring(0, 2)}</div>
                    ) : (
                        <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs ${AVATAR_COLORS[auth.user.avatar_index]}`}>{auth.user.name.substring(0, 2)}</div>
                    )}
                </header>

                <div className="flex-1 overflow-auto p-4 md:p-8 md:px-10 animate-[fadeIn_200ms_ease-in-out]">
                    <div className="max-w-[1400px] mx-auto">
                        {P}
                    </div>
                </div>
            </main>

            {/* Toasts */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
                {toasts.map(t => <div key={t.id} className={`px-6 py-4 rounded-xl shadow-lg text-white text-sm font-bold min-w-[300px] transform transition-all ${t.type === 'error' ? 'bg-[#E20A17]' : t.type === 'warning' ? 'bg-orange-500' : 'bg-gray-900'}`}>{t.msg}</div>)}
            </div>
        </div>
    );
}


const root = createRoot(document.getElementById('root'));
root.render(<App />);
