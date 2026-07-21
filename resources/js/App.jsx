import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import HomePage from './pages/HomePage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import PlansPage from './pages/PlansPage.jsx';
import GroupClassesPage from './pages/GroupClassesPage.jsx';
import FreeClassesPage from './pages/FreeClassesPage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import BookDemoPage from './pages/BookDemoPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import FindTutorsPage from './pages/FindTutorsPage.jsx';
import SubjectPage from './pages/SubjectPage.jsx';
import TutorProfilePage from './pages/TutorProfilePage.jsx';
import CityPage from './pages/CityPage.jsx';
import BlogPage from './pages/BlogPage.jsx';
import FaqsPage from './pages/FaqsPage.jsx';
import DownloadCurriculumPage from './pages/DownloadCurriculumPage.jsx';
import EventPage from './pages/EventPage.jsx';
import InstrumentsPage from './pages/InstrumentsPage.jsx';
import InstrumentProductPage from './pages/InstrumentProductPage.jsx';
import BuyingGuidePage from './pages/BuyingGuidePage.jsx';
import BoardPage from './pages/BoardPage.jsx';
import VideoCoursesPage from './pages/VideoCoursesPage.jsx';
import VideoCourseDetailPage from './pages/VideoCourseDetailPage.jsx';
import PhysicalClassesPage from './pages/PhysicalClassesPage.jsx';
import BlogPostPage from './pages/BlogPostPage.jsx';
import ReferEarnPage from './pages/ReferEarnPage.jsx';
import BecomeTeacherPage from './pages/BecomeTeacherPage.jsx';
import LegalPage from './pages/LegalPage.jsx';
import CartPage from './pages/CartPage.jsx';
import CheckoutPage from './pages/CheckoutPage.jsx';
import WishlistPage from './pages/WishlistPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
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
        <Route path="/group-classes" element={<GroupClassesPage />} />
        <Route path="/free-classes" element={<FreeClassesPage />} />
        <Route path="/video-courses" element={<VideoCoursesPage />} />
        <Route path="/video-courses/:slug" element={<VideoCourseDetailPage />} />
        <Route path="/events-workshops" element={<LandingPage page="events-workshops" />} />
        <Route path="/events/:slug" element={<EventPage />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/download-curriculum" element={<DownloadCurriculumPage />} />
        <Route path="/instruments" element={<InstrumentsPage />} />
        <Route path="/instruments/:slug" element={<InstrumentProductPage />} />
        <Route path="/buying-guide" element={<BuyingGuidePage />} />
        <Route path="/buying-guide/:slug" element={<BuyingGuidePage />} />
        <Route path="/board/:slug" element={<BoardPage />} />
        <Route path="/competitive-exams" element={<LandingPage page="competitive-exams" />} />
        <Route path="/skill-programmes" element={<LandingPage page="skill-programmes" />} />
        <Route path="/tutor/:slug" element={<TutorProfilePage />} />
        <Route path="/book-demo" element={<BookDemoPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/find-tutors" element={<FindTutorsPage />} />
        <Route path="/physical-classes" element={<PhysicalClassesPage />} />
        <Route path="/tutors/:slug" element={<TutorProfilePage />} />
        <Route path="/subject/:slug" element={<SubjectPage />} />
        <Route path="/tutors-in/:city" element={<CityPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/refer-earn" element={<ReferEarnPage />} />
        <Route path="/become-a-teacher" element={<BecomeTeacherPage />} />
        <Route path="/privacy" element={<LegalPage doc="privacy" />} />
        <Route path="/terms" element={<LegalPage doc="terms" />} />
        <Route path="/refund" element={<LegalPage doc="refund" />} />
        {/* WordPress/WooCommerce alias URLs (live-parity; 301 targets at go-live) */}
        <Route path="/my-account" element={<LoginPage />} />
        <Route path="/refund_returns" element={<LegalPage doc="refund" />} />
        <Route path="/plans-and-pricing" element={<PlansPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
