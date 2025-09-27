import { ActionIcon, Badge, Card, Checkbox, Group, Text } from "@mantine/core";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useTodosContext } from "../contexts/TodosContext";
import type { Todo } from "../hooks/useTodos";

interface TodoItemProps {
  todo: Todo;
  onEdit: () => void;
}

const priorityColors: Record<string, string> = {
  high: "red",
  medium: "yellow",
  low: "blue",
};

export function TodoItem({ todo, onEdit }: TodoItemProps) {
  const { toggleTodo, archiveTodo } = useTodosContext();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Group justify="space-between">
        <Checkbox
          checked={todo.completed}
          onChange={() => toggleTodo(todo.id)}
          label={
            <Text td={todo.completed ? "line-through" : "none"}>
              {todo.title}
            </Text>
          }
        />
        <Group>
          {todo.due_date && (
            <Badge>{new Date(todo.due_date).toLocaleDateString()}</Badge>
          )}
          <Badge color={priorityColors[todo.priority] || "gray"}>
            {todo.priority}
          </Badge>
          <ActionIcon variant="light" color="blue" onClick={onEdit}>
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="red"
            onClick={() => archiveTodo(todo.id)}
          >
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
