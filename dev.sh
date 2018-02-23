#!/bin/sh
if ! [ -x "$(command -v ttab)" ]; then
  echo 'Error: ttab is not installed. See: https://www.npmjs.com/package/ttab' >&2
  exit 1
fi
# echo 'Running rails server...'
ttab heroku local web -f Procfile.development
# echo 'Starting heroku local to run webpack-dev-server...'
ttab heroku local webpack -f Procfile.development
# echo 'Opening atom...'
ttab atom .
