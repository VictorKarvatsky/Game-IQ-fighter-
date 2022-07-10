/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */

const { createdRoom, joinedRoom, ATTACK, DRAW, LOSS, WIN, GAMEOVER, closeType, GAMEWIN, PERSONAL_SEND } = require('./types');

function generalInformation(infotype, rooms, room, message, userID = 0, ws = null) {
  console.log('generalInformation', message);
  switch (true) {
    case infotype === ATTACK || infotype === DRAW || infotype === joinedRoom || infotype === closeType || infotype === createdRoom:
      for (const [key, value] of Object.entries(rooms)) {
        if (key === room) {
          value.forEach((el) => {
            el.send(JSON.stringify(message));
          });
        }
      }
      break;
    case infotype === WIN || infotype === LOSS || infotype === GAMEOVER || infotype === GAMEWIN:
      console.log('win/loss or game-win/game-over player id ->>>>>>>>>>>>>', infotype, userID);

      for (const [key, value] of Object.entries(rooms)) {
        if (key === room) {
          value.forEach((el) => {
            console.log('el,userID in "for in" ------>', el.userID);
            if (el.userID === userID) el.send(JSON.stringify(message));
          });
        }
      }
      break;
    case infotype === PERSONAL_SEND:
      ws.send(JSON.stringify(message));
      break;
    default:
      console.log('eror generalinformation gamecontroller');
      break;
  }
}

module.exports = generalInformation;
