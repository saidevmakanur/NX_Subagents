import { FormEvent, useEffect, useMemo, useState } from 'react';

type TaskFilter = 'all' | 'active' | 'completed';

type TaskItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

type TasksWindow = Window & {
  TASKS_API_URL?: string;
};

const DEFAULT_API_URL = 'http://localhost:5000/api/tasks';
const TASKS_STORAGE_KEY = 'tasks';
const DARK_MODE_STORAGE_KEY = 'darkMode';

function generateTaskId(): string {
  if (window.crypto && typeof window.crypto.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTask(task: Partial<TaskItem>): TaskItem {
  return {
    id: task.id || generateTaskId(),
    text: (task.text || '').trim(),
    completed: Boolean(task.completed),
    createdAt: task.createdAt || new Date().toISOString(),
  };
}

function getStoredTasks(): TaskItem[] {
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);

  if (!stored) {
    return [];
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.map((task) => normalizeTask(task as Partial<TaskItem>))
      : [];
  } catch {
    return [];
  }
}

function persistTasks(tasks: TaskItem[]): void {
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

async function requestJson<T>(url: string, options: RequestInit = {}): Promise<T | null> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
}

export function App() {
  const apiUrl = (window as TasksWindow).TASKS_API_URL || DEFAULT_API_URL;
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [taskInput, setTaskInput] = useState('');
  const [currentFilter, setCurrentFilter] = useState<TaskFilter>('all');
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem(DARK_MODE_STORAGE_KEY) === 'true');
  const [useLocalFallback, setUseLocalFallback] = useState(false);

  useEffect(() => {
    localStorage.setItem(DARK_MODE_STORAGE_KEY, String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const data = await requestJson<TaskItem[]>(apiUrl);
        const normalized = Array.isArray(data) ? data.map((task) => normalizeTask(task)) : [];
        setTasks(normalized);
        setUseLocalFallback(false);
      } catch {
        const localTasks = getStoredTasks();
        setTasks(localTasks);
        setUseLocalFallback(true);
      }
    };

    void loadTasks();
  }, [apiUrl]);

  const filteredTasks = useMemo(() => {
    if (currentFilter === 'active') {
      return tasks.filter((task) => !task.completed);
    }

    if (currentFilter === 'completed') {
      return tasks.filter((task) => task.completed);
    }

    return tasks;
  }, [currentFilter, tasks]);

  const switchToLocalFallback = (nextTasks: TaskItem[]) => {
    setUseLocalFallback(true);
    persistTasks(nextTasks);
  };

  const handleCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = taskInput.trim();

    if (!text) {
      return;
    }

    if (useLocalFallback) {
      setTasks((prev) => {
        const next = [normalizeTask({ text, completed: false }), ...prev];
        persistTasks(next);
        return next;
      });
      setTaskInput('');
      return;
    }

    try {
      const created = await requestJson<TaskItem>(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });

      if (created) {
        setTasks((prev) => [normalizeTask(created), ...prev]);
      }
    } catch {
      setTasks((prev) => {
        const next = [normalizeTask({ text, completed: false }), ...prev];
        switchToLocalFallback(next);
        return next;
      });
    }

    setTaskInput('');
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const taskToUpdate = tasks.find((task) => task.id === taskId);

    if (!taskToUpdate) {
      return;
    }

    const optimistic = tasks.map((task) =>
      task.id === taskId ? { ...task, completed } : task,
    );
    setTasks(optimistic);

    if (useLocalFallback) {
      persistTasks(optimistic);
      return;
    }

    try {
      const updated = await requestJson<TaskItem>(`${apiUrl}/${encodeURIComponent(taskId)}`, {
        method: 'PUT',
        body: JSON.stringify({ text: taskToUpdate.text, completed }),
      });

      if (updated) {
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? normalizeTask(updated) : task)),
        );
      }
    } catch {
      switchToLocalFallback(optimistic);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const next = tasks.filter((task) => task.id !== taskId);
    setTasks(next);

    if (useLocalFallback) {
      persistTasks(next);
      return;
    }

    try {
      await requestJson<null>(`${apiUrl}/${encodeURIComponent(taskId)}`, {
        method: 'DELETE',
      });
    } catch {
      switchToLocalFallback(next);
    }
  };

  return (
    <main className={`app-shell${isDarkMode ? ' dark' : ''}`}>
      <section className="task-card" aria-labelledby="task-manager-title">
        <header className="task-header">
          <h1 id="task-manager-title">Task Manager</h1>
          <button
            type="button"
            className="dark-toggle-btn"
            aria-label="Toggle dark mode"
            aria-pressed={isDarkMode}
            onClick={() => setIsDarkMode((value) => !value)}
          >
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>

        <h2 className="welcome-headline">Welcome to your task dashboard</h2>

        <form className="task-form" onSubmit={handleCreateTask} aria-label="Add a new task">
          <label htmlFor="task-input" className="visually-hidden">
            New Task
          </label>
          <input
            id="task-input"
            name="task"
            type="text"
            value={taskInput}
            onChange={(event) => setTaskInput(event.target.value)}
            placeholder="Add a new task"
            autoComplete="off"
            required
          />
          <button type="submit">Add</button>
        </form>

        <nav className="filter-nav" aria-label="Task filters">
          <button
            type="button"
            className="filter-btn"
            aria-pressed={currentFilter === 'all'}
            onClick={() => setCurrentFilter('all')}
          >
            All
          </button>
          <button
            type="button"
            className="filter-btn"
            aria-pressed={currentFilter === 'active'}
            onClick={() => setCurrentFilter('active')}
          >
            Active
          </button>
          <button
            type="button"
            className="filter-btn"
            aria-pressed={currentFilter === 'completed'}
            onClick={() => setCurrentFilter('completed')}
          >
            Completed
          </button>
        </nav>

        {useLocalFallback && <p className="status-note">Using local storage fallback.</p>}

        <ul className="task-list" aria-live="polite">
          {filteredTasks.length === 0 ? (
            <li className="empty-state">No tasks yet.</li>
          ) : (
            filteredTasks.map((task) => (
              <li key={task.id} className={`task-item${task.completed ? ' completed' : ''}`}>
                <label className="task-label" htmlFor={`task-${task.id}`}>
                  <input
                    id={`task-${task.id}`}
                    className="task-checkbox"
                    type="checkbox"
                    checked={task.completed}
                    onChange={(event) => void handleToggleTask(task.id, event.target.checked)}
                  />
                  <span className="task-text">{task.text}</span>
                </label>
                <button
                  type="button"
                  className="delete-btn"
                  aria-label={`Delete task '${task.text}'`}
                  onClick={() => void handleDeleteTask(task.id)}
                >
                  x
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}

export default App;
