import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Index from './pages/Index';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/*" element={isAuthenticated ? <Index /> : <Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}

export default App;