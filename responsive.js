function initResponsiveMenus() {
    document.querySelectorAll('header').forEach((header, index) => {
        const nav = header.querySelector('nav');
        if (!nav || header.querySelector('.mobile-menu-button')) return;

        const navId = nav.id || `site-nav-${index + 1}`;
        nav.id = navId;

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'mobile-menu-button';
        button.setAttribute('aria-controls', navId);
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Open navigation menu');
        button.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">menu</span>';

        nav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeResponsiveMenu(header);
            });
        });

        header.appendChild(button);
    });
}

function setResponsiveMenuState(header, isOpen) {
    const button = header.querySelector('.mobile-menu-button');
    if (!button) return;

    header.classList.toggle('mobile-nav-open', isOpen);
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');

    const icon = button.querySelector('.material-symbols-outlined');
    if (icon) icon.textContent = isOpen ? 'close' : 'menu';
}

function closeResponsiveMenu(header) {
    setResponsiveMenuState(header, false);
}

document.addEventListener('click', event => {
    const button = event.target.closest('.mobile-menu-button');
    if (!button) return;

    const header = button.closest('header');
    if (!header) return;

    setResponsiveMenuState(header, !header.classList.contains('mobile-nav-open'));
});

document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('header.mobile-nav-open').forEach(closeResponsiveMenu);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initResponsiveMenus);
} else {
    initResponsiveMenus();
}
