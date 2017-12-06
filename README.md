# IOTA Sandbox

## Installation

1. Follow the instructions to build [ccurl](https://github.com/iotaledger/ccurl), and put `build/lib/libccurl.so`
   anywhere you like.
1. Copy the `.env.template` file to `.env` and fill in the missing configuration parameters. `CCURL_PATH` is the path to
   the folder containing `libccurl.so`.

## Running for Local Development

Recommended:

* In VSCode, choose from the avaliable configurations.

Otherwise:

* Run `node src/worker/index.js` (currently only the worker node is available).

## Deploying for Production

// TODO
