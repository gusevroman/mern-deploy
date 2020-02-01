const express = require('express');
const config = require('config');
const mongoose = require('mongoose');
const router = require('./routers/auth.routes');

const app = express();

app.use('/api/auth', router);

const PORT = config.get('port') || 5000;


async function start() {
  try {
    await mongoose.connect(config.get('mongoUri'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    });
  } catch (e) {
    console.log('Server Error', e.message);
    process.exit();
  }
}

start();

app.listen(PORT, () => console.log(`App has been started on port ${PORT} ...`));
