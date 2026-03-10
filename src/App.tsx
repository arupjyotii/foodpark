import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/store/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import Layout from '@/components/layout/Layout';
import TableGrid from '@/components/pos/TableGrid';
import MenuPage from '@/pages/MenuPage';
import InventoryPage from '@/pages/InventoryPage';
import OrdersPage from '@/pages/OrdersPage';
import ManagePage from '@/pages/ManagePage';
import KOTPage from '@/pages/KOTPage';
import ProfilePage from '@/pages/ProfilePage';




function App() {
  const { initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout><Outlet /></Layout>}>
            <Route path="/" element={<TableGrid />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/orders/new" element={<MenuPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/kot" element={<KOTPage />} />
            <Route path="/settings" element={<ManagePage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
