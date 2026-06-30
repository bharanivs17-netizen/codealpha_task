/**
 * utils.js — Shared frontend utilities
 * Toast notifications, stars, formatting, skeleton, scroll animations
 */

// ── Toast Notifications ────────────────────────────────────
let toastContainer = null;

function getToastContainer() {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  }
  return toastContainer;
}

const TOAST_ICONS = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };

export function showToast(message, type = 'info', title = '', duration = 3500) {
  const container = getToastContainer();
  const toast     = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const displayTitle = title || type.charAt(0).toUpperCase() + type.slice(1);

  toast.innerHTML = `
    <span class="toast__icon">${TOAST_ICONS[type]}</span>
    <div class="toast__body">
      <div class="toast__title">${displayTitle}</div>
      ${message ? `<div class="toast__message">${message}</div>` : ''}
    </div>
    <button class="toast__close" aria-label="Close">✕</button>
  `;

  const close = () => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  toast.querySelector('.toast__close').addEventListener('click', close);
  container.appendChild(toast);
  setTimeout(close, duration);
  return toast;
}

export const toast = {
  success: (msg, title) => showToast(msg, 'success', title),
  error:   (msg, title) => showToast(msg, 'error',   title),
  info:    (msg, title) => showToast(msg, 'info',     title),
  warning: (msg, title) => showToast(msg, 'warning',  title),
};

// ── Formatting ─────────────────────────────────────────────
export const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

export const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

export const formatRelativeDate = (dateStr) => {
  const now  = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30)   return `${days}d ago`;
  return formatDate(dateStr);
};

export const truncate = (str, length = 80) =>
  str.length > length ? str.slice(0, length) + '…' : str;

// ── Star Rating HTML ───────────────────────────────────────
export function starsHTML(rating, showValue = false) {
  const full  = Math.floor(rating);
  const half  = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  const stars =
    '★'.repeat(full) +
    (half ? '½' : '') +
    '<span class="empty">' + '★'.repeat(empty) + '</span>';
  return `<span class="stars">${stars}${showValue ? ` <span style="color:var(--text-muted)">${rating.toFixed(1)}</span>` : ''}</span>`;
}

// ── Skeleton Card HTML ─────────────────────────────────────
export function skeletonCardHTML() {
  return `
    <div class="skeleton-card product-card">
      <div class="skeleton" style="aspect-ratio:1;"></div>
      <div style="padding:1.25rem;display:flex;flex-direction:column;gap:.75rem;">
        <div class="skeleton" style="height:12px;width:60px;border-radius:4px;"></div>
        <div class="skeleton" style="height:16px;width:100%;border-radius:4px;"></div>
        <div class="skeleton" style="height:14px;width:80%;border-radius:4px;"></div>
        <div class="skeleton" style="height:20px;width:70px;border-radius:4px;margin-top:.5rem;"></div>
      </div>
    </div>`;
}

export function showSkeletons(container, count = 8) {
  if (!container) return;
  container.innerHTML = Array(count).fill(skeletonCardHTML()).join('');
}

// ── Product Card HTML ──────────────────────────────────────
export function productCardHTML(product, wishlistIds = []) {
  const discount    = product.discount > 0;
  const inWishlist  = wishlistIds.includes(product._id);
  const catName     = product.category?.name || '';

  return `
    <article class="product-card" data-id="${product._id}">
      <div class="product-card__image-wrap">
        <a href="/pages/product.html?slug=${product.slug}">
          <img src="${product.thumbnail || 'https://via.placeholder.com/400x400/080F22/4F8EF7?text=No+Image'}"
               alt="${product.name}" loading="lazy">
        </a>
        <div class="product-card__actions">
          <button class="product-card__action-btn wishlist-btn ${inWishlist ? 'wishlisted' : ''}"
                  data-id="${product._id}" title="${inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}">
            ${inWishlist ? '❤️' : '🤍'}
          </button>
          <a href="/pages/product.html?slug=${product.slug}"
             class="product-card__action-btn" title="View product">👁️</a>
        </div>
        ${discount ? `<div class="product-card__badge"><span class="badge badge-sale">-${product.discount}%</span></div>` : ''}
      </div>
      <div class="product-card__body">
        ${catName ? `<span class="product-card__category">${catName}</span>` : ''}
        <h3 class="product-card__name">
          <a href="/pages/product.html?slug=${product.slug}">${product.name}</a>
        </h3>
        <div class="product-card__rating">
          ${starsHTML(product.averageRating || 0)}
          <span class="product-card__rating-count">(${product.numReviews || 0})</span>
        </div>
        <div class="product-card__price">
          <span class="product-card__price-current">${formatPrice(product.finalPrice)}</span>
          ${discount ? `<span class="product-card__price-original">${formatPrice(product.price)}</span>` : ''}
        </div>
        <button class="product-card__add-btn add-to-cart-btn" data-id="${product._id}">
          🛒 Add to Cart
        </button>
      </div>
    </article>`;
}

// ── Scroll Animation Observer ──────────────────────────────
export function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .stagger-children')
    .forEach((el) => observer.observe(el));

  return observer;
}

// ── Navbar scroll effect ───────────────────────────────────
export function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const toggle = () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  };
  toggle();
  window.addEventListener('scroll', toggle, { passive: true });
}

// ── Cart count update ──────────────────────────────────────
export function updateCartBadge(count) {
  const badge = document.querySelector('#cart-badge');
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}

export async function refreshCartBadge() {
  const { isLoggedIn, cartAPI } = await import('./api.js');
  if (!isLoggedIn()) return;
  try {
    const data = await cartAPI.get();
    updateCartBadge(data.cart?.items?.length || 0);
  } catch {}
}

// ── Order status badge ─────────────────────────────────────
export function orderStatusBadge(status) {
  const map = {
    pending:    'badge-gold',
    confirmed:  'badge-primary',
    processing: 'badge-purple',
    shipped:    'badge-primary',
    delivered:  'badge-green',
    cancelled:  'badge-red',
  };
  return `<span class="badge ${map[status] || 'badge-primary'}">${status}</span>`;
}

// ── Query string helpers ───────────────────────────────────
export const qs  = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

// ── Debounce ───────────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

// ── Clipboard ─────────────────────────────────────────────
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  } catch { toast.error('Failed to copy'); }
}

// ── Reading progress bar ───────────────────────────────────
export function initProgressBar() {
  const bar = document.createElement('div');
  bar.className = 'page-progress';
  bar.style.width = '0%';
  document.body.prepend(bar);

  window.addEventListener('scroll', () => {
    const scrollTop  = document.documentElement.scrollTop;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const progress   = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width  = `${progress}%`;
  }, { passive: true });
}
