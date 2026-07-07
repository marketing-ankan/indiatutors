import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || '/api';

export const api = axios.create({
  baseURL,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
});

export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(Number(n||0));

export const fetchCategoriesTree = async () => { const { data } = await api.get('/categories/tree'); return data.data; };
export const fetchCategories     = async () => { const { data } = await api.get('/categories'); return data.data; };
export const fetchCourses        = async (p={}) => { const { data } = await api.get('/courses', { params:p }); return data; };
export const fetchCourse         = async (slug) => { const { data } = await api.get(`/courses/${slug}`); return data.data; };
export const fetchTutors         = async (p={}) => { const { data } = await api.get('/tutors', { params:p }); return data.data; };
export const fetchTutor          = async (slug) => { const { data } = await api.get(`/tutors/${slug}`); return data.data; };
export const fetchTutorFilters   = async () => { const { data } = await api.get('/tutors/filters'); return data; };
export const submitDemoRequest   = async (p) => { const { data } = await api.post('/demo-requests', p); return data; };
export const submitContact       = async (p) => { const { data } = await api.post('/contact', p); return data; };
