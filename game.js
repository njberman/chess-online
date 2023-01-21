const { Chess } = require('chess.js');

const COLOUR = {
  WHITE: 'white',
  BLACK: 'black',
};

const ABC = 'abcdefghijklmnopqrstuvwxz';

class Game {
  constructor(code, fen) {
    this.code = code || this.genCode(5);
    this.game = new Chess(fen || undefined);
    this.toConnect = COLOUR.WHITE;
    this.connected = [];
    this.taken = [];
  }

  connect(ip) {
    if (this.connected.length < 2) {
      this.connected.push({ colour: this.toConnect, ip });
      this.toConnect = COLOUR.BLACK;
    } else {
      // for (let i = 0; i < 2; i++) {
      //   if (this.connected[i].ip === ip) {
      //     this.toConnect =
      //       this.connected[i].colour === COLOUR.WHITE
      //         ? COLOUR.BLACK
      //         : COLOUR.WHITE;
      //   } else {
      this.toConnect = 'spec';
      // }
      // }
    }
    console.log(this.connected);
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

  move(fen) {
    this.game = new Chess(fen);
  }

  take(piece) {
    this.taken.push(piece);

    // Sort the taken array
    const order = ['♙', '♗', '♘', '♖', '♕', '♟', '♝', '♞', '♜', '♛'];
    let newTaken = Array.from({ length: 20 }, () => undefined);
    for (let p of this.taken) {
      const idx = order.indexOf(p);
      newTaken.splice(idx, 0, p);
    }
    newTaken = newTaken.filter((v) => v !== undefined);
    this.taken = newTaken;
  }
}

module.exports = Game;
