let chatSocket = null;
let currentChatUserId = null;

async function initChat() {
    const userListEl = document.getElementById('chat-user-list');
    const refreshBtn = document.getElementById('chat-refresh-btn');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const messagesEl = document.getElementById('chat-messages');

    refreshBtn.addEventListener('click', loadChatUsers);
    chatForm.addEventListener('submit', handleSendMessage);

    loadChatUsers();
    setupChatSocket();
}

async function loadChatUsers() {
    const userListEl = document.getElementById('chat-user-list');
    userListEl.innerHTML = '<div class="loading-state">Завантаження...</div>';
    
    try {
        const users = await api('GET', '/api/support/chats');
        userListEl.innerHTML = '';
        
        if (users.length === 0) {
            userListEl.innerHTML = '<div class="empty-state">Немає активних чатів</div>';
            return;
        }

        users.forEach(user => {
            const item = document.createElement('div');
            item.className = `chat-user-item ${currentChatUserId === user._id ? 'active' : ''}`;
            item.innerHTML = `
                <div class="user-info">
                    <div class="username">${user.username}</div>
                    <div class="last-msg">${user.lastMessage || ''}</div>
                </div>
                <div class="time">${new Date(user.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            `;
            item.onclick = () => selectUserChat(user);
            userListEl.appendChild(item);
        });
    } catch (err) {
        userListEl.innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
}

async function selectUserChat(user) {
    currentChatUserId = user._id;
    
    // UI Updates
    document.querySelectorAll('.chat-user-item').forEach(el => el.classList.remove('active'));
    document.getElementById('chat-empty-state').classList.add('hidden');
    document.getElementById('chat-window').classList.remove('hidden');
    
    document.getElementById('active-chat-username').textContent = user.username;
    document.getElementById('active-chat-email').textContent = user.email;
    document.getElementById('active-chat-avatar').textContent = user.username[0].toUpperCase();

    // Load Messages
    loadMessages(user._id);
}

async function loadMessages(userId) {
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.innerHTML = '<div class="loading-state">Завантаження...</div>';
    
    try {
        const messages = await api('GET', `/api/support/chat/${userId}`);
        messagesEl.innerHTML = '';
        messages.forEach(renderMessage);
        scrollToBottom();
    } catch (err) {
        messagesEl.innerHTML = `<div class="error-msg">${err.message}</div>`;
    }
}

function renderMessage(msg) {
    const messagesEl = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = `message ${msg.isAdmin ? 'admin' : 'user'}`;
    div.innerHTML = `
        <div class="message-bubble">
            ${msg.text}
            <span class="message-time">${new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
    `;
    messagesEl.appendChild(div);
}

function scrollToBottom() {
    const messagesEl = document.getElementById('chat-messages');
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function handleSendMessage(e) {
    e.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text || !currentChatUserId) return;

    try {
        await api('POST', '/api/support/chat', { text, userId: currentChatUserId });
        input.value = '';
    } catch (err) {
        alert('Помилка відправки: ' + err.message);
    }
}

function setupChatSocket() {
    if (chatSocket) return;

    const serverUrl = window.electron.serverUrl;
    chatSocket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true
    });

    chatSocket.on('connect', () => {
        console.log('[Chat] Connected to socket');
        chatSocket.emit('join_admins');
    });

    chatSocket.on('admin_new_support_message', (msg) => {
        // If current chat is open for this user
        if (currentChatUserId === msg.user) {
            renderMessage(msg);
            scrollToBottom();
        }
        // Update user list to show last message
        loadChatUsers();
    });
}

// Export to be used in app.js
window.initChat = initChat;
