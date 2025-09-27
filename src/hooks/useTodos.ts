import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";

// RustのTodo構造体に対応する型
export interface Todo {
  id: number;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  due_date: string | null;
  completed: boolean;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const result = await invoke<Todo[]>("get_todos");
      setTodos(result);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (newTodo: Omit<Todo, "id" | "completed">) => {
    try {
      await invoke("add_todo", { ...newTodo });
      await fetchTodos(); // リストを再取得
    } catch (err) {
      setError(err as string);
    }
  };

  const toggleTodo = async (id: number) => {
    try {
      await invoke("toggle_todo_completed", { id });
      await fetchTodos(); // リストを再取得
    } catch (err) {
      setError(err as string);
    }
  };

  const archiveTodo = async (id: number) => {
    try {
      await invoke("archive_todo", { id });
      await fetchTodos(); // リストを再取得
    } catch (err) {
      setError(err as string);
    }
  };

  const updateTodo = async (updatedTodo: Omit<Todo, "completed">) => {
    try {
      await invoke("update_todo", { ...updatedTodo });
      await fetchTodos();
    } catch (err) {
      setError(err as string);
    }
  };

  return {
    todos,
    loading,
    error,
    addTodo,
    toggleTodo,
    archiveTodo,
    updateTodo,
    refetch: fetchTodos,
  };
}
