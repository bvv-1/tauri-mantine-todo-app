import {
  Button,
  Group,
  Modal,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useForm, zodResolver } from "@mantine/form";
import { message } from "@tauri-apps/plugin-dialog";
import { useEffect } from "react";
import { useTodosContext } from "../contexts/TodosContext";
import type { Todo } from "../hooks/useTodos";
import { type TodoSchema, todoSchema } from "../schema";

interface TodoFormProps {
  opened: boolean;
  onClose: () => void;
  todo?: Todo; // 編集対象のTODO
}

export function TodoForm({ opened, onClose, todo }: TodoFormProps) {
  const { addTodo, updateTodo } = useTodosContext();
  const isEditing = !!todo;

  const form = useForm<{
    title: string;
    description: string | null;
    priority: "high" | "medium" | "low";
    due_date: string | null;
    completed: boolean;
  }>({
    initialValues: {
      title: "",
      description: null,
      priority: "medium",
      due_date: null,
      completed: false,
    },
    validate: zodResolver(todoSchema),
  });

  useEffect(() => {
    if (isEditing) {
      form.setValues({
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        due_date: todo.due_date, // string | null をそのままセット
        completed: todo.completed,
      });
    } else {
      form.reset();
    }
  }, [isEditing, todo, form.setValues, form.reset]);

  const handleSubmit = async (values: TodoSchema) => {
    try {
      const todoData = {
        ...values,
        description: values.description || null,
        due_date: values.due_date
          ? new Date(values.due_date).toISOString()
          : null,
      };
      await message(JSON.stringify(todoData, null, 2));

      if (isEditing) {
        await updateTodo({ id: todo.id, ...todoData });
      } else {
        await addTodo(todoData);
      }
      form.reset();
      onClose();
    } catch (error) {
      await message(String(error), { title: "Error" });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEditing ? "Edit Todo" : "Add Todo"}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="Title"
          placeholder="Enter todo title"
          required
          {...form.getInputProps("title")}
        />
        <Textarea
          label="Description"
          placeholder="Enter todo description"
          mt="md"
          {...form.getInputProps("description")}
        />
        <Select
          label="Priority"
          data={["high", "medium", "low"]}
          mt="md"
          {...form.getInputProps("priority")}
        />
        <DatePickerInput
          label="Due Date"
          placeholder="Pick date"
          clearable
          mt="md"
          value={form.values.due_date ? new Date(form.values.due_date) : null}
          onChange={(date: string | null) => {
            form.setFieldValue("due_date", date);
          }}
        />
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">{isEditing ? "Update" : "Create"}</Button>
        </Group>
      </form>
    </Modal>
  );
}
