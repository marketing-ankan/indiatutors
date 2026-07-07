import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Format INR
export const inr = (n) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

// Catalog
export const fetchCategoriesTree = async () => {
  const { data } = await api.get('/categories/tree');
  return data.data;
};

export const fetchCategories = async () => {
  const { data } = await api.get('/categories');
  return data.data;
};

export const fetchCourses = async (params = {}) => {
  const { data } = await api.get('/courses', { params });
  return data; // includes .data + .meta + .links (Laravel paginator)
};

export const fetchCourse = async (slug) => {
  const { data } = await api.get(`/courses/${slug}`);
  return data.data;
};

// Lead capture
export const submitDemoRequest = async (payload) => {
  const { data } = await api.post('/demo-requests', payload);
  return data;
};

export const submitContact = async (payload) => {
  const { data } = await api.post('/contact', payload);
  return data;
};
