import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AdminRoutes from './routes/AdminRoutes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
