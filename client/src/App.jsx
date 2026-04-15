import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import EventsPage from './pages/EventsPage';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import ManageEvent from './pages/ManageEvent';
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
            <Route path="/create" element={<CreateEvent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
