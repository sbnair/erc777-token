#!/bin/bash

rel_dir="$(dirname "$0")"
# get PARITY_BINARY_PATH
source "$rel_dir/parity_binary_path.sh"

# Exit script as soon as a command fails.
set -o errexit

# Executes cleanup function at script exit.
trap cleanup EXIT

cleanup() {
  # Kill the parity instance that we started (if we started one and if it's still running).
  if [ -n "$parity_pid" ] && ps -p $parity_pid > /dev/null; then
    echo "Stopping Ethereum/Ganache instance (PID $parity_pid)"
    kill -9 $parity_pid
  fi
  $PARITY_BINARY_PATH --chain scripts/specs/wasm-dev-chain.json --base-path ganache_data db kill
  rm ganache_data/keys/DevelopmentChain/UTC*
}

parity_port=8545

parity_running() {
  nc -z localhost "$parity_port"
}

start_parity() {
  $PARITY_BINARY_PATH --chain scripts/specs/wasm-dev-chain.json --jsonrpc-apis=all --ws-apis all --base-path parity_data --unlock="0x004ec07d2329997267ec62b4166639513386f32e" --password <(echo "user") > /dev/null &
  parity_pid=$!
  echo " (PID $parity_pid)"
}

if parity_running; then
  echo "Using existing Ethereum/Ganache instance"
else
  printf "Starting new Ethereum/Ganache instance"
  start_parity
fi

echo "Building ERC777 Token Contract..."
# todo: Automate building of all contracts in the "contracts" folder
cd contracts/erc777-token
./build.sh
cd ../..
echo "Test ERC777"
# Give parity some more time to start
sleep 0.5

# run tests
./node_modules/.bin/mocha --reporter spec

# note: cleanup done by cleanup()
