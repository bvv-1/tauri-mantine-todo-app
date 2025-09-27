import React from 'react';
import ReactDOM from 'react-dom/client';
import '@mantine/core/styles.css';

import { MantineProvider } from '@mantine/core';
import { Layout } from './components/Layout';
import { TodoList } from './components/TodoList';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <MantineProvider>
      <Layout>
        <TodoList />
      </Layout>
    </MantineProvider>
  </React.StrictMode>
);
