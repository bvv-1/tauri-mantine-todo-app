import { useState } from "react";
import { Stack, Text, Loader } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Todo } from "../hooks/useTodos";
import { useTodosContext } from "../contexts/TodosContext";
import { TodoItem } from "./TodoItem";
import { TodoForm } from "./TodoForm";

export function TodoList() {
  const { todos, loading, error } = useTodosContext();
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>(undefined);

  const handleEditClick = (todo: Todo) => {
    setSelectedTodo(todo);
    open();
  };

  const handleClose = () => {
    setSelectedTodo(undefined);
    close();
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Text c="red">Error: {error}</Text>;
  }

  if (todos.length === 0) {
    return <Text>No todos yet. Add one!</Text>;
  }

  return (
    <Stack>
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onEdit={() => handleEditClick(todo)}
        />
      ))}
      <TodoForm opened={opened} onClose={handleClose} todo={selectedTodo} />
    </Stack>
  );
}
