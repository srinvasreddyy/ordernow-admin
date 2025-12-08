import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GlobalLoader from './components/ui/GlobalLoader';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Performance from './pages/performance/Performance'; // Import new page
import Orders from './pages/orders/Orders';
import Menu from './pages/menu/Menu';
import AddEditMenu from './pages/menu/AddEditMenu';
import Tables from './pages/tables/Tables';
import Bookings from './pages/bookings/Bookings';
import Marketing from './pages/marketing/Marketing';
import Fleet from './pages/fleet/Fleet';
import Settings from './pages/settings/Settings';

// Wrapper for routes that require 'food_delivery_and_dining' role
const DiningRoute = ({ children }) => {
  const { user } = useAuth();
  if (user && user.restaurantType !== 'food_delivery_and_dining') {
    return <Navigate to="/" replace />;
  }
  return children;
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
    <>
    <GlobalLoader />
    <Routes>
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/register" element={<Register />} />

      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/performance" element={<Performance />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/menu/add" element={<AddEditMenu />} />
        <Route path="/menu/edit/:id" element={<AddEditMenu />} />
        
        {/* Protected Dining Routes */}
        <Route path="/tables" element={<DiningRoute><Tables /></DiningRoute>} />
        <Route path="/bookings" element={<DiningRoute><Bookings /></DiningRoute>} />
        
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/fleet" element={<Fleet />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

export default App;