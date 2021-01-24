const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const http = require('http');
const WebSocket = require("ws");


// Initialize knex wih objection
require('./helpers/init_knex');

// load env variables
require('dotenv').config()

const app = express();

/* Middlewares */
app.use(cors({ credentials: true, origin: true }));
app.use(morgan('dev'));
// Parse request body
app.use(express.json());
// Parse form data
app.use(express.urlencoded({ extended: false }));
// Parse cookie headers
app.use(cookieParser());

/* Endpoints */
app.use('/api', require('./routes'));

/** Handle route not found error */
app.use((req, res, next) => {
  next(createError.NotFound());
})

/* Error handling Middleware */
app.use((err, req, res, next) => {
  res.status(err.status || 500)
  return res.send({
    error: {
      message: err.message,
    },
  })
})

const PORT = process.env.PORT || 3100;
const server = http.createServer(app);
const webSocketServer = new WebSocket.Server({ server });
webSocketServer.on("connection", (webSocket) => {
  // console.info("Total connected clients:", webSocketServer.clients.size);

  app.locals.wsInstance = webSocket
  app.locals.clients = webSocketServer.clients;
});

server.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));
