import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import EventsPage from './pages/EventsPage';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import ManageEvent from './pages/ManageEvent';
import GymLogin from './pages/GymLogin';
import GymSignup from './pages/GymSignup';
import GymDashboard from './pages/GymDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-brand-dark">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/events/:id" element={<EventDetail />} />
            <Route path="/events/:id/manage" element={<ManageEvent />} />
            <Route path="/events/:id/register" element={<Register />} />
            <Route path="/create" element={<CreateEvent />} />
            <Route path="/login" element={<GymLogin />} />
            <Route path="/signup" element={<GymSignup />} />
            <Route path="/dashboard" element={<GymDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/register/success" element={<RegisterSuccess />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
