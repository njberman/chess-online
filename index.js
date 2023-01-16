const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

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
    console.log(message);
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
  });
});

//start our server
server.listen(process.env.PORT || 8999, () => {
  console.log(`Server started on port ${server.address().port} :)`);
});
