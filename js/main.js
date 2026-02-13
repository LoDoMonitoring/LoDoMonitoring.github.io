// Проверка статуса через mcsrvstat.us
export async function checkServerStatus(ip, port = 19132, bedrock = true) {
    const url = `https://api.mcsrvstat.us/2/${ip}:${port}${bedrock ? '?bedrock=true' : ''}`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        return {
            online: data.online || false,
            players: data.players?.online ?? 0,
            maxPlayers: data.players?.max ?? 0,
            version: data.version,
            motd: data.motd?.clean?.join(' ') || ''
        };
    } catch {
        return { online: false, players: 0, maxPlayers: 0 };
    }
}

// Генерация HTML карточки сервера (с асинхронной вставкой статуса)
export function renderServerCard(server) {
    const card = document.createElement('div');
    card.className = 'server-card';
    card.innerHTML = `
        <h3>${server.name}</h3>
        <span class="ip">${server.ip}:${server.port || 19132}</span>
        <p>${server.description || 'Нет описания'}</p>
        <div class="server-meta">
            <span>⭐ ${server.votes || 0}</span>
            <span>👤 ${server.ownerEmail?.split('@')[0]}</span>
        </div>
        <div class="status loading">⏳ Проверка...</div>
        <a href="server.html?id=${server.id}" class="btn btn-small">Подробнее</a>
    `;

    // Загружаем статус
    checkServerStatus(server.ip, server.port || 19132, true).then(status => {
        const statusDiv = card.querySelector('.status');
        if (status.online) {
            statusDiv.className = 'status online';
            statusDiv.innerHTML = `✅ Онлайн (${status.players}/${status.maxPlayers})`;
        } else {
            statusDiv.className = 'status offline';
            statusDiv.innerHTML = '❌ Оффлайн';
        }
    });

    return card;
}