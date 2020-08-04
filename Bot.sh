#!/bin/bash
RED="\033[0;31m"
NC="\033[0m"
echo -e "${RED}                  _                           _       "
echo "   ___  ___ _   _| | ___ __ _ _ __   __ _  __| | __ _ "
echo "  / _ \/ __| | | | |/ __/ _\` | '_ \ / _\` |/ _\` |/ _\` |"
echo " | (_) \__ \ |_| |_| (_| (_| | | | | (_| | (_| | (_| |"
echo "  \___/|___/\__,_(_)\___\__,_|_| |_|\__,_|\__,_|\__,_|"
echo -e "${NC}"
echo "Node.js $(node --version)"
echo "NPM $(npm --version)"
echo "$(lsb_release -d)"

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
