import { createContext, useContext, ReactNode } from "react";
import { useTodos } from "../hooks/useTodos";

// useTodosフックの戻り値の型を定義
type TodosContextType = ReturnType<typeof useTodos>;

// Contextを作成（初期値はundefined）
const TodosContext = createContext<TodosContextType | undefined>(undefined);

// Contextを提供するためのProviderコンポーネント
export function TodosProvider({ children }: { children: ReactNode }) {
  const todosState = useTodos();
  return (
    <TodosContext.Provider value={todosState}>{children}</TodosContext.Provider>
  );
}

// Contextを簡単に利用するためのカスタムフック
export function useTodosContext() {
  const context = useContext(TodosContext);
  if (context === undefined) {
    throw new Error("useTodosContext must be used within a TodosProvider");
  }
  return context;
}
