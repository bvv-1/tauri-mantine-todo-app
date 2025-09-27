import { AppShell, Burger, Button, Code, Group, Title } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useEffect, useState } from "react";
import { useTodosContext } from "../contexts/TodosContext";
import { TodoForm } from "./TodoForm";

export function Layout({ children }: { children: React.ReactNode }) {
  const [navOpened, { toggle: toggleNav }] = useDisclosure();
  const [formOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const { todos } = useTodosContext();

  useEffect(() => {
    setDebugInfo(JSON.stringify(todos, null, 2));
  }, [todos]);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !navOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={navOpened}
              onClick={toggleNav}
              hiddenFrom="sm"
              size="sm"
            />
            <Title order={3}>Todo</Title>
          </Group>
          <Button onClick={openForm}>New</Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {/* Navbar content here */}
        Navbar
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
        <TodoForm opened={formOpened} onClose={closeForm} />

        {debugInfo && (
          <Code block mt="md" style={{ whiteSpace: "pre-wrap" }}>
            {debugInfo}
          </Code>
        )}
      </AppShell.Main>
    </AppShell>
  );
}
