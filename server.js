// Dependencies
const express   = require('express');
const path      = require('path');
const app       = express();
const http      = require('http').createServer(app);
const io        = require('socket.io')(http);
const port      = process.env.PORT || 5000;

 // Game object
let game = require('./lib/game');

// To store the names of active players
let players = [];

// To store the count of connected players
let connections = [];

// To store player's socket id when the roll button is clicked
let lastSocket;

// Create socket
io.on('connect', (socket) => {

    let maxUserCheck,
        clientId = socket.client.id;

    connections.push(clientId);

    maxUserCheck = connections.length > 2 ? false : true;

    // Create a new session if players are over 2
    if( maxUserCheck ){
        console.log('Connected: %s sockets connected', connections.length);
    } else {
        socket.emit('max connection', {message: 'Current session is in play.\n Do you want to create a new room? (y/n)'});
        connections.pop();
        return false;
    }

    // Initialize and broadcast game componenents to clients
    socket.on('init game', () => socket.emit('game initialized', game.init()));

    // Register and broadcast new players to clients
    socket.on('new player', (player_name) => {

        socket.playername = player_name;

        players.push(socket.playername);

        if ( players.length > 0 && players.length < 2 && player_name !== 'undefined') {
            // Only one user is connected at this point.
            socket.emit('await connection', {error: 'Waiting for second player to join...'});
        } else {
            io.emit('players ready', game);
            socket.emit('disable buttons');
            io.emit('close modal');
        }

        broadcastPlayernames();
    });

    // Handle game logic when the "roll button" is clicked
    socket.on('roll button', () => {

        // Dice object
        let dice = {};

        // Store player's socket id
        lastSocket = socket.id;

        // Get Random numbers for both dices
        dice.dice1_val = Math.floor(Math.random() * 6) + 1;
        dice.dice2_val = Math.floor(Math.random() * 6) + 1;

        // Do process only when the game is active
        if ( game.isGameActive ) {

            // Broadcast: players turn message, acctive panel, cube switch
            io.emit('sync components', game, dice);

            if (dice.dice1_val !== 1 && dice.dice2_val !== 1) {
                game.roundScore += dice.dice1_val + dice.dice2_val;
                io.emit('sync score', game, dice);
            } else {
                io.emit('sync player state', game, dice, players);
                socket.emit('next player turn', game, dice);
            }
        }
    });

    // Handle game logic when the "save progress" is 
    socket.on('save progress', () => {
        if ( game.isGameActive ) {
            // Append current score to the global score
            game.scores[game.activePlayer] += game.roundScore;
            
            io.emit('sync saved score', game);

            if(game.scores[game.activePlayer] >= game.defaultWinScore){
                io.emit('sync winner', game, players);
            } else {
                socket.emit('save score', game);
            }
        }
    });

    // Handle game logic when it is the next player's turn
    socket.on('next player', () => {
        game.activePlayer = (game.activePlayer === 0) ?  game.activePlayer= 1 : game.activePlayer=0;
        game.roundScore = 0;
        
        socket.emit('disable buttons');
        socket.broadcast.emit('enable buttons');
        io.emit('next player sync', game);
    });

    // Handle "New game" request
    socket.on('new game', (data) => {

        game.playerNames.player_1 = players[0];
        game.playerNames.player_2 = players[1];
        game.isGameActive = true;
        game.scores = [0, 0];
        game.roundScore = 0;
        game.activePlayer = data.activePlayer;   
        game.defaultWinScore = 100;
        
        io.emit('new game', game, data.playerName);

        if (lastSocket === socket.id ) {
            socket.broadcast.emit('prevent player', game);
        } else {
            socket.emit('prevent player', game);
            io.emit('next player sync', game);
        }
        
        io.emit('set active icon', game);
    });

    // Reinitialize game components when a player exits the game then restart and sync state to client
    socket.on('reinitialize game', (activePlayer) => {
        game.scores = [0, 0];
        game.roundScore = 0;
        game.isGameActive = true;
        io.emit('next player sync', game);
    });

    // Register and broadcast win score value
    socket.on('win score', (val) => {
        game.defaultWinScore = val;
       io.emit('win score value', val, socket.playername);  
    });

    // Reinitialize the game when a player exits
    socket.on('exit game', () => {
        game.defaultScore = 0;
        game.defaultWinScore = 100;
        game.roundScore = 0;
        game.activePlayer = 0;
        game.scores = [0, 0];
        
        socket.emit('game initialized', game);
    });

    // When a user disconnects
    socket.on('disconnect', ( reason ) => {

        // Get the player's name that disconnected
        let removedPlayer = players.splice(players.indexOf(socket.playername), 1);

        // Update the connections storage
        connections.splice(connections.indexOf(clientId), 1);

        // If the player clicks the exit button and later closes the browser tab,
        // keep emitting same 'disconnected' broadcast message ()
        if (reason === 'transport close' && connections.length > 0 && players.length === 0) {
            players = removedPlayer;
            return false;
        }

        // If number of players and socket connections is one, broadcast an "awaiting connection" message to new player that want to connect
        if (connections.length === 1 && (reason === 'client namespace disconnect' || reason === 'transport close') && players.length === 1) {
            broadcastPlayernames();
            io.emit('await player', {error: `${game.ucFirst(removedPlayer[0])} has left the game. Waiting for second player to join..`}); 
        } else {
            io.emit('close modal');
        }

        console.log('Disconnected: %s sockets connected', connections.length);
    });
});

// Broadcast player names
let broadcastPlayernames = () => {
    let options = {
        players: players,
        connections: connections
    }

    io.emit('show players', options);
};

// Set static folder
app.use( express.static(path.join(__dirname, 'public'), {extensions: ['html', 'htm']}) );

// Start the server
http.listen(port, () => console.log(`Server is listening on port ${port}`));  