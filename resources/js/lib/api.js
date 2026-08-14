import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const api = axios.create({
  baseURL,
  headers: { 'Accept': 'application/json' },
});

// Attach the bearer token (if signed in) to every request.
export const TOKEN_KEY = 'it_auth_token';
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// A stale/expired token → clear it so the app treats the user as signed out.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401) localStorage.removeItem(TOKEN_KEY);
    return Promise.reject(error);
  }
);

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(Number(n||0));

export const fetchCategoriesTree = async () => { const { data } = await api.get('/categories/tree'); return data.data; };
export const fetchCategories     = async () => { const { data } = await api.get('/categories'); return data.data; };
export const fetchCourses        = async (p={}) => { const { data } = await api.get('/courses', { params:p }); return data; };
export const fetchCourse         = async (slug) => { const { data } = await api.get(`/courses/${slug}`); return data.data; };
export const fetchTutors         = async (p={}) => { const { data } = await api.get('/tutors', { params:p }); return data.data; };
// `availability` rides alongside the resource rather than inside it, because
// the list endpoint shares TutorResource and computing a week of slots per row
// would be an N+1. Merged here so callers see one tutor object.
export const fetchTutor          = async (slug) => { const { data } = await api.get(`/tutors/${slug}`); return { ...data.data, availability: data.availability ?? [] }; };
export const fetchTutorFilters   = async () => { const { data } = await api.get('/tutors/filters'); return data; };
export const fetchCities         = async () => { const { data } = await api.get('/cities'); return data.data; };
export const fetchCity           = async (slug) => { const { data } = await api.get(`/cities/${slug}`); return data; };
export const fetchPosts          = async (params = {}) => { const { data } = await api.get('/posts', { params }); return data; };
export const fetchPost           = async (slug) => { const { data } = await api.get(`/posts/${slug}`); return data.data; };

// Auth
export const registerUser = async (payload) => { const { data } = await api.post('/auth/register', payload); return data; };
export const loginUser    = async (payload) => { const { data } = await api.post('/auth/login', payload); return data; };
export const logoutUser   = async () => { const { data } = await api.post('/auth/logout'); return data; };
export const fetchMe      = async () => { const { data } = await api.get('/auth/me'); return data.data; };

// Students (parent)
export const fetchStudents = async () => { const { data } = await api.get('/students'); return data.data; };
export const createStudent = async (p) => { const { data } = await api.post('/students', p); return data.data; };
export const updateStudent = async (id, p) => { const { data } = await api.put(`/students/${id}`, p); return data.data; };
export const deleteStudent = async (id) => { await api.delete(`/students/${id}`); };

// My demo requests + enrollments (signed-in parent)
export const fetchMyDemoRequests = async () => { const { data } = await api.get('/my/demo-requests'); return data.data; };
// The family answers a time their teacher proposed.
// E7 — achievements a family records. Private unless they consent AND staff approve.
export const fetchMyAchievements  = async () => { const { data } = await api.get('/my/achievements'); return data.data; };
// E3/E4 — company-supplied material for the courses you are enrolled in.
export const fetchMyCourseMaterials = async () => { const { data } = await api.get('/my/course-materials'); return data.data; };
// A blob download, not a plain href: the file lives on the private disk behind
// a bearer token, so a raw <a href> would just 401.
export const downloadCourseMaterial = async (id, filename) => {
  const res = await api.get(`/course-materials/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename || 'material' });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};
// E6 — classes attended, materials held, per student on the account.
export const fetchMyRecord        = async () => { const { data } = await api.get('/my/record'); return data.data; };
export const createMyAchievement  = async (p) => { const { data } = await api.post('/my/achievements', p); return data; };
export const updateMyAchievement  = async ({ id, ...p }) => { const { data } = await api.patch(`/my/achievements/${id}`, p); return data.data; };
export const deleteMyAchievement  = async (id) => { await api.delete(`/my/achievements/${id}`); };

export const acceptDemoSlot  = async ({ demoId, slotId }) => { const { data } = await api.post(`/my/demo-requests/${demoId}/slots/${slotId}/accept`); return data; };
export const declineDemoSlot = async ({ demoId, slotId }) => { const { data } = await api.post(`/my/demo-requests/${demoId}/slots/${slotId}/decline`); return data; };
export const fetchMyEnrollments  = async () => { const { data } = await api.get('/my/enrollments'); return data.data; };

// Teacher portal (own profile + classroom)
export const fetchTeacherProfile  = async () => { const { data } = await api.get('/teacher/profile'); return data.data; };
export const updateTeacherProfile = async (payload) => { const { data } = await api.put('/teacher/profile', payload); return data.data; };
export const fetchTeacherStudents = async () => { const { data } = await api.get('/teacher/students'); return data.data; };
export const fetchTeacherDemos    = async () => { const { data } = await api.get('/teacher/demos'); return data.data; };
// E9 — how much of this month's 25% online allowance is left.
export const fetchOnlineAllowance = async () => { const { data } = await api.get('/teacher/online-allowance'); return data.data; };
// A teacher offers a time. No phone number needed for this to work — contact
// details stay withheld until a coordinator releases them.
export const proposeDemoSlot      = async ({ demoId, ...p }) => { const { data } = await api.post(`/teacher/demos/${demoId}/slots`, p); return data; };
export const withdrawDemoSlot     = async ({ demoId, slotId }) => { const { data } = await api.patch(`/teacher/demos/${demoId}/slots/${slotId}/withdraw`); return data; };
export const fetchClassLogs = async (enrollmentId) => { const { data } = await api.get(`/teacher/enrollments/${enrollmentId}/logs`); return data.data; };
export const addClassLog    = async (enrollmentId, payload) => { const { data } = await api.post(`/teacher/enrollments/${enrollmentId}/logs`, payload); return data.data; };

// Curriculum (teacher)
export const fetchCurriculum = async (eid) => { const { data } = await api.get(`/teacher/enrollments/${eid}/curriculum`); return data.data; };
export const addCurriculumItem = async (eid, p) => { const { data } = await api.post(`/teacher/enrollments/${eid}/curriculum`, p); return data.data; };
export const updateCurriculumItem = async (eid, id, p) => { const { data } = await api.patch(`/teacher/enrollments/${eid}/curriculum/${id}`, p); return data.data; };
export const deleteCurriculumItem = async (eid, id) => { await api.delete(`/teacher/enrollments/${eid}/curriculum/${id}`); };

// Materials (teacher upload; parent/teacher download)
export const fetchMaterials = async (eid) => { const { data } = await api.get(`/teacher/enrollments/${eid}/materials`); return data.data; };
export const uploadMaterial = async (eid, formData) => { const { data } = await api.post(`/teacher/enrollments/${eid}/materials`, formData); return data.data; };
export const deleteMaterial = async (eid, id) => { await api.delete(`/teacher/enrollments/${eid}/materials/${id}`); };
export const downloadMaterial = async (id, filename) => {
  const res = await api.get(`/materials/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename || 'material' });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

// Course proposals (teacher + admin)
export const fetchMyProposals = async () => { const { data } = await api.get('/teacher/proposals'); return data.data; };
export const submitProposal   = async (p) => { const { data } = await api.post('/teacher/proposals', p); return data.data; };
export const fetchAdminProposals = async (status='') => { const { data } = await api.get('/admin/proposals', { params:{ status } }); return data; };
export const decideProposal      = async (id, status) => { const { data } = await api.patch(`/admin/proposals/${id}`, { status }); return data.data; };

// Parent portal: full enrollment detail
export const fetchMyEnrollmentDetail = async (id) => { const { data } = await api.get(`/my/enrollments/${id}`); return data.data; };
export const requestReschedule = async (id, p) => { const { data } = await api.post(`/my/enrollments/${id}/reschedules`, p); return data.data; };

// In-app notifications (Phase 8)
export const fetchNotifications = async () => { const { data } = await api.get('/notifications'); return data; };
export const markNotificationRead = async (id) => { await api.patch(`/notifications/${id}/read`); };
export const markAllNotificationsRead = async () => { await api.patch('/notifications/read-all'); };

// Teacher reschedules (Phase 8)
export const fetchTeacherReschedules = async () => { const { data } = await api.get('/teacher/reschedules'); return data.data; };
export const decideReschedule = async (id, status) => { const { data } = await api.patch(`/teacher/reschedules/${id}`, { status }); return data.data; };

// Admin analytics (Phase 9)
export const fetchAdminAnalytics = async () => { const { data } = await api.get('/admin/analytics'); return data.data; };

// Teacher calendar (Phase 5)
export const fetchTeacherCalendar = async (month) => { const { data } = await api.get('/teacher/calendar', { params: month ? { month } : {} }); return data.data; };

// Student portfolio (Phase 6)
export const fetchPortfolio = async (studentId) => { const { data } = await api.get(`/students/${studentId}/portfolio`); return data.data; };
export const addPortfolioItem = async (studentId, formData) => { const { data } = await api.post(`/students/${studentId}/portfolio`, formData); return data.data; };
export const deletePortfolioItem = async (id) => { await api.delete(`/portfolio/${id}`); };
export const downloadPortfolioItem = async (id, filename) => {
  const res = await api.get(`/portfolio/${id}/download`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename || 'portfolio-item' });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};

// Parent: upcoming scheduled classes (Phase 6)
export const fetchUpcomingClasses = async () => { const { data } = await api.get('/my/upcoming-classes'); return data.data; };

// Exam updates (Phase 6)
export const fetchExamUpdates = async () => { const { data } = await api.get('/exam-updates'); return data.data; };
export const fetchAdminExamUpdates = async () => { const { data } = await api.get('/admin/exam-updates'); return data.data; };
export const createExamUpdate = async (p) => { const { data } = await api.post('/admin/exam-updates', p); return data.data; };
export const updateExamUpdate = async (id, p) => { const { data } = await api.patch(`/admin/exam-updates/${id}`, p); return data.data; };
export const deleteExamUpdate = async (id) => { await api.delete(`/admin/exam-updates/${id}`); };

// WhatsApp testimonials — the chat-bubble cards on the homepage / shop page.
export const fetchWhatsappTestimonials      = async () => { const { data } = await api.get('/whatsapp-testimonials'); return data.data; };
export const fetchAdminWhatsappTestimonials = async () => { const { data } = await api.get('/admin/whatsapp-testimonials'); return data.data; };
export const createWhatsappTestimonial      = async (p) => { const { data } = await api.post('/admin/whatsapp-testimonials', p); return data.data; };
export const updateWhatsappTestimonial      = async (id, p) => { const { data } = await api.patch(`/admin/whatsapp-testimonials/${id}`, p); return data.data; };
export const deleteWhatsappTestimonial      = async (id) => { await api.delete(`/admin/whatsapp-testimonials/${id}`); };

// Admin (staff)
export const fetchAdminDemoRequests = async (p={}) => { const { data } = await api.get('/admin/demo-requests', { params: typeof p === 'string' ? { status: p } : p }); return data; };
export const fetchDemoSuggestions   = async (id) => { const { data } = await api.get(`/admin/demo-requests/${id}/suggestions`); return data; };
export const fetchAdminTeachers = async (status='') => { const { data } = await api.get('/admin/teachers', { params:{ status } }); return data; };
export const approveTeacher     = async (id, status) => { const { data } = await api.patch(`/admin/teachers/${id}`, { status }); return data.data; };
export const assignDemo       = async (id, payload) => { const { data } = await api.patch(`/admin/demo-requests/${id}`, payload); return data.data; };
// Coordinator controls: who may see the family's details, and logging a time
// settled on a phone call.
export const releaseDemoContact = async (id, released) => { const { data } = await api.patch(`/admin/demo-requests/${id}/contact`, { released }); return data.data; };
export const logDemoSlot        = async (id, payload) => { const { data } = await api.post(`/admin/demo-requests/${id}/slots`, payload); return data.data; };
export const convertDemo      = async (id, payload) => { const { data } = await api.post(`/admin/demo-requests/${id}/convert`, payload); return data.data; };
export const fetchAdminEnrollments = async () => { const { data } = await api.get('/admin/enrollments'); return data; };

// KYC documents
export const fetchKyc  = async () => { const { data } = await api.get('/kyc'); return data.data; };
export const uploadKyc = async (formData) => { const { data } = await api.post('/kyc', formData); return data.data; };
export const deleteKyc = async (id) => { await api.delete(`/kyc/${id}`); };
export const submitDemoRequest   = async (p) => { const { data } = await api.post('/demo-requests', p); return data; };
export const submitContact       = async (p) => { const { data } = await api.post('/contact', p); return data; };
export const placeOrder          = async (p) => { const { data } = await api.post('/orders', p); return data; };
export const verifyPayment       = async (p) => { const { data } = await api.post('/orders/verify', p); return data; };
// Paginated admin lists all return {data, links, meta} — read meta.last_page,
// not last_page.
export const fetchAdminOrders    = async (p={}) => { const { data } = await api.get('/admin/orders', { params:p }); return data; };
export const updateAdminOrder    = async ({ id, status }) => { const { data } = await api.patch(`/admin/orders/${id}`, { status }); return data; };
export const fetchEvents        = async () => { const { data } = await api.get('/events'); return data.data; };
export const fetchSocialYoutube   = async () => { const { data } = await api.get('/social/youtube'); return data.data; };
export const fetchSocialInstagram = async () => { const { data } = await api.get('/social/instagram'); return data; };
export const fetchEvent         = async (slug) => { const { data } = await api.get(`/events/${slug}`); return data; };
export const fetchAdminEvents   = async () => { const { data } = await api.get('/admin/events'); return data.data; };
export const createAdminEvent   = async (p) => { const { data } = await api.post('/admin/events', p); return data; };
export const updateAdminEvent   = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/events/${id}`, p); return data; };
export const deleteAdminEvent   = async (id) => { const { data } = await api.delete(`/admin/events/${id}`); return data; };
export const fetchVideoCourses      = async () => { const { data } = await api.get('/video-courses'); return data.data; };
export const fetchVideoCourse       = async (slug) => { const { data } = await api.get(`/video-courses/${slug}`); return data; };
export const fetchLessonPlayback    = async ({ courseId, lessonId }) => { const { data } = await api.post(`/video-courses/${courseId}/lessons/${lessonId}/playback`); return data; };
export const fetchMyVideoCourses    = async () => { const { data } = await api.get('/my/video-courses'); return data.data; };
export const fetchLessonSummary     = async ({ courseId, lessonId }) => { const { data } = await api.get(`/video-courses/${courseId}/lessons/${lessonId}/summary`); return data.summary; };
export const askLesson              = async ({ courseId, lessonId, question }) => { const { data } = await api.post(`/video-courses/${courseId}/lessons/${lessonId}/ask`, { question }); return data.answer; };
// F3/F4/F5 — a structured whiteboard: steps, an optional bar diagram, an optional slider.
export const explainLesson          = async ({ courseId, lessonId, topic }) => { const { data } = await api.post(`/video-courses/${courseId}/lessons/${lessonId}/explain`, { topic }); return data.board; };
export const fetchAdminVideoCourses = async () => { const { data } = await api.get('/admin/video-courses'); return data.data; };
export const createAdminVideoCourse = async (p) => { const { data } = await api.post('/admin/video-courses', p); return data; };
export const updateAdminVideoCourse = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/video-courses/${id}`, p); return data; };
export const deleteAdminVideoCourse = async (id) => { const { data } = await api.delete(`/admin/video-courses/${id}`); return data; };
export const fetchAdminUsers        = async (params={}) => { const { data } = await api.get('/admin/users', { params }); return data; };
export const updateUserRole         = async ({ id, role }) => { const { data } = await api.patch(`/admin/users/${id}/role`, { role }); return data.data; };
export const resetUserPassword      = async ({ id, password }) => { const { data } = await api.post(`/admin/users/${id}/password`, { password }); return data.message; };
export const requestUploadUrl       = async ({ courseId, filename, contentType }) => { const { data } = await api.post(`/admin/video-courses/${courseId}/upload-url`, { filename, content_type: contentType }); return data; };
// Deliberately a bare axios call, not the shared `api` client: that one attaches
// our bearer token to every request, and it must never be sent to Cloudflare.
export const uploadToR2             = async ({ uploadUrl, file, onProgress }) =>
  axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    onUploadProgress: e => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
  });
// Account self-service (Account & Orders page)
export const updateMe         = async (p) => { const { data } = await api.put('/auth/me', p); return data.data; };
export const changeMyPassword = async (p) => { const { data } = await api.post('/auth/password', p); return data.message; };
// Sign-in addresses. Each returns the whole {primary, additional} set, so the
// caller never has to reconcile a partial update.
// Teacher logins for the pre-account listings. provisionTeacherAccounts returns
// plaintext passwords ONCE — show them, let the admin copy them, never cache.
// Images committed to the site, for the admin image picker.
export const fetchMediaImages       = async ()  => { const { data } = await api.get('/admin/media/images'); return data.data; };
export const fetchProvisionStatus   = async ()  => { const { data } = await api.get('/admin/teachers/provision-status'); return data; };
export const provisionTeacherLogins = async (p) => { const { data } = await api.post('/admin/teachers/provision', p); return data; };
export const fetchMyEmails    = async ()      => { const { data } = await api.get('/auth/emails'); return data; };
export const addMyEmail       = async (p)     => { const { data } = await api.post('/auth/emails', p); return data; };
export const makeMyEmailPrimary = async (id, p) => { const { data } = await api.post(`/auth/emails/${id}/primary`, p); return data; };
export const removeMyEmail    = async (id, p) => { const { data } = await api.post(`/auth/emails/${id}/remove`, p); return data; };
export const fetchMyOrders    = async () => { const { data } = await api.get('/my/orders'); return data.data; };

// Public course reviews
export const fetchCourseReviews = async (slug) => { const { data } = await api.get(`/courses/${slug}/reviews`); return data; };
export const submitCourseReview = async ({ slug, ...p }) => { const { data } = await api.post(`/courses/${slug}/reviews`, p); return data; };
// Teacher reviews. The GET also returns `can_review`, which says whether the
// signed-in visitor has a completed demo with this teacher — the page uses it
// so it never shows a form the API would reject.
export const fetchTutorReviews = async (slug) => { const { data } = await api.get(`/tutors/${slug}/reviews`); return data; };
// Ranked shortlist for the booking flow. Public-safe: fit reasons and the real
// star rating, never the internal ranking score or conversion rate.
export const fetchTutorSuggestions = async (p={}) => { const { data } = await api.get('/tutors/suggestions', { params:p }); return data; };
export const submitTutorReview = async ({ slug, ...p }) => { const { data } = await api.post(`/tutors/${slug}/reviews`, p); return data; };

// Admin console
export const fetchAdminOverview    = async () => { const { data } = await api.get('/admin/overview'); return data.data; };
export const fetchAdminTeacherRows = async (p={}) => { const { data } = await api.get('/admin/teachers-console', { params:p }); return data; };
export const toggleTeacherListing  = async ({ id, is_listed }) => { const { data } = await api.patch(`/admin/teachers/${id}/listing`, { is_listed }); return data.data; };
// A4 — a teacher's own edits reach their public listing only through these.
export const publishTeacherChanges = async (id) => { const { data } = await api.post(`/admin/teachers/${id}/publish`); return data; };
export const discardTeacherChanges = async (id) => { const { data } = await api.post(`/admin/teachers/${id}/discard`); return data; };
export const updateTeacherApplication = async ({ id, status }) => { const { data } = await api.patch(`/admin/teacher-applications/${id}`, { status }); return data; };
export const teacherApplicationCvUrl  = (id) => `${baseURL}/admin/teacher-applications/${id}/cv`;
export const downloadTeacherCv     = async (id, filename) => {
  const res = await api.get(`/admin/teacher-applications/${id}/cv`, { responseType: 'blob' });
  const url = URL.createObjectURL(res.data);
  const a = Object.assign(document.createElement('a'), { href: url, download: filename || 'cv' });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
};
export const fetchAdminStudents    = async (p={}) => { const { data } = await api.get('/admin/students', { params:p }); return data; };
export const updateAdminStudent    = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/students/${id}`, p); return data.data; };
export const deleteAdminDemo       = async (id) => { await api.delete(`/admin/demo-requests/${id}`); };
export const deleteAdminOrder      = async (id) => { const { data } = await api.delete(`/admin/orders/${id}`); return data; };
export const createAdminUser       = async (p) => { const { data } = await api.post('/admin/users', p); return data.data; };
export const createStudentAccount  = async (p) => { const { data } = await api.post('/admin/users/student', p); return data.data; };
export const updateAdminUser       = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/users/${id}`, p); return data.data; };
export const deleteAdminUser       = async ({ id, confirm=false }) => { const { data } = await api.delete(`/admin/users/${id}`, { data: { confirm } }); return data; };
export const fetchUserDashboard    = async (id) => { const { data } = await api.get(`/admin/users/${id}/dashboard`); return data.data; };
export const fetchAdminReviews     = async (p={}) => { const { data } = await api.get('/admin/reviews', { params:p }); return data; };
export const createAdminReview     = async (p) => { const { data } = await api.post('/admin/reviews', p); return data.data; };
export const updateAdminReview     = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/reviews/${id}`, p); return data.data; };
export const deleteAdminReview     = async (id) => { await api.delete(`/admin/reviews/${id}`); };
export const fetchAdminCourses     = async (p={}) => { const { data } = await api.get('/admin/courses', { params:p }); return data; };
export const createAdminCourse     = async (p) => { const { data } = await api.post('/admin/courses', p); return data.data; };
export const updateAdminCourse     = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/courses/${id}`, p); return data.data; };
export const deleteAdminCourse     = async (id) => { const { data } = await api.delete(`/admin/courses/${id}`); return data; };
export const fetchAdminAudit       = async (p={}) => { const { data } = await api.get('/admin/audit', { params:p }); return data; };
export const fetchAdminSettings    = async () => { const { data } = await api.get('/admin/settings'); return data.data; };
export const saveAdminSettings     = async (p) => { const { data } = await api.put('/admin/settings', p); return data.data; };

// --- Support -----------------------------------------------------------------
// The customer's half of the inbox. The public /contact form (submitContact
// above) opens a ticket in the same queue.
export const fetchSupportTickets = async () => { const { data } = await api.get('/support/tickets'); return data.data; };
export const openSupportTicket   = async (p) => { const { data } = await api.post('/support/tickets', p); return data; };
export const replySupportTicket  = async ({ id, message }) => { const { data } = await api.post(`/support/tickets/${id}/messages`, { message }); return data.data; };
export const closeSupportTicket  = async (id) => { const { data } = await api.patch(`/support/tickets/${id}/close`); return data.data; };

// Staff side of the same queue.
export const fetchAdminSupport       = async (p={}) => { const { data } = await api.get('/admin/support', { params:p }); return data; };
export const fetchAdminSupportTicket = async (id) => { const { data } = await api.get(`/admin/support/${id}`); return data.data; };
export const replyAdminSupport       = async ({ id, message }) => { const { data } = await api.post(`/admin/support/${id}/messages`, { message }); return data.data; };
export const updateAdminSupport      = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/support/${id}`, p); return data.data; };

// --- Physical / home tuition -------------------------------------------------
// Address autofill (public — the apply and enquiry forms run signed-out).
export const lookupPincode = async (pin) => { const { data } = await api.get(`/pincodes/${pin}`); return data; };

// Teacher's own physical profile. Saved whole-document: the wizard is one
// screen to the teacher, so it is one request to the server.
export const fetchPhysicalProfile  = async () => { const { data } = await api.get('/teacher/physical-profile'); return data.data; };
export const savePhysicalProfile   = async (payload) => { const { data } = await api.put('/teacher/physical-profile', payload); return data.data; };
export const setPhysicalStatus     = async (status) => { const { data } = await api.patch('/teacher/physical-profile/status', { status }); return data.data; };

// Family requirements. The POST works signed-out too (guest lead capture).
export const fetchTuitionRequirements = async () => { const { data } = await api.get('/tuition-requirements'); return data.data; };
export const createTuitionRequirement = async (p) => { const { data } = await api.post('/tuition-requirements', p); return data; };
export const updateTuitionRequirement = async ({ id, ...p }) => { const { data } = await api.put(`/tuition-requirements/${id}`, p); return data.data; };
export const closeTuitionRequirement  = async (id) => { const { data } = await api.patch(`/tuition-requirements/${id}/close`); return data.data; };
export const deleteTuitionRequirement = async (id) => { await api.delete(`/tuition-requirements/${id}`); };

// Admin console — the two physical queues (read + triage only; assignment is
// the leads-management software's, via the /api/matching/v1 write-back).
export const fetchAdminPhysicalProfiles = async (p={}) => { const { data } = await api.get('/admin/physical/profiles', { params:p }); return data; };
export const fetchAdminPhysicalProfile  = async (id) => { const { data } = await api.get(`/admin/physical/profiles/${id}`); return data.data; };
export const updateAdminPhysicalProfile = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/physical/profiles/${id}`, p); return data.data; };
export const fetchAdminRequirements     = async (p={}) => { const { data } = await api.get('/admin/physical/requirements', { params:p }); return data; };
export const fetchAdminRequirement      = async (id) => { const { data } = await api.get(`/admin/physical/requirements/${id}`); return data.data; };
export const fetchRequirementSuggestions = async (id) => { const { data } = await api.get(`/admin/physical/requirements/${id}/suggestions`); return data; };
export const updateAdminRequirement     = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/physical/requirements/${id}`, p); return data.data; };

export const fetchAdminLessons      = async (courseId) => { const { data } = await api.get(`/admin/video-courses/${courseId}/lessons`); return data.data; };
export const createAdminLesson      = async ({ courseId, ...p }) => { const { data } = await api.post(`/admin/video-courses/${courseId}/lessons`, p); return data; };
export const updateAdminLesson      = async ({ courseId, id, ...p }) => { const { data } = await api.patch(`/admin/video-courses/${courseId}/lessons/${id}`, p); return data; };
export const deleteAdminLesson      = async ({ courseId, id }) => { const { data } = await api.delete(`/admin/video-courses/${courseId}/lessons/${id}`); return data; };
// F7 — question authoring. These admin routes are the only place answers travel.
export const fetchAdminQuestions    = async (lessonId) => { const { data } = await api.get(`/admin/lessons/${lessonId}/questions`); return data.data; };
export const createAdminQuestion    = async ({ lessonId, ...p }) => { const { data } = await api.post(`/admin/lessons/${lessonId}/questions`, p); return data.data; };
export const updateAdminQuestion    = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/questions/${id}`, p); return data.data; };
export const deleteAdminQuestion    = async (id) => { const { data } = await api.delete(`/admin/questions/${id}`); return data; };

// Group classes. Public read is the /group-classes page AND the homepage's
// price overlay, so both bill the same source and cannot drift apart.
export const fetchGroupClasses      = async () => { const { data } = await api.get('/group-classes'); return data; };
export const createAdminBatch       = async ({ courseId, ...p }) => { const { data } = await api.post(`/admin/courses/${courseId}/batches`, p); return data; };
export const updateAdminBatch       = async ({ courseId, id, ...p }) => { const { data } = await api.patch(`/admin/courses/${courseId}/batches/${id}`, p); return data; };
export const deleteAdminBatch       = async ({ courseId, id }) => { const { data } = await api.delete(`/admin/courses/${courseId}/batches/${id}`); return data; };

// Blog. Admin index returns drafts too — the public /posts endpoint never does.
export const fetchAdminPosts        = async () => { const { data } = await api.get('/admin/posts'); return data.data; };
export const createAdminPost        = async (p) => { const { data } = await api.post('/admin/posts', p); return data; };
export const updateAdminPost        = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/posts/${id}`, p); return data; };
export const deleteAdminPost        = async (id) => { const { data } = await api.delete(`/admin/posts/${id}`); return data; };

// Policy pages and site-wide details, both editable in the console.
export const fetchSiteSettings     = async () => { const { data } = await api.get('/site-settings'); return data.data; };
export const fetchLegalNav         = async () => { const { data } = await api.get('/legal'); return data.data; };
export const fetchLegalDoc         = async (slug) => { const { data } = await api.get(`/legal/${slug}`); return data.data; };
export const fetchAdminLegal       = async () => { const { data } = await api.get('/admin/legal'); return data.data; };
export const updateAdminLegal      = async ({ id, ...p }) => { const { data } = await api.patch(`/admin/legal/${id}`, p); return data.data; };
// The "Verified" badge on a public tutor card. It was granted by a schema
// default (tutors.verified defaults to true) with no way to withdraw it.
export const toggleTeacherVerified = async ({ id, verified }) => { const { data } = await api.patch(`/admin/teachers/${id}/verified`, { verified }); return data.data; };

// Home-page testimonials — reviews staff have approved AND shortlisted. Empty
// until there are real ones, which is when the placeholders start retiring.
export const fetchTestimonials = async () => { const { data } = await api.get('/testimonials'); return data.data; };

// The whole settings payload — values plus the deploy's backup status. Separate
// from fetchAdminSettings because the Reviews tab depends on that returning the
// settings object itself.
export const fetchAdminSettingsFull = async () => { const { data } = await api.get('/admin/settings'); return data; };
