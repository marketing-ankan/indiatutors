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
export const fetchTutor          = async (slug) => { const { data } = await api.get(`/tutors/${slug}`); return data.data; };
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
export const fetchMyEnrollments  = async () => { const { data } = await api.get('/my/enrollments'); return data.data; };

// Teacher portal (own profile + classroom)
export const fetchTeacherProfile  = async () => { const { data } = await api.get('/teacher/profile'); return data.data; };
export const updateTeacherProfile = async (payload) => { const { data } = await api.put('/teacher/profile', payload); return data.data; };
export const fetchTeacherStudents = async () => { const { data } = await api.get('/teacher/students'); return data.data; };
export const fetchTeacherDemos    = async () => { const { data } = await api.get('/teacher/demos'); return data.data; };
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

// Admin (staff)
export const fetchAdminDemoRequests = async (status='') => { const { data } = await api.get('/admin/demo-requests', { params:{ status } }); return data; };
export const fetchAdminTeachers = async (status='') => { const { data } = await api.get('/admin/teachers', { params:{ status } }); return data; };
export const approveTeacher     = async (id, status) => { const { data } = await api.patch(`/admin/teachers/${id}`, { status }); return data.data; };
export const fetchDemoTutors  = async (id) => { const { data } = await api.get(`/admin/demo-requests/${id}/tutors`); return data.data; };
export const assignDemo       = async (id, payload) => { const { data } = await api.patch(`/admin/demo-requests/${id}`, payload); return data.data; };
export const convertDemo      = async (id, payload) => { const { data } = await api.post(`/admin/demo-requests/${id}/convert`, payload); return data.data; };
export const fetchAdminEnrollments = async () => { const { data } = await api.get('/admin/enrollments'); return data; };

// KYC documents
export const fetchKyc  = async () => { const { data } = await api.get('/kyc'); return data.data; };
export const uploadKyc = async (formData) => { const { data } = await api.post('/kyc', formData); return data.data; };
export const deleteKyc = async (id) => { await api.delete(`/kyc/${id}`); };
export const submitDemoRequest   = async (p) => { const { data } = await api.post('/demo-requests', p); return data; };
export const submitContact       = async (p) => { const { data } = await api.post('/contact', p); return data; };
