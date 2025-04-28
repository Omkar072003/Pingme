    const socket = io();
    const messageForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');
    const messageContainer = document.getElementById('messages');
    const typingDiv = document.getElementById('typing');
    const usersList = document.getElementById('users');

    const username = prompt('Confirm your username:');
    socket.emit('user-connected', username);

    // Receive chat message
    socket.on('chat-message', data => {
        const div = document.createElement('div');
        div.textContent = `${data.username}: ${data.message}`;
        messageContainer.append(div);
        messageContainer.scrollTop = messageContainer.scrollHeight;
    });

    // Typing indicator
    messageInput.addEventListener('input', () => {
        socket.emit('typing', username);
    });

    socket.on('typing', (user) => {
        typingDiv.textContent = `${user} is typing...`;
        setTimeout(() => {
            typingDiv.textContent = '';
        }, 1000);
    });

    // Send message
    messageForm.addEventListener('submit', e => {
        e.preventDefault();
        const message = messageInput.value;
        if (message.trim() !== '') {
            socket.emit('chat-message', message);
            messageInput.value = '';
        }
    });

    // Update online users
    socket.on('update-users', (usernames) => {
        usersList.innerHTML = '';
        usernames.forEach(user => {
            const li = document.createElement('li');
            li.textContent = user;
            usersList.append(li);
        });
    });

    // Notifications
    socket.on('user-joined', (user) => {
        const div = document.createElement('div');
        div.textContent = `${user} joined the chat`;
        div.style.color = 'green';
        messageContainer.append(div);
    });

    socket.on('user-left', (user) => {
        const div = document.createElement('div');
        div.textContent = `${user} left the chat`;
        div.style.color = 'red';
        messageContainer.append(div);
    });
