import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import BookDemoPage from './pages/BookDemoPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import FindTutorsPage from './pages/FindTutorsPage.jsx';
import TutorProfilePage from './pages/TutorProfilePage.jsx';
import CityPage from './pages/CityPage.jsx';
import ReferEarnPage from './pages/ReferEarnPage.jsx';
import BecomeTeacherPage from './pages/BecomeTeacherPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:slug" element={<CourseDetailPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/book-demo" element={<BookDemoPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/find-tutors" element={<FindTutorsPage />} />
        <Route path="/tutors/:slug" element={<TutorProfilePage />} />
        <Route path="/tutors-in/:city" element={<CityPage />} />
        <Route path="/refer-earn" element={<ReferEarnPage />} />
        <Route path="/become-a-teacher" element={<BecomeTeacherPage />} />
        <Route path="/privacy" element={<LegalPage doc="privacy" />} />
        <Route path="/terms" element={<LegalPage doc="terms" />} />
        <Route path="/refund" element={<LegalPage doc="refund" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
