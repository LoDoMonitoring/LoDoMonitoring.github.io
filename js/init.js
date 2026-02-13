import { initAuthUI } from './auth.js';
import { renderServerList, initDashboard } from './servers.js';

// Общая инициализация для всех страниц
initAuthUI();

// Рендерим список только на index.html
if (document.getElementById('server-list')) {
    renderServerList();
    // Поиск / сортировка
    document.getElementById('searchInput')?.addEventListener('input', renderServerList);
    document.getElementById('sortSelect')?.addEventListener('change', renderServerList);
}

// Инициализация дашборда
initDashboard();