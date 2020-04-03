/**
 * @author Valentine Aduaka
*/

 
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
        self.volume = 0.1;
        return self;
    },

    winner: () => {return audio.trigger(audio.files.winner)},
    save: () => {return audio.trigger(audio.files.save)},
    roll: () => {return audio.trigger(audio.files.roll)},
    next: () => {return audio.trigger(audio.files.next)},
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