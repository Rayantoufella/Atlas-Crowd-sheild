// URL de base de l'API, centralisée ici (seul endroit où elle est définie).
// En prod (Vercel) : définir VITE_API_URL = https://<ton-service>.onrender.com
// En dev local : fallback sur le backend Flask local.
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5050';
export default API_BASE;
