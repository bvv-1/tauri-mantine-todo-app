import { invoke } from "@tauri-apps/api/core";
import { useCallback, useEffect, useState } from "react";

// RustのTodo構造体に対応する型
export interface Todo {
  id: number;
  title: string;
  description: string | null;
  priority: "high" | "medium" | "low";
  due_date: Date | null;
  completed: boolean;
  section_id: number;
}

// RustのSection構造体に対応する型
export interface Section {
  id: number;
  name: string;
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [defaultSectionId, setDefaultSectionId] = useState<number | null>(null);
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

  const fetchSections = useCallback(async () => {
    try {
      const result = await invoke<Section[]>("get_sections");
      setSections(result);
      const defaultSection = result.find((s) => s.name === "(セクションなし)");
      if (defaultSection) {
        setDefaultSectionId(defaultSection.id);
      }
    } catch (err) {
      setError(err as string);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchTodos(), fetchSections()]);
  }, [fetchTodos, fetchSections]);

  const addTodo = async (newTodo: Omit<Todo, "id" | "completed">) => {
    try {
      await invoke("add_todo", {
        title: newTodo.title,
        description: newTodo.description,
        priority: newTodo.priority,
        dueDate: newTodo.due_date,
        sectionId: newTodo.section_id,
      });
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
      await invoke("update_todo", {
        id: updatedTodo.id,
        title: updatedTodo.title,
        description: updatedTodo.description,
        priority: updatedTodo.priority,
        dueDate: updatedTodo.due_date,
        sectionId: updatedTodo.section_id,
      });
      await fetchTodos();
    } catch (err) {
      setError(err as string);
    }
  };

  const createSection = async (name: string) => {
    try {
      const newSection = await invoke<Section>("create_section", { name });
      setSections((prev) => [...prev, newSection]);
      return newSection;
    } catch (err) {
      setError(err as string);
      throw err;
    }
  };

  return {
    todos,
    sections,
    loading,
    error,
    addTodo,
    toggleTodo,
    archiveTodo,
    updateTodo,
    createSection,
    refetch: fetchTodos,
    defaultSectionId,
  };
}
