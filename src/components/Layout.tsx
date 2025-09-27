import { AppShell, Burger, Group, Title, Button } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { TodoForm } from "./TodoForm";

export function Layout({ children }: { children: React.ReactNode }) {
  const [navOpened, { toggle: toggleNav }] = useDisclosure();
  const [formOpened, { open: openForm, close: closeForm }] =
    useDisclosure(false);

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
            <Title order={3}>Tauri Mantine Todo</Title>
          </Group>
          <Button onClick={openForm}>New Todo</Button>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        {/* Navbar content here */}
        Navbar
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
        <TodoForm opened={formOpened} onClose={closeForm} />
      </AppShell.Main>
    </AppShell>
  );
}
