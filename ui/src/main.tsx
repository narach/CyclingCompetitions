import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import App from './routes/App'
import Home from './routes/Home'
import Events from './routes/Events'
import Admin from './routes/Admin'
import AdminEvents from './routes/AdminEvents'
import Register from './routes/Register'
import RegisterCompleted from './routes/RegisterCompleted'
import './i18n'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'events', element: <Events /> },
      { path: 'register/:eventId', element: <Register /> },
      { path: 'register/:eventId/completed', element: <RegisterCompleted /> },
      { path: 'admin', element: <Admin /> },
      { path: 'admin/events', element: <AdminEvents /> },
    ],
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)


