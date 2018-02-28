const path = require('path');

// 'dotenv' does not override environment variables that are already set,
// e.g., from docker-compose or kubernetes. This file will have no effect
// if all of the variables are set upstream, and is mainly used for local development.
require('dotenv').config({
    path: path.join(__dirname, '../../.env')
});
