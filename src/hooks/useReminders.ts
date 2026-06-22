import { useEffect, useRef } from 'react';
import { Todo, Event } from '../types';

export function useReminders(todos: Todo[], events: Event[]) {
  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      todos.forEach((todo) => {
        if (todo.completed || !todo.dueDate || todo.reminder == null) return;
        const due = new Date(`${todo.dueDate}T${todo.dueTime || '09:00'}`);
        const diff = (due.getTime() - now.getTime()) / 60000;
        const key = `todo-${todo.id}`;
        if (diff <= todo.reminder && diff > 0 && !notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          if (Notification.permission === 'granted') {
            new Notification(`⏰ ${todo.title}`, {
              body: `${Math.round(diff)}분 후 마감입니다.`,
            });
          }
        }
      });

      events.forEach((event) => {
        if (!event.startTime || event.reminder == null) return;
        const due = new Date(`${event.date}T${event.startTime}`);
        const diff = (due.getTime() - now.getTime()) / 60000;
        const key = `event-${event.id}`;
        if (diff <= event.reminder && diff > 0 && !notifiedRef.current.has(key)) {
          notifiedRef.current.add(key);
          if (Notification.permission === 'granted') {
            new Notification(`📅 ${event.title}`, {
              body: `${Math.round(diff)}분 후 시작입니다.`,
            });
          }
        }
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [todos, events]);
}
