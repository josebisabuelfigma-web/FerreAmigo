/**
 * auth.js — Autenticación de la sesión.
 * Nota: validación 100% en cliente, solo para la maqueta funcional.
 * Al pasar a backend real, reemplazar login() por una llamada a la API
 * que devuelva un token, y requireAuth() por una verificación de ese token.
 */

const AUTH = (function () {
  const SESSION_KEY = 'fa_session';

  // Perfiles válidos. "admin" ve todo, incluido el registro de actividad.
  // "auxiliar" trabaja igual en el catálogo, pero queda registrado.
  const USERS = [
    { username: 'ferreamigo', password: 'ferreamigo2024$', role: 'admin' },
    { username: 'auxiliar', password: 'auxiliar2024$', role: 'auxiliar' }
  ];

  function login(username, password) {
    const match = USERS.find(u => u.username === username && u.password === password);
    if (!match) return false;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: match.username, role: match.role, loggedAt: Date.now() }));
    return true;
  }

  function isAdmin() {
    const session = getSession();
    return !!session && session.role === 'admin';
  }

  function isAuthenticated() {
    return !!sessionStorage.getItem(SESSION_KEY);
  }

  function getSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch (e) {
      return null;
    }
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  }

  /** Llamar al inicio de cada página protegida. */
  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.href = 'index.html';
    }
  }

  /** Llamar al inicio de páginas exclusivas del administrador (ej. actividad.html). */
  function requireAdmin() {
    requireAuth();
    if (!isAdmin()) {
      window.location.href = 'modulos.html';
    }
  }

  return { login, isAuthenticated, isAdmin, getSession, logout, requireAuth, requireAdmin };
})();
