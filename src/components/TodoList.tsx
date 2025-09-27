import {
  Button,
  Flex,
  Group,
  Loader,
  Paper,
  Popover,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useState } from "react";
import { useTodosContext } from "../contexts/TodosContext";
import type { Todo } from "../hooks/useTodos";
import { TodoForm } from "./TodoForm";
import { TodoItem } from "./TodoItem";

export function TodoList() {
  const { todos, sections, loading, error, createSection } = useTodosContext();
  const [formOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [popoverOpened, { close: closePopover, toggle: togglePopover }] =
    useDisclosure(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | undefined>(undefined);
  const [newSectionName, setNewSectionName] = useState("");

  const handleEditClick = (todo: Todo) => {
    setSelectedTodo(todo);
    openForm();
  };

  const handleAddNewClick = () => {
    setSelectedTodo(undefined);
    openForm();
  };

  const handleCloseForm = () => {
    setSelectedTodo(undefined);
    closeForm();
  };

  const handleAddSection = () => {
    if (newSectionName.trim() !== "") {
      createSection(newSectionName.trim());
      setNewSectionName("");
      closePopover();
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Text c="red">Error: {error}</Text>;
  }

  const todosBySection = todos.reduce(
    (acc, todo) => {
      const sectionId = todo.section_id ?? "unsectioned";
      if (!acc[sectionId]) {
        acc[sectionId] = [];
      }
      acc[sectionId].push(todo);
      return acc;
    },
    {} as Record<string | number, Todo[]>,
  );

  const unsectionedTodos = todosBySection.unsectioned || [];
  const sectionedTodoColumns = sections.map((section) => ({
    section,
    todos: todosBySection[section.id] || [],
  }));

  return (
    <>
      <Flex gap="md" align="flex-start">
        {/* Unsectioned Todos */}
        <Paper withBorder p="md" style={{ flex: "1 0 300px" }}>
          <Group justify="space-between" mb="md">
            <Title order={4}>Tasks</Title>
            <Button size="xs" onClick={() => handleAddNewClick()}>
              New
            </Button>
          </Group>
          <Stack>
            {unsectionedTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onEdit={() => handleEditClick(todo)}
              />
            ))}
          </Stack>
        </Paper>

        {/* Sectioned Todos */}
        {sectionedTodoColumns.map(({ section, todos }) => (
          <Paper
            key={section.id}
            withBorder
            p="md"
            style={{ flex: "1 0 300px" }}
          >
            <Group justify="space-between" mb="md">
              <Title order={4}>{section.name}</Title>
              <Button size="xs" onClick={() => handleAddNewClick()}>
                New
              </Button>
            </Group>
            <Stack>
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onEdit={() => handleEditClick(todo)}
                />
              ))}
            </Stack>
          </Paper>
        ))}

        {/* Add Section Button */}
        <Paper withBorder p="md" style={{ flex: "0 0 300px" }}>
          <Popover
            width={280}
            trapFocus
            position="bottom"
            withArrow
            shadow="md"
            opened={popoverOpened}
            onClose={closePopover}
          >
            <Popover.Target>
              <Button fullWidth onClick={togglePopover}>
                + Add Section
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              <TextInput
                data-autofocus
                value={newSectionName}
                onChange={(event) =>
                  setNewSectionName(event.currentTarget.value)
                }
                placeholder="Section name"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    handleAddSection();
                  }
                }}
              />
              <Button onClick={handleAddSection} mt="xs" fullWidth>
                Add
              </Button>
            </Popover.Dropdown>
          </Popover>
        </Paper>
      </Flex>

      <TodoForm
        opened={formOpened}
        onClose={handleCloseForm}
        todo={selectedTodo}
      />
    </>
  );
}
