import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import GlobalLoader from './components/ui/GlobalLoader';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import { OnboardingRefresh, OnboardingComplete } from './pages/auth/StripeOnboarding';
import Layout from './components/layout/Layout';
import Dashboard from './pages/dashboard/Dashboard';
import Performance from './pages/performance/Performance';
import Orders from './pages/orders/Orders';
import Menu from './pages/menu/Menu';
import AddEditMenu from './pages/menu/AddEditMenu';
import Tables from './pages/tables/Tables';
import Bookings from './pages/bookings/Bookings';
import Marketing from './pages/marketing/Marketing';
import Fleet from './pages/fleet/Fleet';
import Settings from './pages/settings/Settings';

// --- ROUTE GUARDS ---

/**
 * Protects routes that require authentication.
 * Redirects to Login if user is not authenticated.
 */
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // Wait for auth check to complete

  return user ? (
    <Outlet /> 
  ) : (
    <Navigate to="/auth/login" state={{ from: location }} replace />
  );
};

/**
 * Restricts access to public pages (Login/Register) if user is already logged in.
 * Redirects to Dashboard if authenticated.
 */
const PublicOnlyRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return null;

  return !user ? children : <Navigate to="/" replace />;
};

/**
 * Restricts access based on Restaurant Type.
 */
const DiningRoute = ({ children }) => {
  const { user } = useAuth();
  // Ensure user exists before checking type, though ProtectedRoute handles the null user
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
      {/* --- PUBLIC ROUTES (Accessible only when logged out) --- */}
      <Route path="/auth/login" element={
        <PublicOnlyRoute><Login /></PublicOnlyRoute>
      } />
      <Route path="/auth/register" element={
        <PublicOnlyRoute><Register /></PublicOnlyRoute>
      } />

      {/* --- STRIPE ONBOARDING (Hybrid/Public) --- */}
      <Route path="/onboarding-refresh" element={<OnboardingRefresh />} />
      <Route path="/onboarding-complete" element={<OnboardingComplete />} />

      {/* --- PROTECTED ROUTES (Accessible only when logged in) --- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/menu/add" element={<AddEditMenu />} />
          <Route path="/menu/edit/:id" element={<AddEditMenu />} />
          
          {/* Role-Specific Routes */}
          <Route path="/tables" element={<DiningRoute><Tables /></DiningRoute>} />
          <Route path="/bookings" element={<DiningRoute><Bookings /></DiningRoute>} />
          
          <Route path="/marketing" element={<Marketing />} />
          <Route path="/fleet" element={<Fleet />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  );
}

export default App;