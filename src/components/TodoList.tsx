import { Stack, Text, Loader } from '@mantine/core';
import { useTodos } from '../hooks/useTodos';
import { TodoItem } from './TodoItem';

export function TodoList() {
  const { todos, loading, error } = useTodos();

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
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </Stack>
  );
}
