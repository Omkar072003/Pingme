const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const session = require('express-session');
const path = require('path');

// Temporary in-memory "database"
const users = {}; // { username: password }
const onlineUsers = {}; // { socketId: username }

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/views', express.static('views'));

app.use(session({
    secret: 'supersecretkey',
    resave: false,
    saveUninitialized: true
}));

// Serve login/signup page
app.get('/', (req, res) => {
    if (req.session.username) {
        res.redirect('/chat');
    } else {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Handle signup
app.post('/signup', (req, res) => {
    const { username, password } = req.body;
    if (users[username]) {
        return res.send('Username already taken. <a href="/">Go back</a>');
    }
    users[username] = password;
    req.session.username = username;
    res.redirect('/chat');
});

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        req.session.username = username;
        res.redirect('/chat');
    } else {
        res.send('Invalid credentials. <a href="/">Go back</a>');
    }
});

// Chat page
app.get('/chat', (req, res) => {
    if (!req.session.username) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'views', 'chat.html'));
});

// Socket.io
io.on('connection', (socket) => {
    console.log('New socket connected:', socket.id);

    socket.on('user-connected', (username) => {
        onlineUsers[socket.id] = username;
        io.emit('update-users', Object.values(onlineUsers));
        socket.broadcast.emit('user-joined', username);
    });

    socket.on('chat-message', (data) => {
        io.emit('chat-message', { username: onlineUsers[socket.id], message: data });
    });

    socket.on('typing', (username) => {
        socket.broadcast.emit('typing', username);
    });

    socket.on('disconnect', () => {
        const username = onlineUsers[socket.id];
        delete onlineUsers[socket.id];
        io.emit('update-users', Object.values(onlineUsers));
        if (username) {
            io.emit('user-left', username);
        }
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));