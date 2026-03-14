import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { useAuth } from '@/store/useAuth';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import Layout from '@/components/layout/Layout';

const TableGrid = lazy(() => import('@/components/pos/TableGrid'));
const MenuPage = lazy(() => import('@/pages/MenuPage'));
const InventoryPage = lazy(() => import('@/pages/InventoryPage'));
const OrdersPage = lazy(() => import('@/pages/OrdersPage'));
const ManagePage = lazy(() => import('@/pages/ManagePage'));
const KOTPage = lazy(() => import('@/pages/KOTPage'));
const ProfilePage = lazy(() => import('@/pages/ProfilePage'));

const PageLoader = () => (
    <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin"></div>
    </div>
);




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
          <Route element={<Layout><Suspense fallback={<PageLoader />}><Outlet /></Suspense></Layout>}>
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
