import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOtp from './pages/VerifyOtp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import TransactionChart from './pages/TransactionChart';
import Categories from './pages/Categories';
import Budgets from './pages/Budgets';
import Sidebar from './components/Sidebar';
import ProfileMenu from './components/ProfileMenu';
import NotificationBell from './components/NotificationBell';
import FloatingAddButton from './components/FloatingAddButton';
import ProtectedRoute from './components/ProtectedRoute';
import Accounts from './pages/Accounts';
import Settings from './pages/Settings';
import AdminUsers from './pages/AdminUsers';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './components/AdminLayout';
import AdminOverview from './pages/AdminOverview';
import AdminManagement from './pages/AdminManagement';
import AdminAudit from "./pages/AdminAudit";

function AppLayout({ children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <header className="app-topbar">
          <NotificationBell />
          <ProfileMenu />
        </header>
        <main className="app-main">{children}</main>
      </div>
      <FloatingAddButton />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/accounts" element={<Accounts />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Transactions />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/transactions/chart"
        element={
          <ProtectedRoute>
            <AppLayout>
              <TransactionChart />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Categories />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/budgets"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Budgets />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Settings />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout>
                <AdminOverview />
              </AdminLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />


      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout>
                <AdminUsers />
              </AdminLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/admins"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout>
                <AdminManagement />
              </AdminLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute>
            <AdminRoute>
              <AdminLayout>
                <AdminAudit />
              </AdminLayout>
            </AdminRoute>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
