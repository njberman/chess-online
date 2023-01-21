const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const { MongoClient, ServerApiVersion } = require('mongodb');

const Game = require('./game');

require('dotenv').config();

const gamesLocal = [];

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

const client = new MongoClient(process.env.URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

client
  .connect()
  .then(async () => {
    const db = client.db('games');
    const collection = db.collection('games');
    // If want to reset db
    if (process.env.RESET) {
      collection.deleteMany({});
    }
    const games = async () => {
      const g = await collection.find().toArray();
      return g;
    };
    const addGame = async (g) => await collection.insertOne(g);
    const modGame = async (g) =>
      await collection.replaceOne({ code: g.code }, g);

    const gameLocal = async (code) => {
      if (!findGameLocal(code)) {
        gamesLocal.push(new Game(await findGame(code).code));
      }
      return findGameLocal(code);
    };

    const findGame = async (code) => {
      for (let game of await games()) {
        if (game.code === code) {
          return game;
        }
      }
      return undefined;
    };

    const findGameLocal = (code) => {
      for (let game of gamesLocal) {
        if (game.code === code) {
          return game;
        }
      }

      return undefined;
    };

    //initialize a simple http server
    const server = http.createServer(app);

    //initialize the WebSocket server instance
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
      //connection is up, let's add a simple simple event
      ws.on('message', async (message) => {
        message = String(message);
        //log the received message and send it back to the client
        console.log(`Received: ${message}`);

        if (message.includes('take')) {
          const game = await gameLocal(message.split(' ')[1]);
          if (message.includes('taken')) {
            ws.send(JSON.stringify({ taken: game.taken }));
          } else {
            game.take(message.split(' ')[2]);
          }
          await modGame(game);
        }

        if (message.includes('move')) {
          // Parse move data
          const newMessage = message.split(' ');
          const game = await gameLocal(newMessage[0]);
          game.move(message.split('"')[1]);
          await modGame(game);
          wss.clients.forEach((client) => client.send(message));
        }

        if (message.includes('new')) {
          const newMessage = message.split(' ').filter((v) => v.length > 0);
          if (newMessage.length > 1) {
            if (await findGame(newMessage[1])) {
              const game = await gameLocal(newMessage[1]);
              ws.type = game.toConnect;
              game.connect(ws._socket.remoteAddress);
              ws.send(
                JSON.stringify({
                  message: `Game already exists with code: ${game.code}`,
                  code: game.code,
                  fen: game.game.fen(),
                  toConnect: game.toConnect,
                }),
              );
              await modGame(game);
            } else {
              gamesLocal.push(new Game(newMessage[1]));
              await addGame(new Game(newMessage[1]));
              ws.send(
                JSON.stringify({
                  message: `New game created with code: ${newMessage[1]}`,
                  code: newMessage[1],
                  fen: gamesLocal[gamesLocal.length - 1].game.fen(),
                }),
              );
              writeNewGame();
              ws.type = gamesLocal[gamesLocal.length - 1].toConnect;
              gamesLocal[gamesLocal.length - 1].connect(
                ws._socket.remoteAddress,
              );
              await modGame(gamesLocal[gamesLocal.length - 1]);
            }
          } else {
            gamesLocal.push(new Game());
            await addGame(new Game(gamesLocal[gamesLocal.length - 1].code));
            ws.send(
              JSON.stringify({
                message: `New game created with code: ${
                  gamesLocal[gamesLocal.length - 1].code
                }`,
                code: gamesLocal[gamesLocal.length - 1].code,
                fen: gamesLocal[gamesLocal.length - 1].game.fen(),
              }),
            );
            writeNewGame();
            ws.type = gamesLocal[gamesLocal.length - 1].toConnect;
            gamesLocal[gamesLocal.length - 1].connect(ws._socket.remoteAddress);
            await modGame(gamesLocal[gamesLocal.length - 1]);
          }
        }
      });
    });

    const writeNewGame = () => {
      // fs.writeFile('./games.json', JSON.stringify(games), (e) => {
      //   if (e) throw e;
      // });
      console.log('writing new game', gamesLocal[gamesLocal.length - 1].code);
    };

    //start our server
    server.listen(process.env.PORT || 8999, () => {
      console.log(`Server started on port ${server.address().port} :)`);
    });
  })
  .catch(console.error);
