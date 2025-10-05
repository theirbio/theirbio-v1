import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { AuthPage } from '@/pages/AuthPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { Layout } from '@/components/Layout';
import { NotFoundPage } from "./pages/NotFoundPage";
const router = createBrowserRouter([
  {
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/auth",
        element: <AuthPage />,
      },
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/:username",
        element: <ProfilePage />,
      },
      {
        path: "*",
        element: <NotFoundPage />,
      }
    ]
  }
]);
// Do not touch this code
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
)