import React, { useState } from 'react';
import { format, addMonths, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { Todo, Event, View } from './types';
import { useLocalStorage } from './hooks/useStorage';
import { useReminders } from './hooks/useReminders';
import CalendarView from './components/CalendarView';
import TodoList from './components/TodoList';
import TodoModal from './components/TodoModal';
import EventModal from './components/EventModal';
import './App.css';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [todos, setTodos] = useLocalStorage<Todo[]>('todos', []);
  const [events, setEvents] = useLocalStorage<Event[]>('events', []);
  const [view, setView] = useState<View>('calendar');
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | undefined>();
  const [editingEvent, setEditingEvent] = useState<Event | undefined>();
  const [defaultDate, setDefaultDate] = useState('');

  useReminders(todos, events);

  const computeUrgent = (dueDate?: string) =>
    dueDate ? parseISO(dueDate) <= addMonths(new Date(), 1) : false;

  const addTodo = (data: Omit<Todo, 'id' | 'createdAt'>) => {
    const urgent = computeUrgent(data.dueDate);
    setTodos(prev => [{ ...data, urgent, id: uid(), createdAt: new Date().toISOString() }, ...prev]);
  };
  const updateTodo = (id: string, data: Omit<Todo, 'id' | 'createdAt'>) => {
    const urgent = computeUrgent(data.dueDate);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, ...data, urgent } : t));
  };
  const moveTodo = (id: string, urgent: boolean, important: boolean) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, urgent, important } : t));
  };
  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };
  const deleteTodo = (id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  const addEvent = (data: Omit<Event, 'id' | 'createdAt'>) => {
    setEvents(prev => [{ ...data, id: uid(), createdAt: new Date().toISOString() }, ...prev]);
  };
  const updateEvent = (id: string, data: Omit<Event, 'id' | 'createdAt'>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  };
  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleDayClick = (date: string) => {
    setDefaultDate(date);
    setEditingEvent(undefined);
    setShowEventModal(true);
  };

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const today = format(new Date(), 'yyyy년 M월 d일 (eee)', { locale: ko });
  const upcomingTodos = todos.filter(t => !t.completed).length;

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>📆</span>
          <span style={styles.logoText}>스케줄러</span>
        </div>
        <p style={styles.today}>{today}</p>

        <nav style={styles.nav}>
          <button style={{ ...styles.navItem, ...(view === 'calendar' ? styles.navActive : {}) }}
            onClick={() => setView('calendar')}>
            <span>📅</span> 캘린더
          </button>
          <button style={{ ...styles.navItem, ...(view === 'todos' ? styles.navActive : {}) }}
            onClick={() => setView('todos')}>
            <span>✅</span> 할 일
            {upcomingTodos > 0 && <span style={styles.badge}>{upcomingTodos}</span>}
          </button>
        </nav>

        <div style={styles.sidebarActions}>
          <button style={styles.addBtn} onClick={() => { setEditingTodo(undefined); setShowTodoModal(true); }}>
            + 할 일 추가
          </button>
          <button style={{ ...styles.addBtn, background: '#0891b2' }} onClick={() => { setEditingEvent(undefined); setDefaultDate(''); setShowEventModal(true); }}>
            + 일정 추가
          </button>
        </div>

        <div style={styles.upcomingSection}>
          <p style={styles.sectionTitle}>다가오는 할 일</p>
          {todos.filter(t => !t.completed && t.dueDate).slice(0, 5).map(t => (
            <div key={t.id} style={styles.upcomingItem}>
              <div style={styles.upcomingDot} />
              <div>
                <p style={styles.upcomingTitle}>{t.title}</p>
                {t.dueDate && <p style={styles.upcomingDate}>{format(new Date(t.dueDate), 'M/d(eee)', { locale: ko })}</p>}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.mainHeader}>
          <h1 style={styles.viewTitle}>{view === 'calendar' ? '캘린더' : '할 일 목록'}</h1>
          <button style={styles.primaryBtn} onClick={view === 'calendar'
            ? () => { setEditingEvent(undefined); setDefaultDate(''); setShowEventModal(true); }
            : () => { setEditingTodo(undefined); setShowTodoModal(true); }}>
            + {view === 'calendar' ? '새 일정' : '새 할 일'}
          </button>
        </div>

        {view === 'calendar' ? (
          <CalendarView events={events} todos={todos} onDayClick={handleDayClick} onEventClick={handleEventClick} />
        ) : (
          <TodoList todos={todos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={(t) => { setEditingTodo(t); setShowTodoModal(true); }} onMove={moveTodo} />
        )}
      </main>

      {showTodoModal && (
        <TodoModal
          initial={editingTodo}
          onSave={data => editingTodo ? updateTodo(editingTodo.id, data) : addTodo(data)}
          onClose={() => { setShowTodoModal(false); setEditingTodo(undefined); }}
        />
      )}

      {showEventModal && (
        <EventModal
          initial={editingEvent}
          defaultDate={defaultDate}
          onSave={data => {
            if (editingEvent) {
              updateEvent(editingEvent.id, data);
            } else {
              addEvent(data);
            }
          }}
          onClose={() => { setShowEventModal(false); setEditingEvent(undefined); }}
        />
      )}

      {editingEvent && showEventModal && (
        <div style={styles.deleteBar}>
          <button style={styles.deleteBtn} onClick={() => { deleteEvent(editingEvent.id); setShowEventModal(false); setEditingEvent(undefined); }}>
            이 일정 삭제
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: { display: 'flex', minHeight: '100vh', background: '#f0f2f5' },
  sidebar: { width: 260, background: '#1e1b4b', color: '#fff', padding: '28px 20px', display: 'flex', flexDirection: 'column', gap: 24, flexShrink: 0 },
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
  main: { flex: 1, padding: 32, display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' },
  mainHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  viewTitle: { fontSize: 26, fontWeight: 800, color: '#1a1a2e' },
  primaryBtn: { padding: '10px 20px', borderRadius: 10, border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 },
  deleteBar: { position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 1100 },
  deleteBtn: { padding: '12px 28px', borderRadius: 30, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 20px rgba(239,68,68,0.4)' },
};
