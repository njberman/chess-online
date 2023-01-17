const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');

const Game = require('./game');
// import express from 'express';
// import http from 'http';
// import WebSocket from 'ws';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import dotenv from 'dotenv';

require('dotenv').config();

const games = [];

const app = express();

app.use(morgan('dev'));
app.use(helmet());
app.use(cors());
app.use(express.json());

app.post('/new-game', (req, res) => {
  if (req.body && req.body.code) {
    if (findGame(req.body.code)) {
      res.json({
        message: `Game already exists with code: ${
          findGame(req.body.code).code
        }`,
        code: req.body.code,
      });
    } else {
      games.push(new Game(req.body.code));
      res.json({
        message: `New game created with code: ${req.body.code}`,
        code: req.body.code,
      });
    }
  } else {
    games.push(new Game());
    res.json({
      message: `New game created with code: ${games[games.length - 1].code}`,
      code: games[games.length - 1].code,
    });
  }
});

const findGame = (code) => {
  for (let game of games) {
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
  ws.on('message', (message) => {
    message = String(message);
    //log the received message and send it back to the client
    console.log(`Received: ${message}`);

    if (message.includes('move')) {
      // Parse move data
      const newMessage = message.split(' ');
      const game = findGame(newMessage[0]);
      game.move(newMessage[2]);
      wss.clients.forEach((client) => client.send(message));
    }

    if (message.includes('new')) {
      const newMessage = message.split(' ').filter((v) => v.length > 0);
      if (newMessage.length > 1) {
        if (findGame(newMessage[1])) {
          ws.send(
            JSON.stringify({
              message: `Game already exists with code: ${
                findGame(newMessage[1]).code
              }`,
              code: newMessage[1],
            }),
          );
        } else {
          games.push(new Game(newMessage[1]));
          ws.send(
            JSON.stringify({
              message: `New game created with code: ${newMessage[1]}`,
              code: newMessage[1],
            }),
          );
          writeNewGame();
        }
      } else {
        games.push(new Game());
        ws.send(
          JSON.stringify({
            message: `New game created with code: ${
              games[games.length - 1].code
            }`,
            code: games[games.length - 1].code,
          }),
        );
        writeNewGame();
      }
    }
  });
});

const writeNewGame = () => {
  // fs.writeFile('./games.json', JSON.stringify(games), (e) => {
  //   if (e) throw e;
  // });
  console.log('writing new game');
};

//start our server
server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
