// Instantiate socket.io
let socket = io();

/* Define Dice Object */
let Dice = {};

let audio = {
    /* Sound files from 
        https://www.zapsplat.com
     */
    files: {
        gameSound: '../audio/game-sound.mp3',
        next: '../audio/next.mp3',
        winner: '../audio/winner.mp3',
        save: '../audio/save.mp3',
        roll: '../audio/dice-roll.mp3'
    },

    trigger: ( file ) => {
        let self = new Audio(file);
        self.volume = .1;
        return self;
    },

    winner: () => audio.trigger(audio.files.winner),
    save: () => audio.trigger(audio.files.save),
    roll: () => audio.trigger(audio.files.roll),
    next: () => audio.trigger(audio.files.next),
    gameSound: ( mute ) => {
        let obj = audio.trigger(audio.files.gameSound);
        if (mute) {
            obj.muted = true;
        } else {
            obj.muted = false;
        }

        return obj;
    }
};

// Initialize Dice object properties
Dice.scores, 
Dice.roundScore, 
Dice.activePlayer, 
Dice.isGameActive, 
Dice.lastDice,
Dice.defaultWinScore = 100,
Dice.cube_1 = document.querySelector('.cube_1'),
Dice.cube_2 = document.querySelector('.cube_2')
Dice.previousClass = [];

Dice.dice_1 = document.getElementById('dice-1');
Dice.dice_2 = document.getElementById('dice-2');
Dice.name_0 = document.getElementById('name-0');
Dice.name_1 = document.getElementById('name-1');
Dice.score_0 = document.getElementById('score-0');
Dice.score_1 = document.getElementById('score-1');
Dice.current_0 = document.getElementById('current-0');
Dice.current_1 = document.getElementById('current-1');
Dice.player_0_panel = document.querySelector('.player-0-panel');
Dice.player_1_panel = document.querySelector('.player-1-panel');
Dice.currentWinScore = document.querySelector('.current-win-score');

Dice.notify = document.querySelector('.notification');
Dice.elemWinScore = document.querySelector('.win-score');

Dice.modalContainer = document.querySelector('.modal-container');
Dice.modalOverlay = document.querySelector('.modal-overlay');
Dice.userForm = document.querySelector('#userForm');
Dice.playername = document.getElementById('playername');

Dice.newElem = document.createElement('strong');
/* Buttons */
Dice.btn_roll = document.querySelector('.btn-roll');
Dice.btn_save = document.querySelector('.btn-save');
Dice.btn_new = document.querySelector('.btn-new');
Dice.btn_exit = document.querySelector('.btn-exit');

/**
 * Dice Object Methods
 * *********************/
/**
 * Initialize all game components
 */
Dice.init = () => socket.emit('init game');

/**
 * @param  {} game
 */
Dice.initializeGameComponents = ( game = "") => {
    let $_ = Dice;

    $_.game = game;

    $_.isGameActive = game.isGameActive || true;
    $_.scores = game.scores || [0, 0];
    $_.activePlayer = game.activePlayer || 0;
    $_.roundScore = game.roundScore || 0;
    $_.defaultWinScore = game.defaultWinScore || 100;

    // Initialize win score to default=100
    $_.currentWinScore.textContent = game.defaultWinScore || 100;

    // Hide the dices/cubes
    $_.dice_1.style.display = 'none';
    $_.dice_2.style.display = 'none';
    
    // Set scores to zero
    $_.score_0.textContent = game.defaultScore || '0';
    $_.score_1.textContent = game.defaultScore || '0';
    $_.current_0.textContent = game.defaultScore || '0';
    $_.current_1.textContent = game.defaultScore || '0';

    // Set player names
    $_.name_0.textContent = game.playerNames.player_1 || '-';
    $_.name_1.textContent = game.playerNames.player_2 || '-';
    
    // Remove winner components
    $_.player_0_panel.classList.remove(game.removePanelClass.winner || 'winner');
    $_.player_1_panel.classList.remove(game.removePanelClass.winner || 'winner');

    // Remove active active indicator on first players panel
    $_.player_0_panel.classList.remove(game.removePanelClass.active || 'active');
    $_.player_1_panel.classList.remove(game.removePanelClass.active || 'active');

    // Set active indicator on first players panel
    $_.player_0_panel.classList.add(game.addPanelClass.active || 'active');

    // Initialize custom win score to 0
    $_.elemWinScore.value = game.emptyVal || '';
    $_.currentWinScore.value = game.defaultWinScore || '';

    // Animate the qubes
    $_.cube_1.classList.add( game.animate || 'animate');
    $_.cube_2.classList.add( game.animate || 'animate');

    // Enable buttons
    $_.btn_roll.removeAttribute('disabled');
    $_.btn_save.removeAttribute('disabled');
}

Dice.awaitingConnection = ( data ) => {
    let $_ = Dice;
    $_.disableFormElems(true);
    $_.newElem.textContent = data.error;
    $_.userForm.prepend(Dice.newElem);
    $_.userForm.replaceChild(Dice.newElem, Dice.newElem);
};

/* Change cube sides */
Dice.changeSide = (dice_1, dice_2) => {
    let $_ = Dice,
        len = $_.previousClass.length;

    if ( len > 2  ) {
        $_.cube_1.classList.remove($_.previousClass[0]);
        $_.cube_2.classList.remove($_.previousClass[1]);
        $_.previousClass = [dice_1, dice_2];
    }

    $_.cube_1.classList.add( dice_1 );
    $_.cube_2.classList.add( dice_2 ); 
};

// Next player method
Dice.nextPlayer = () => socket.emit('next player');

// Disable modal contents
Dice.disableFormElems = (options) => {
    Dice.modalContainer.getElementsByTagName('input')[0].setAttribute('disabled', options);
    Dice.modalContainer.getElementsByTagName('button')[0].setAttribute('disabled', options);
};

/**
 * Dice Object action button event handlers
 * *****************************************/
/* Roll button handler */
Dice.onRollButtonClicked = () => {
    audio.roll().play();
    socket.emit('roll button');
};

/* Hold button handler */
Dice.onButtonHold = () => {
    socket.emit('save progress');
    audio.save().play();
};

// Exit the game when a player click's the exit button
Dice.onExitGame = () => {

    if (window.confirm("Do you really want to leave?")) { 
        socket.emit('exit game');

        // Disconnect the player
        socket.disconnect();

        // Close current tab and open a new tab
        window.open(socket.io.uri, "_self");
    }
};

// New game button handler
Dice.onNewGame = () => {
    let $_ = Dice;

    if($_.isGameActive){
        notification(Dice, "You cannot start new game while game is in play.\nUse the EXIT button.",'danger');
    } else {
        socket.emit('new game', {playerName: socket.playername, activePlayer: $_.activePlayer, id: socket.id});
    }
};

// Submit the username form
Dice.userForm.addEventListener('submit', (e) => {

    e.preventDefault();

    // Inform client about the new player
    socket.playername = Dice.playername.value;

    // Inform server about the new player
    socket.emit('new player', Dice.playername.value);
    
    // Set input field to empty after form submission
    playername.value = '';

    return false;
});

// Prevent win score values below 10 and over 100
Dice.elemWinScore.addEventListener('input', event => {
    let minWinScore = Dice.elemWinScore.getAttribute('min'),
        maxWinScore = Dice.elemWinScore.getAttribute('max'),
        winScoreVal = event.target.value;

    if( winScoreVal >= parseInt(minWinScore) && winScoreVal <= parseInt(maxWinScore)){
        socket.emit('win score', winScoreVal);
    }

    return false;
});

// Prevent player from typing into the html number box;
Dice.elemWinScore.addEventListener('keypress', event => {
    event.preventDefault();
    return false;
});

/* Control buttons event Listeners */
Dice.btn_roll.addEventListener('click', Dice.onRollButtonClicked);
Dice.btn_save.addEventListener('click', Dice.onButtonHold);
Dice.btn_new.addEventListener('click', Dice.onNewGame);
Dice.btn_exit.addEventListener('click', Dice.onExitGame);

// Iniitalize game components
Dice.init();

/**
 * Socket.io emitted events
 * ************************/ 
socket.on('new game', (game, player) => {

    // Show player that started a new game
    notification(Dice, `${ucFirst(player)} started a new game`, 'success');

    // Initialize the game
    Dice.initializeGameComponents(game);

    if (audio.gameSound().muted) {
        audio.gameSound(false);
        audio.gameSound.play();
    }
});

// Initilaize game components
socket.on('game initialized', (game) => {Dice.initializeGameComponents( game )});

// Save player's score
socket.on('save score', () => Dice.nextPlayer());

// Enable 'roll dice' and 'save score' buttons on player's turn
socket.on('enable buttons', () => enableSaveRollBtn(Dice, true));

// Disable 'roll dice' and 'save score' buttons on next player's turn
socket.on('disable buttons', () => {
    if (Dice.btn_roll.disabled === false && Dice.btn_save.disabled === false ) {
        enableSaveRollBtn(Dice, false);
    }
});

// Call the next player method
socket.on('next player turn', () => Dice.nextPlayer());

// Display computed dice sides
socket.on('sync components', (data, dice) => {
    let $_ = Dice;

    $_.dice_1.style.display = data.visible;
    $_.dice_2.style.display = data.visible;

    let dice1_class = 'show-'+dice.dice1_val;
    let dice2_class = 'show-'+dice.dice2_val;

    $_.previousClass.push('show-'+dice.dice1_val);
    $_.previousClass.push('show-'+dice.dice2_val);

    $_.changeSide(dice1_class, dice2_class);
});

/* Broadcast player's round score */
socket.on('sync score', (data, dice) => {
    // Set active player's round score
    document.querySelector('#current-' + data.activePlayer).textContent = data.roundScore;

     // Hide the "player's turn" message
    Dice.notify.classList.remove('show', 'info');
});

// Broadcast player's save score
socket.on('sync saved score', (data) => document.querySelector('#score-' + data.activePlayer).textContent = data.scores[data.activePlayer]);

// Broadcast the winner
socket.on('sync winner', (data, players) => {
    let $_ = Dice;

    document.querySelector('#name-' + data.activePlayer).textContent =  players[data.activePlayer] + ' Won!';
    
    $_.dice_1.style.display = 'none';
    $_.dice_2.style.display = 'none';

    document.querySelector('.player-' + data.activePlayer + '-panel').classList.add('winner');
    document.querySelector('.player-' + data.activePlayer + '-panel').classList.remove('active');

    audio.gameSound(true).pause();
    audio.winner().play();

    // Game cannot be played anylonger
    $_.isGameActive = false;

    // Disable roll and save buttons
    enableSaveRollBtn(Dice, false);

    // Reinitialize game components when a player exits the game then restart and send state to server
    socket.emit('reinitialize game', Dice.activePlayer);
});

// Broadcast player's turn information
socket.on('sync player state', (data, dice, players) => {

    // Display the notification box
    Dice.notify.classList.add('show', 'info');

    // Build player's turn grammer and display
    let playsNext = data.activePlayer === 0 ? 1 : 0,
        actualPlayer = data.activePlayer === 0 ? 0 : 1;
    
    Dice.notify.textContent = `Oops! ${ucFirst(players[actualPlayer])} rolled a 1. It's ${ucFirst(players[playsNext])}'s turn now`;
});

// Toggle active player panels and set scores
socket.on('next player sync', (data) => {
    let $_ = Dice;

    $_.activePlayer = data.activePlayer;
    $_.game.activePlayer = data.activePlayer;
        
    $_.roundScore = data.roundScore;

    $_.current_0.textContent = 0;
    $_.current_1.textContent = 0;

    $_.player_0_panel.classList.toggle('active');
    $_.player_1_panel.classList.toggle('active');
});

// Prevent oponent's play and save buttons when a new game is started
socket.on('prevent player', (game) => {
    Dice.activePlayer = game.activePlayer;
    enableSaveRollBtn(Dice, false);
});

// New player event
socket.on('players ready', (game) => {
    Dice.initializeGameComponents( game );
    let gameSound = audio.gameSound();
    gameSound.loop = true;
    gameSound.play();
});

/* Display "awaiting connection message when a second player is yet to join the game"  */
socket.on('await player', (data) => {
    let $_ = Dice;
    $_.awaitingConnection(data); 
    $_.modalContainer.style.display = 'block';
    $_.modalOverlay.style.display = 'block';
});

// Show players event
socket.on('show players', (data) => {
    Dice.name_0.textContent = data.players[0];
    Dice.name_1.textContent = data.players[1];
});

// Display "awaiting connection message when a second player is yet to join the game"
socket.on('await connection', (data) => Dice.awaitingConnection(data));

// Max players event
socket.on('max connection', (data) => {
    Dice.notify.classList.add('show', 'info');
    Dice.notify.textContent = data.message;
});

// Set and broadcast new win score value 
socket.on('win score value', ( val, player ) => {
    Dice.currentWinScore.textContent = val;
    notification(Dice, 'Win score updated by ' + player, 'info', 3000);
});

// Set active player's indicator
socket.on('set active icon', (game) => {
    let active = (game.activePlayer === 0) ? 1 : 0;
    document.querySelector('.player-' + active + '-panel').classList.remove('active');
    document.querySelector('.player-' + game.activePlayer + '-panel').classList.add('active');
});

// Show modal event
socket.on('show modal', () => {
    let $_ = Dice;
    $_.disableFormElems(true);
    $_.modalContainer.style.display = 'block';
    $_.modalOverlay.style.display = 'block';
});

// Close modal event
socket.on('close modal', () => {
    let $_ = Dice;
    $_.disableFormElems(false);
    $_.newElem.textContent = '';
    $_.modalContainer.style.display = 'none';
    $_.modalOverlay.style.display = 'none';
});