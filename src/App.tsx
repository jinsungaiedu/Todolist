import React, { useState, useEffect } from 'react';
import { format, addMonths, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import { useTodos } from './hooks/useFirestore';
import { useEvents } from './hooks/useFirestore';
import { useReminders } from './hooks/useReminders';
import { useIsMobile } from './hooks/useMediaQuery';
import { Todo, Event, View } from './types';
import CalendarView from './components/CalendarView';
import TodoList from './components/TodoList';
import TodoModal from './components/TodoModal';
import EventModal from './components/EventModal';
import './App.css';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>('calendar');
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [defaultDate, setDefaultDate] = useState('');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const isMobile = useIsMobile();

  const { todos, add: addTodoFS, update: updateTodoFS, remove: deleteTodoFS } = useTodos(user?.uid ?? null);
  const { events, add: addEventFS, update: updateEventFS, remove: deleteEventFS } = useEvents(user?.uid ?? null);

  useEffect(() => {
    return onAuthStateChanged(auth, u => { setUser(u); setAuthLoading(false); });
  }, []);

  useReminders(todos, events);

  const computeUrgent = (dueDate?: string) =>
    dueDate ? parseISO(dueDate) <= addMonths(new Date(), 1) : false;

  /* ── Todo CRUD ── */
  const addTodo = (data: Omit<Todo, 'id' | 'createdAt'>) => {
    addTodoFS({ ...data, urgent: computeUrgent(data.dueDate), createdAt: new Date().toISOString() });
  };
  const updateTodo = (id: string, data: Omit<Todo, 'id' | 'createdAt'>) => {
    updateTodoFS(id, { ...data, urgent: computeUrgent(data.dueDate) });
  };
  const moveTodo = (id: string, urgent: boolean, important: boolean) => {
    updateTodoFS(id, { urgent, important });
  };
  const toggleTodo = (id: string) => {
    const t = todos.find(x => x.id === id);
    if (t) updateTodoFS(id, { completed: !t.completed });
  };
  const deleteTodo = (id: string) => deleteTodoFS(id);

  /* ── Event CRUD ── */
  const addEvent = (data: Omit<Event, 'id' | 'createdAt'>) => {
    addEventFS({ ...data, createdAt: new Date().toISOString() });
  };
  const updateEvent = (id: string, data: Omit<Event, 'id' | 'createdAt'>) => {
    updateEventFS(id, data);
  };
  const deleteEvent = (id: string) => deleteEventFS(id);

  const handleDayClick = (date: string) => { setDefaultDate(date); setEditingEvent(undefined); setShowEventModal(true); };
  const handleEventClick = (event: Event) => { setEditingEvent(event); setShowEventModal(true); };

  const today = format(new Date(), 'yyyy년 M월 d일 (eee)', { locale: ko });
  const upcomingTodos = todos.filter(t => !t.completed).length;

  /* ── 로그인 화면 ── */
  if (authLoading) {
    return <div style={login.center}><div style={login.spinner} /></div>;
  }

  if (!user) {
    return (
      <div style={login.center}>
        <div style={login.card}>
          <span style={{ fontSize: 52 }}>📆</span>
          <h1 style={login.title}>스케줄러</h1>
          <p style={login.sub}>할 일과 일정을 스마트하게 관리하세요</p>
          <button style={login.googleBtn} onClick={() => signInWithPopup(auth, googleProvider)}>
            <svg style={{ width: 20, height: 20 }} viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.4 29.2 35 24 35c-6.1 0-11-4.9-11-11s4.9-11 11-11c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.8 7.2 29.1 5 24 5 12.9 5 4 13.9 4 25s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 19 13 24 13c2.8 0 5.3 1 7.3 2.7l5.7-5.7C33.8 7.2 29.1 5 24 5 16.3 5 9.7 9 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 45c5 0 9.6-1.9 13.1-5l-6-5.2C29.1 36.6 26.7 37 24 37c-5.2 0-9.6-3.6-11.2-8.4l-6.5 5C9.7 41 16.3 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.4-2.4 4.4-4.4 5.8l6 5.2C41.5 36.3 44 31 44 25c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
            Google로 시작하기
          </button>
        </div>
      </div>
    );
  }

  /* ── 메인 앱 ── */
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5', flexDirection: isMobile ? 'column' : 'row' }}>

      {/* 데스크탑 사이드바 */}
      {!isMobile && (
        <aside style={s.sidebar}>
          <div style={s.logo}>
            <span style={s.logoIcon}>📆</span>
            <span style={s.logoText}>스케줄러</span>
          </div>
          <p style={s.today}>{today}</p>
          <nav style={s.nav}>
            <button style={{ ...s.navItem, ...(view === 'calendar' ? s.navActive : {}) }} onClick={() => setView('calendar')}>
              <span>📅</span> 캘린더
            </button>
            <button style={{ ...s.navItem, ...(view === 'todos' ? s.navActive : {}) }} onClick={() => setView('todos')}>
              <span>✅</span> 할 일
              {upcomingTodos > 0 && <span style={s.badge}>{upcomingTodos}</span>}
            </button>
          </nav>
          <div style={s.sidebarActions}>
            <button style={s.addBtn} onClick={() => { setEditingTodo(undefined); setShowTodoModal(true); }}>+ 할 일 추가</button>
            <button style={{ ...s.addBtn, background: '#0891b2' }} onClick={() => { setEditingEvent(undefined); setDefaultDate(''); setShowEventModal(true); }}>+ 일정 추가</button>
          </div>
          <div style={s.upcomingSection}>
            <p style={s.sectionTitle}>다가오는 할 일</p>
            {todos.filter(t => !t.completed && t.dueDate).slice(0, 5).map(t => (
              <div key={t.id} style={s.upcomingItem}>
                <div style={s.upcomingDot} />
                <div>
                  <p style={s.upcomingTitle}>{t.title}</p>
                  {t.dueDate && <p style={s.upcomingDate}>{format(new Date(t.dueDate), 'M/d(eee)', { locale: ko })}</p>}
                </div>
              </div>
            ))}
          </div>
          {/* 사용자 정보 */}
          <div style={s.userArea}>
            <img src={user.photoURL || ''} alt="" style={s.avatar} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={s.userName}>{user.displayName}</p>
              <p style={s.userEmail}>{user.email}</p>
            </div>
            <button style={s.logoutBtn} onClick={() => signOut(auth)} title="로그아웃">↩</button>
          </div>
        </aside>
      )}

      {/* 모바일 상단 바 */}
      {isMobile && (
        <div style={m.topBar}>
          <div style={m.topLeft}>
            <img src={user.photoURL || ''} alt="" style={m.avatar} />
            <span style={m.topTitle}>{view === 'calendar' ? '캘린더' : '할 일 목록'}</span>
          </div>
          <button style={m.logoutBtn} onClick={() => signOut(auth)}>로그아웃</button>
        </div>
      )}

      {/* 본문 */}
      <main style={isMobile ? m.main : s.main}>
        {!isMobile && (
          <div style={s.mainHeader}>
            <h1 style={s.viewTitle}>{view === 'calendar' ? '캘린더' : '할 일 목록'}</h1>
            <button style={s.primaryBtn} onClick={view === 'calendar'
              ? () => { setEditingEvent(undefined); setDefaultDate(''); setShowEventModal(true); }
              : () => { setEditingTodo(undefined); setShowTodoModal(true); }}>
              + {view === 'calendar' ? '새 일정' : '새 할 일'}
            </button>
          </div>
        )}
        {view === 'calendar' ? (
          <CalendarView events={events} todos={todos} onDayClick={handleDayClick} onEventClick={handleEventClick} />
        ) : (
          <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo}
            onEdit={(t) => { setEditingTodo(t); setShowTodoModal(true); }} onMove={moveTodo} />
        )}
      </main>

      {/* 모바일 하단 네비게이션 */}
      {isMobile && (
        <>
          {showAddMenu && <div style={m.backdrop} onClick={() => setShowAddMenu(false)} />}
          <nav style={m.bottomNav}>
            <button style={{ ...m.navTab, ...(view === 'calendar' ? m.navTabActive : {}) }} onClick={() => setView('calendar')}>
              <span style={m.navIcon}>📅</span>
              <span style={m.navLabel}>캘린더</span>
            </button>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {showAddMenu && (
                <div style={m.addMenu}>
                  <button style={m.addItem} onClick={() => { setShowAddMenu(false); setEditingTodo(undefined); setShowTodoModal(true); }}>✅ 할 일 추가</button>
                  <button style={{ ...m.addItem, borderTop: '1px solid #f3f4f6' }} onClick={() => { setShowAddMenu(false); setEditingEvent(undefined); setDefaultDate(''); setShowEventModal(true); }}>📅 일정 추가</button>
                </div>
              )}
              <button style={m.fab} onClick={() => setShowAddMenu(v => !v)}>
                <span style={{ display: 'block', lineHeight: 1, transform: showAddMenu ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
              </button>
            </div>
            <button style={{ ...m.navTab, ...(view === 'todos' ? m.navTabActive : {}) }} onClick={() => setView('todos')}>
              <span style={m.navIcon}>✅</span>
              <span style={m.navLabel}>할 일</span>
              {upcomingTodos > 0 && <span style={m.badge}>{upcomingTodos}</span>}
            </button>
          </nav>
        </>
      )}

      {showTodoModal && (
        <TodoModal initial={editingTodo}
          onSave={data => editingTodo ? updateTodo(editingTodo.id, data) : addTodo(data)}
          onClose={() => { setShowTodoModal(false); setEditingTodo(undefined); }} />
      )}
      {showEventModal && (
        <EventModal initial={editingEvent} defaultDate={defaultDate}
          onSave={data => { editingEvent ? updateEvent(editingEvent.id, data) : addEvent(data); }}
          onClose={() => { setShowEventModal(false); setEditingEvent(undefined); }} />
      )}
      {editingEvent && showEventModal && (
        <div style={{ ...s.deleteBar, bottom: isMobile ? 80 : 24 }}>
          <button style={s.deleteBtn} onClick={() => { deleteEvent(editingEvent.id); setShowEventModal(false); setEditingEvent(undefined); }}>
            이 일정 삭제
          </button>
        </div>
      )}
    </div>
  );
}

/* ── 로그인 스타일 ── */
const login: Record<string, React.CSSProperties> = {
  center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' },
  spinner: { width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #4f46e5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  card: { background: '#fff', borderRadius: 20, padding: '48px 40px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 360, width: '90%' },
  title: { fontSize: 28, fontWeight: 800, color: '#1a1a2e', margin: 0 },
  sub: { fontSize: 14, color: '#6b7280', margin: 0 },
  googleBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 24px', borderRadius: 10, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 15, color: '#374151', marginTop: 8 },
};

/* ── 앱 스타일 ── */
const s: Record<string, React.CSSProperties> = {
  sidebar: { width: 260, background: '#1e1b4b', color: '#fff', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 20, flexShrink: 0 },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { fontSize: 28 },
  logoText: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  today: { fontSize: 12, color: '#a5b4fc', marginTop: -8 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10, border: 'none', background: 'transparent', color: '#c7d2fe', cursor: 'pointer', fontWeight: 600, fontSize: 14, textAlign: 'left' },
  navActive: { background: '#4f46e5', color: '#fff' },
  badge: { marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 700 },
  sidebarActions: { display: 'flex', flexDirection: 'column', gap: 8 },
  addBtn: { padding: 11, borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 13 },
  upcomingSection: { flex: 1, overflow: 'hidden' },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#818cf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  upcomingItem: { display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 },
  upcomingDot: { width: 6, height: 6, borderRadius: '50%', background: '#818cf8', marginTop: 5, flexShrink: 0 },
  upcomingTitle: { fontSize: 13, fontWeight: 600, color: '#e0e7ff', lineHeight: 1.3 },
  upcomingDate: { fontSize: 11, color: '#818cf8', marginTop: 2 },
  userArea: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0 0', borderTop: '1px solid rgba(255,255,255,0.1)' },
  avatar: { width: 32, height: 32, borderRadius: '50%', flexShrink: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#e0e7ff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  userEmail: { fontSize: 10, color: '#818cf8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  logoutBtn: { background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', fontSize: 18, flexShrink: 0 },
  main: { flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' },
  mainHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  viewTitle: { fontSize: 26, fontWeight: 800, color: '#1a1a2e' },
  primaryBtn: { padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  deleteBar: { position: 'fixed', left: '50%', transform: 'translateX(-50%)', zIndex: 1100 },
  deleteBtn: { padding: '12px 28px', borderRadius: 30, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(239,68,68,0.4)' },
};

const m: Record<string, React.CSSProperties> = {
  topBar: { background: '#1e1b4b', padding: '14px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
  topLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: '50%' },
  topTitle: { fontSize: 17, fontWeight: 800, color: '#fff' },
  logoutBtn: { fontSize: 12, color: '#a5b4fc', background: 'none', border: '1px solid rgba(165,180,252,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' },
  main: { flex: 1, padding: '12px 12px 90px', display: 'flex', flexDirection: 'column', gap: 14, overflowY: 'auto' },
  backdrop: { position: 'fixed', inset: 0, zIndex: 99 },
  bottomNav: { position: 'fixed', bottom: 0, left: 0, right: 0, height: 64, background: '#fff', borderTop: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 100, boxShadow: '0 -2px 10px rgba(0,0,0,0.06)' },
  navTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 28px', border: 'none', background: 'none', cursor: 'pointer', color: '#9ca3af', position: 'relative' },
  navTabActive: { color: '#4f46e5' },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, fontWeight: 600 },
  badge: { position: 'absolute', top: 4, right: 14, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 5px', fontSize: 9, fontWeight: 700 },
  fab: { width: 50, height: 50, borderRadius: '50%', background: '#4f46e5', color: '#fff', border: 'none', fontSize: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(79,70,229,0.45)', fontWeight: 300 },
  addMenu: { position: 'absolute', bottom: 62, left: '50%', transform: 'translateX(-50%)', background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.16)', overflow: 'hidden', whiteSpace: 'nowrap', zIndex: 101 },
  addItem: { display: 'block', width: '100%', padding: '15px 24px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: '#374151', textAlign: 'left' },
};
