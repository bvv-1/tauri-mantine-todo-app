import React from "react";
import ReactDOM from "react-dom/client";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";

import { MantineProvider } from "@mantine/core";
import { Layout } from "./components/Layout";
import { TodoList } from "./components/TodoList";
import { TodosProvider } from "./contexts/TodosContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider>
      <TodosProvider>
        <Layout>
          <TodoList />
        </Layout>
      </TodosProvider>
    </MantineProvider>
  </React.StrictMode>,
);
