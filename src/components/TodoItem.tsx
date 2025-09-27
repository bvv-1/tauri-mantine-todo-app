import { Card, Checkbox, Text, Group, ActionIcon, Badge } from '@mantine/core';
import { IconTrash, IconPencil } from '@tabler/icons-react';
import { Todo } from '../hooks/useTodos';
import { useTodos } from '../hooks/useTodos';

interface TodoItemProps {
  todo: Todo;
}

const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'blue',
};

export function TodoItem({ todo }: TodoItemProps) {
  const { toggleTodo, archiveTodo } = useTodos();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Checkbox
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
          label={<Text strikethrough={todo.completed}>{todo.title}</Text>}
        />
        <Group>
            {todo.due_date && <Badge>{todo.due_date}</Badge>}
            <Badge color={priorityColors[todo.priority] || 'gray'}>{todo.priority}</Badge>
            <ActionIcon variant="light" color="blue">
                <IconPencil size={16} />
            </ActionIcon>
            <ActionIcon variant="light" color="red" onClick={() => archiveTodo(todo.id)}>
                <IconTrash size={16} />
            </ActionIcon>
        </Group>
      </Group>
      {todo.description && (
        <Text size="sm" c="dimmed" mt="sm">
          {todo.description}
        </Text>
      )}
    </Card>
  );
}
