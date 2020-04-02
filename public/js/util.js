/* Game client side utility functions */

// Capitalize initial character of a given word
const ucFirst = (word) => {
    if (typeof word !== 'string') return ''
    return word.charAt(0).toUpperCase() + word.slice(1)
}

// Notification handler
const notification = (obj, message, alertType, timeout = "") => {
    obj.notify.classList.add('show', alertType);
    obj.notify.textContent = message;

    setTimeout(() => { 
        obj.notify.classList.remove('show', alertType);
    }, 5000 || timeout);
};

// Enable disable 'save' and 'roll dice' buttons
const enableSaveRollBtn = ( obj, val ) => {
    if ( val ) {
        obj.btn_roll.removeAttribute('disabled');
        obj.btn_save.removeAttribute('disabled');
    } else {
        obj.btn_roll.setAttribute('disabled', true);
        obj.btn_save.setAttribute('disabled', true);
    }
};