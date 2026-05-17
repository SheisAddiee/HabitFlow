/* =========================================================
   HabitFlow — Interactivity
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ----- Toggle switches ----- */
  document.querySelectorAll('.toggle').forEach(t => {
    t.addEventListener('click', () => {
      t.classList.toggle('on');
      // dark mode toggle
      if (t.dataset.action === 'dark') {
        document.body.classList.toggle('dark', t.classList.contains('on'));
        try { localStorage.setItem('hf-dark', t.classList.contains('on') ? '1' : '0'); } catch(e){}
      }
    });
  });

  /* ----- Restore dark mode preference ----- */
  try {
    if (localStorage.getItem('hf-dark') === '1') {
      document.body.classList.add('dark');
      const darkToggle = document.querySelector('[data-action="dark"]');
      if (darkToggle) darkToggle.classList.add('on');
    }
  } catch(e) {}

  /* ----- Mobile navbar ----- */
  const hamburger = document.querySelector('.hamburger');
  const navLinks  = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }

  /* ----- Mobile sidebar ----- */
  const menuBtn = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  const backdrop = document.querySelector('.backdrop');
  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.add('open');
      if (backdrop) backdrop.classList.add('show');
    });
  }
  if (backdrop && sidebar) {
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('show');
    });
  }

  /* ----- Check off habits on dashboard ----- */
  document.querySelectorAll('.check-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('done');
      btn.innerHTML = btn.classList.contains('done')
        ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '';
    });
  });

  /* ----- Tabs (habit detail) ----- */
  document.querySelectorAll('.tabs').forEach(group => {
    group.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        group.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });
  });

  /* ----- Smooth scroll for anchor links ----- */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ----- Edit Profile button ----- */
  const editBtn = document.querySelector('.edit-profile');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      const nameEl = document.querySelector('.profile-box .info h3');
      if (!nameEl) return;
      const current = nameEl.textContent.trim();
      const next = prompt('Edit name', current);
      if (next && next.trim()) nameEl.textContent = next.trim();
    });
  }

  /* ----- Reset data confirmation ----- */
  const resetRow = document.querySelector('.reset-row');
  if (resetRow) {
    resetRow.addEventListener('click', () => {
      if (confirm('Are you sure you want to permanently delete all your data? This cannot be undone.')) {
        alert('All data has been reset.');
      }
    });
  }

  /* ----- Reveal-on-scroll for feature cards ----- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.feature-card, .stat-card').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(20px)';
      el.style.transition = `opacity .6s ease ${i * 0.06}s, transform .6s ease ${i * 0.06}s`;
      io.observe(el);
    });
  }

});
