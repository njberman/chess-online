const { Chess } = require('chess.js');

const ABC = 'abcdefghijklmnopqrstuvwxz';

class Game {
  constructor(code) {
    this.code = code || this.genCode(5);
    this.game = new Chess();
  }

  genCode(len) {
    let code = '';
    for (let i = 0; i < len; i++) {
      if (i % 2 === 0) {
        code += ABC[Math.floor(Math.random() * ABC.length)];
      } else {
        code += String(Math.floor(Math.random() * 10));
      }
    }
    return code;
  }

  move(alMove) {
    console.log(alMove);
    this.game.move(alMove);
  }
}

module.exports = Game;
