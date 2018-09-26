#!/bin/sh

cd "$(dirname "$0")"
DIR=$(pwd)

# Usage: `./dev.sh [-e editor] [-s]`
#  [-e editor] will open using your preferred editor
#  [-s] will run all setup (bundle, yarn, db:migrate)

EDITOR=${1:-atom}
while [ "$1" != "" ]; do
    case $1 in
        -e | --editor )   shift
                          EDITOR=${1:-atom}
                          ;;
        -s | --setup )    SETUP=${1:-false}
                          ;;
    esac
    shift
done

if [ $SETUP ]; then
  $DIR/script/dev-setup
fi

if ! [ -x "$(command -v ttab)" ]; then
  echo 'Error: ttab is not installed. See: https://www.npmjs.com/package/ttab' >&2
  echo 'using `heroku local -f Procfile.development`'
  heroku local -f Procfile.development
else
  # echo 'Starting heroku local to run webpack-dev-server...'
  ttab heroku local webpack -f Procfile.development
  ttab heroku local worker -f Procfile.development
  # echo 'Running rails server...'
  ttab bin/rails server
  # echo 'Opening code editor...'
  ttab "$EDITOR . && open http://localhost:3000"
fi
