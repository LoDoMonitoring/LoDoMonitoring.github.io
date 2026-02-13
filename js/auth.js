import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// Отображение состояния авторизации в шапке
export function initAuthUI() {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    onAuthStateChanged(auth, (user) => {
        if (user) {
            authSection.innerHTML = `
                <span>Привет, ${user.email}</span>
                <a href="profile.html">Мои серверы</a>
                <a href="#" id="logoutBtn">Выйти</a>
            `;
            document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
                e.preventDefault();
                signOut(auth);
            });
        } else {
            authSection.innerHTML = `<a href="login.html">Вход / Регистрация</a>`;
        }
    });
}

// Функции для страницы login.html
export async function handleLogin(email, password) {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Ошибка входа: ' + error.message);
    }
}

export async function handleRegister(email, password) {
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert('Ошибка регистрации: ' + error.message);
    }
}