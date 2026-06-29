/**
 * navbar.js — Reusable navbar component injector
 * Import and call initNavbarComponent() on every page
 */

import { getUser, isLoggedIn, isAdmin, removeToken, removeUser } from './api.js';
import { refreshCartBadge } from './utils.js';

export function renderNavbar() {
  const user     = getUser();
  const loggedIn = isLoggedIn();
  const admin    = isAdmin();

  const userMenu = loggedIn
    ? `<div class="navbar__user">
        <div class="navbar__avatar" id="user-avatar" title="${user?.name}">
          ${user?.avatar
            ? `<img src="${user.avatar}" alt="${user.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`
            : (user?.name?.[0] || 'U').toUpperCase()}
        </div>
        <div class="navbar__dropdown">
          <div style="padding:.75rem .875rem 0; margin-bottom:.5rem;">
            <div style="font-weight:600;font-size:.9rem;">${user?.name}</div>
            <div style="color:var(--text-muted);font-size:.8rem;">${user?.email}</div>
          </div>
          <div class="navbar__dropdown-divider"></div>
          <a href="/pages/dashboard.html" class="navbar__dropdown-item">👤 My Account</a>
          <a href="/pages/dashboard.html#orders" class="navbar__dropdown-item">📦 My Orders</a>
          <a href="/pages/dashboard.html#wishlist" class="navbar__dropdown-item">❤️ Wishlist</a>
          ${admin ? `<div class="navbar__dropdown-divider"></div>
          <a href="/pages/admin.html" class="navbar__dropdown-item" style="color:var(--color-primary);">⚙️ Admin Panel</a>` : ''}
          <div class="navbar__dropdown-divider"></div>
          <button class="navbar__dropdown-item" id="logout-btn" style="width:100%;color:var(--color-red);">🚪 Logout</button>
        </div>
      </div>`
    : `<a href="/pages/login.html"    class="btn btn-secondary btn-sm">Login</a>
       <a href="/pages/register.html" class="btn btn-primary  btn-sm">Sign Up</a>`;

  const navHTML = `
    <nav class="navbar" id="navbar">
      <div class="container navbar__inner">
        <a href="/index.html" class="navbar__logo">LuxeStore</a>

        <div class="navbar__nav">
          <a href="/index.html"             class="navbar__link">Home</a>
          <a href="/pages/shop.html"        class="navbar__link">Shop</a>
          <a href="/pages/categories.html"  class="navbar__link">Categories</a>
        </div>

        <div class="navbar__search">
          <span class="navbar__search-icon">🔍</span>
          <input type="search" placeholder="Search products…" id="navbar-search" autocomplete="off">
        </div>

        <div class="navbar__actions">
          <a href="/pages/cart.html" class="navbar__icon-btn" title="Cart" id="cart-btn">
            🛒
            <span class="navbar__cart-badge" id="cart-badge" style="display:none;">0</span>
          </a>
          ${userMenu}
          <button class="navbar__icon-btn navbar__hamburger" id="menu-toggle" title="Menu">☰</button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div id="mobile-menu" style="display:none; padding:1rem; border-top:1px solid var(--color-border); background:rgba(5,10,24,0.98);">
        <a href="/index.html"             class="navbar__link" style="display:block; padding:.75rem 1rem;">Home</a>
        <a href="/pages/shop.html"        class="navbar__link" style="display:block; padding:.75rem 1rem;">Shop</a>
        <a href="/pages/categories.html"  class="navbar__link" style="display:block; padding:.75rem 1rem;">Categories</a>
        ${loggedIn
          ? `<a href="/pages/dashboard.html" class="navbar__link" style="display:block; padding:.75rem 1rem;">My Account</a>`
          : `<a href="/pages/login.html"    class="navbar__link" style="display:block; padding:.75rem 1rem;">Login</a>
             <a href="/pages/register.html" class="navbar__link" style="display:block; padding:.75rem 1rem;">Sign Up</a>`}
      </div>
    </nav>`;

  // Inject at the top of body
  const wrapper = document.createElement('div');
  wrapper.innerHTML = navHTML;
  document.body.insertBefore(wrapper.firstElementChild, document.body.firstChild);

  // Scroll effect
  const navbar = document.getElementById('navbar');
  const handleScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Active link highlight
  const links = document.querySelectorAll('.navbar__link');
  links.forEach((link) => {
    if (link.href === window.location.href) link.classList.add('active');
  });

  // Mobile menu toggle
  const menuBtn    = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  menuBtn?.addEventListener('click', () => {
    mobileMenu.style.display = mobileMenu.style.display === 'none' ? 'block' : 'none';
  });

  // Navbar search
  const navSearch = document.getElementById('navbar-search');
  navSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && navSearch.value.trim()) {
      window.location.href = `/pages/shop.html?keyword=${encodeURIComponent(navSearch.value.trim())}`;
    }
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', async () => {
    try {
      const { authAPI } = await import('./api.js');
      await authAPI.logout();
    } catch {}
    removeToken();
    removeUser();
    window.location.href = '/index.html';
  });

  // Load cart badge
  refreshCartBadge();
}
