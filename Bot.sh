#!/bin/bash
RED="\033[0;31m"
NC="\033[0m"
echo -e "${RED}osu!canada bot${NC}"
echo "Node.js $(node --version)"
echo "NPM $(npm --version)"
echo "$(lsb_release -d)"

echo "Pulling latest changes from GitHub!"
git pull >/dev/null 2>&1
echo "Done!"

if [ "$1" == "-p" ]; then
    echo "Starting in production mode"
    echo "Installing NPM Modules"
    npm i >/dev/null 2>&1
    echo "Done"
    cd src
    npm run-script production
else
    echo "Starting in development mode"
    echo "Installing NPM Modules"
    npm i >/dev/null 2>&1
    echo "Done"
    cd src
    npm run-script test
fi
