/**
 * auth.js — Autenticación de la sesión.
 * Nota: validación 100% en cliente, solo para la maqueta funcional.
 * Al pasar a backend real, reemplazar login() por una llamada a la API
 * que devuelva un token, y requireAuth() por una verificación de ese token.
 */

const AUTH = (function () {
  const SESSION_KEY = 'fa_session';
  const VALID_USERNAME = 'ferreamigo';
  const VALID_PASSWORD = 'ferreamigo2024$';

  function login(username, password) {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ user: username, loggedAt: Date.now() }));
      return true;
    }
    return false;
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

  return { login, isAuthenticated, getSession, logout, requireAuth };
})();
