import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RutaProtegida, RutaPublica } from './components/RutaProtegida';
import { ToastProvider } from './components/ui/Toast';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TasksPage from './pages/TasksPage';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                <Route
                  path="/login"
                  element={
                    <RutaPublica>
                      <LoginPage />
                    </RutaPublica>
                  }
                />
                <Route
                  path="/registro"
                  element={
                    <RutaPublica>
                      <RegisterPage />
                    </RutaPublica>
                  }
                />
                <Route
                  path="/"
                  element={
                    <RutaProtegida>
                      <TasksPage />
                    </RutaProtegida>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </AuthProvider>
          </BrowserRouter>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
