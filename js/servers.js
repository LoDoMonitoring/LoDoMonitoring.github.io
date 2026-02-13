import { db, auth } from './firebase-config.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, increment, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { checkServerStatus, renderServerCard } from './main.js';

// Добавление нового сервера
export async function addServer(serverData) {
    const user = auth.currentUser;
    if (!user) throw new Error('Необходимо авторизоваться');

    const newServer = {
        ...serverData,
        ownerId: user.uid,
        ownerEmail: user.email,
        createdAt: new Date(),
        votes: 0,
        voters: []
    };
    const docRef = await addDoc(collection(db, 'servers'), newServer);
    return docRef.id;
}

// Получение всех серверов с возможностью фильтрации
export async function getServers(filterUserId = null) {
    let q = collection(db, 'servers');
    if (filterUserId) {
        q = query(q, where('ownerId', '==', filterUserId));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Удаление сервера (только владелец)
export async function deleteServer(serverId, ownerId) {
    const user = auth.currentUser;
    if (!user || user.uid !== ownerId) {
        throw new Error('Нет прав на удаление');
    }
    await deleteDoc(doc(db, 'servers', serverId));
}

// Голосование за сервер
export async function voteServer(serverId, serverData) {
    const user = auth.currentUser;
    if (!user) {
        alert('Войдите, чтобы голосовать');
        return false;
    }
    const serverRef = doc(db, 'servers', serverId);
    const hasVoted = serverData.voters?.includes(user.uid);
    if (hasVoted) {
        // Отменить голос
        await updateDoc(serverRef, {
            votes: increment(-1),
            voters: arrayRemove(user.uid)
        });
        return false; // убрал голос
    } else {
        // Добавить голос
        await updateDoc(serverRef, {
            votes: increment(1),
            voters: arrayUnion(user.uid)
        });
        return true; // добавил голос
    }
}

// Инициализация страницы dashboard (добавление сервера)
export function initDashboard() {
    const form = document.getElementById('addServerForm');
    if (!form) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = 'login.html';
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('serverName').value.trim();
        const ip = document.getElementById('serverIp').value.trim();
        const port = parseInt(document.getElementById('serverPort').value) || 19132;
        const description = document.getElementById('serverDesc').value.trim();
        const version = document.getElementById('serverVersion').value.trim();

        try {
            await addServer({ name, ip, port, description, version, type: 'bedrock' });
            alert('Сервер успешно добавлен!');
            form.reset();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    });
}

// Рендер списка серверов на главной
export async function renderServerList() {
    const container = document.getElementById('server-list');
    if (!container) return;

    let servers = await getServers();
    
    // Сортировка
    const sortBy = document.getElementById('sortSelect')?.value || 'votes';
    servers.sort((a, b) => {
        if (sortBy === 'votes') return b.votes - a.votes;
        if (sortBy === 'newest') return b.createdAt?.seconds - a.createdAt?.seconds;
        if (sortBy === 'oldest') return a.createdAt?.seconds - b.createdAt?.seconds;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
    });

    // Поиск
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase();
    if (searchTerm) {
        servers = servers.filter(s => 
            s.name.toLowerCase().includes(searchTerm) || 
            s.ip.toLowerCase().includes(searchTerm)
        );
    }

    if (servers.length === 0) {
        container.innerHTML = '<p>Серверов пока нет. Будьте первым!</p>';
        return;
    }

    container.innerHTML = '';
    servers.forEach(server => {
        const card = renderServerCard(server);
        container.appendChild(card);
    });
}