import {
  Button,
  Group,
  Modal,
  Select,
  Textarea,
  TextInput,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import dayjs from "dayjs";
import "dayjs/locale/ja";

dayjs.locale("ja");

import { useForm, zodResolver } from "@mantine/form";
import { message } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo } from "react";
import { useTodosContext } from "../contexts/TodosContext";
import type { Todo } from "../hooks/useTodos";
import { type TodoSchema, todoSchema } from "../schema";
import { CreatableSectionSelect } from "./CreatableSectionSelect";

interface TodoFormProps {
  opened: boolean;
  onClose: () => void;
  todo?: Todo; // 編集対象のTODO
}

export function TodoForm({
  opened,
  onClose,
  todo,
}: TodoFormProps) {
  const { addTodo, updateTodo, defaultSectionId } = useTodosContext();
  const isEditing = !!todo;

  const initialValues = useMemo<TodoSchema>(
    () => ({
      title: "",
      description: "",
      priority: "medium",
      due_date: null,
      completed: false,
      section_id: defaultSectionId || 0, // defaultSectionIdがnullの場合は0を仮で設定。実際にはnullにはならないはず。
    }),
    [defaultSectionId],
  );

  const form = useForm<TodoSchema>({
    initialValues,
    validate: zodResolver(todoSchema),
  });

  useEffect(() => {
    if (isEditing) {
      form.setValues({
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        due_date: todo.due_date,
        completed: todo.completed,
        section_id: todo.section_id ?? defaultSectionId ?? null,
      });
    } else {
      form.reset();
    }
  }, [isEditing, todo, defaultSectionId, form.setValues, form.reset]);

  const handleSubmit = async (values: TodoSchema) => {
    try {
      const todoData = {
        ...values,
        description: values.description || null,
        due_date: values.due_date || null,
      };

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
      title={isEditing ? "Todoの編集" : "Todoの作成"}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          label="タイトル"
          placeholder="タイトルを入力"
          {...form.getInputProps("title")}
        />
        <Textarea
          label="説明"
          placeholder="説明を入力"
          mt="md"
          {...form.getInputProps("description")}
        />
        <Select
          label="優先度"
          data={["high", "medium", "low"]}
          mt="md"
          {...form.getInputProps("priority")}
        />
        <DatePickerInput
          label="期限"
          placeholder="日付を選択"
          clearable
          mt="md"
          locale="ja"
          valueFormat="YYYY/MM/DD"
          value={form.values.due_date ? new Date(form.values.due_date) : null}
          onChange={(date) =>
            form.setFieldValue("due_date", date ? new Date(date) : null)
          }
        />
        <CreatableSectionSelect
          value={form.values.section_id}
          onChange={(value) =>
            form.setFieldValue("section_id", value ?? defaultSectionId ?? 0)
          }
        />
        <Group justify="flex-end" mt="lg">
          <Button variant="default" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit">{isEditing ? "更新する" : "作成する"}</Button>
        </Group>
      </form>
    </Modal>
  );
}
