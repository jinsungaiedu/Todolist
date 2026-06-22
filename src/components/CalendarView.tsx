import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale/ko';
import { Event, Todo } from '../types';
import { useIsMobile } from '../hooks/useMediaQuery';

interface Props {
  events: Event[];
  todos: Todo[];
  onDayClick: (date: string) => void;
  onEventClick: (event: Event) => void;
}

export default function CalendarView({ events, todos, onDayClick, onEventClick }: Props) {
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(new Date());

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const prev = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const next = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  const getEventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.date), day));
  const getTodosForDay = (day: Date) =>
    todos.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day));

  const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div style={styles.container}>
      <div style={{ ...styles.header, padding: isMobile ? '14px 16px' : '20px 24px' }}>
        <button style={styles.navBtn} onClick={prev}>‹</button>
        <h2 style={{ ...styles.month, fontSize: isMobile ? 16 : 20 }}>{format(current, 'yyyy년 M월', { locale: ko })}</h2>
        <button style={styles.navBtn} onClick={next}>›</button>
      </div>

      <div style={styles.weekdays}>
        {WEEKDAYS.map(d => (
          <div key={d} style={{ ...styles.weekday, color: d === '일' ? '#ef4444' : d === '토' ? '#3b82f6' : '#6b7280' }}>{d}</div>
        ))}
      </div>

      <div style={styles.grid}>
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const dayTodos = getTodosForDay(day);
          const isCurrentMonth = isSameMonth(day, current);
          const today = isToday(day);
          const dateStr = format(day, 'yyyy-MM-dd');

          return (
            <div
              key={dateStr}
              style={{
                ...styles.cell,
                minHeight: isMobile ? 58 : 90,
                padding: isMobile ? '4px 2px' : '6px 4px',
                opacity: isCurrentMonth ? 1 : 0.3,
                background: today ? '#eff6ff' : '#fff',
              }}
              onClick={() => onDayClick(dateStr)}
            >
              <div style={{
                ...styles.dayNum,
                width: isMobile ? 22 : 26,
                height: isMobile ? 22 : 26,
                fontSize: isMobile ? 11 : 13,
                background: today ? '#4f46e5' : 'transparent',
                color: today ? '#fff' : day.getDay() === 0 ? '#ef4444' : day.getDay() === 6 ? '#3b82f6' : '#1a1a2e',
              }}>
                {format(day, 'd')}
              </div>
              <div style={styles.dots}>
                {isMobile ? (
                  /* 모바일: 색상 점으로만 표시 */
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} style={{ width: 6, height: 6, borderRadius: '50%', background: e.color, flexShrink: 0 }}
                        onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }} />
                    ))}
                    {dayTodos.slice(0, 2).map(t => (
                      <div key={t.id} style={{ width: 6, height: 6, borderRadius: '50%', background: t.completed ? '#10b981' : '#f59e0b', flexShrink: 0 }} />
                    ))}
                  </div>
                ) : (
                  <>
                    {dayEvents.slice(0, 3).map(e => (
                      <div key={e.id} style={{ ...styles.eventChip, background: e.color }}
                        onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}>
                        {e.title}
                      </div>
                    ))}
                    {dayTodos.slice(0, 2).map(t => (
                      <div key={t.id} style={{ ...styles.eventChip, background: t.completed ? '#d1fae5' : '#fef3c7', color: '#1a1a2e' }}>
                        {t.completed ? '✓ ' : '• '}{t.title}
                      </div>
                    ))}
                    {(dayEvents.length + dayTodos.length) > 4 && (
                      <div style={styles.more}>+{dayEvents.length + dayTodos.length - 4}개</div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f3f4f6' },
  month: { fontSize: 20, fontWeight: 700, color: '#1a1a2e' },
  navBtn: { background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', padding: '4px 8px', borderRadius: 8, color: '#6b7280', lineHeight: 1 },
  weekdays: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #f3f4f6' },
  weekday: { textAlign: 'center', padding: '10px 4px', fontSize: 12, fontWeight: 600 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' },
  cell: { minHeight: 90, padding: '6px 4px', borderRight: '1px solid #f3f4f6', borderBottom: '1px solid #f3f4f6', cursor: 'pointer', transition: 'background 0.15s' },
  dayNum: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, marginBottom: 4, margin: '0 auto 4px' },
  dots: { display: 'flex', flexDirection: 'column', gap: 2 },
  eventChip: { fontSize: 10, padding: '2px 5px', borderRadius: 4, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' },
  more: { fontSize: 10, color: '#9ca3af', paddingLeft: 4 },
};
