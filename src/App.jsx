import { lazy, Suspense } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer/Footer.jsx';
import Navbar from './components/Navbar/Navbar.jsx';
import RouteEffects from './components/RouteEffects.jsx';
import About from './pages/About.jsx';
import NotFound from './pages/NotFound.jsx';
import Register from './pages/Register.jsx';
import Sponsors from './pages/Sponsors.jsx';
import Timeline from './pages/Timeline.jsx';
import Tracks from './pages/Tracks.jsx';

// The home page carries the Three.js journey, so it is loaded on demand.
const Home = lazy(() => import('./pages/Home.jsx'));

function SkipLink() {
  const isHome = useLocation().pathname === '/';
  return (
    <a className="skip-link" href={isHome ? '#details' : '#main'}>
      {isHome ? 'Skip the visual journey' : 'Skip to content'}
    </a>
  );
}

export default function App() {
  return (
    <>
      <SkipLink />
      <RouteEffects />
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/tracks" element={<Tracks />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
