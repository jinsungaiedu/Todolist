export type Category = 'work' | 'personal' | 'health' | 'other';
export type RecurringType = 'none' | 'daily' | 'weekly' | 'monthly';

export type Quadrant = 1 | 2 | 3 | 4;
// 1: 급하고 중요  2: 급하고 덜 중요
// 3: 안급하고 중요  4: 안급하고 덜 중요

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  urgent: boolean;
  important: boolean;
  category: Category;
  dueDate?: string;
  dueTime?: string;
  reminder?: number;
  recurring?: RecurringType;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  color: string;
  category: Category;
  reminder?: number;
  createdAt: string;
}

export type View = 'calendar' | 'todos';
