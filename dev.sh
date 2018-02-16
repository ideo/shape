#!/bin/sh
if ! [ -x "$(command -v ttab)" ]; then
  echo 'Error: ttab is not installed. See: https://www.npmjs.com/package/ttab' >&2
  exit 1
fi
# echo 'Running rails server...'
ttab ./bin/rails s
# echo 'Starting foreman to run webpack-dev-server...'
ttab foreman start -f Procfile.development
# echo 'Opening atom...'
ttab atom .
