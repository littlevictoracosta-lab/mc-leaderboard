// Fetch server status dynamically via public API (https://api.mcsrvstat.us/2/)
async function fetchServerStatus(ip) {
  try {
    const res = await fetch(`https://api.mcsrvstat.us/2/${ip}`);
    const data = await res.json();
    return {
      online: data.online,
      players: data.online ? data.players.online : 0,
      maxPlayers: data.online ? data.players.max : 0,
      icon: data.icon || 'https://via.placeholder.com/64'
    };
  } catch (err) {
    return { online: false, players: 0, maxPlayers: 0, icon: 'https://via.placeholder.com/64' };
  }
}

// Load and render servers
async function loadServers() {
  const container = document.getElementById('server-list');
  const search = document.getElementById('search-input').value;
  const category = document.getElementById('category-select').value;

  container.innerHTML = '<p style="text-align:center;">Loading servers...</p>';

  try {
    const res = await fetch(`/api/servers?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
    const servers = await res.json();

    if (servers.length === 0) {
      container.innerHTML = '<p style="text-align:center;">No servers found.</p>';
      return;
    }

    container.innerHTML = '';

    for (let i = 0; i < servers.length; i++) {
      const server = servers[i];
      
      // Fetch live Minecraft ping status
      const status = await fetchServerStatus(server.ip);

      const card = document.createElement('div');
      card.className = 'server-card';
      card.innerHTML = `
        <div class="rank">#${i + 1}</div>
        <img class="server-icon" src="${status.icon}" alt="${server.name}">
        <div class="server-info">
          <h3>${server.name}</h3>
          <div class="status-badge">
            <span class="dot ${status.online ? 'online' : ''}"></span>
            ${status.online ? `${status.players}/${status.maxPlayers} Players Online` : 'Offline'}
          </div>
          <br>
          <span class="tag">${server.category}</span>
        </div>
        <div style="display:flex; flex-direction:column; gap:0.5rem; align-items:flex-end;">
          <button class="btn" onclick="copyIP('${server.ip}')">Copy IP</button>
          <button class="btn btn-secondary" onclick="voteServer(${server.id})">▲ Vote (${server.votes_count})</button>
        </div>
      `;

      container.appendChild(card);
    }
  } catch (err) {
    container.innerHTML = '<p style="text-align:center; color:red;">Failed to load servers.</p>';
  }
}

// Copy IP Function
function copyIP(ip) {
  navigator.clipboard.writeText(ip);
  alert(`Server IP copied: ${ip}`);
}

// Vote Function
async function voteServer(id) {
  const res = await fetch(`/api/servers/${id}/vote`, { method: 'POST' });
  if (res.ok) {
    alert('Thank you for voting!');
    loadServers();
  }
}

// Event Listeners
document.getElementById('search-input').addEventListener('input', loadServers);
document.getElementById('category-select').addEventListener('change', loadServers);

// Initial Load
loadServers();
