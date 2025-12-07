import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Orders from './pages/orders/Orders';
import Menu from './pages/menu/Menu';
import AddEditMenu from './pages/menu/AddEditMenu';
import Tables from './pages/tables/Tables';
import Bookings from './pages/bookings/Bookings';
import Marketing from './pages/marketing/Marketing';
import Fleet from './pages/fleet/Fleet';
import Settings from './pages/settings/Settings';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-cream text-primary font-medium animate-pulse">Loading App...</div>;
  return user ? <Outlet /> : <Navigate to="/auth/login" />;
};

const NotFound = () => (
  <div className="h-screen flex flex-col items-center justify-center bg-cream text-center p-4">
    <h1 className="text-9xl font-bold text-gray-200">404</h1>
    <h2 className="text-2xl font-bold text-dark mt-4">Page Not Found</h2>
    <p className="text-gray-500 mt-2 mb-8">The page you are looking for doesn't exist.</p>
    <a href="/" className="btn-primary no-underline inline-flex">Go Home</a>
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      {/* <Route element={<ProtectedRoute />}> */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/add" element={<AddEditMenu />} />
          <Route path="/menu/edit/:id" element={<AddEditMenu />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      {/* </Route> */}

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;