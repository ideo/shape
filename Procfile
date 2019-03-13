web: ANYCABLE_REDIS_URL=$REDIS_URL REDIS=$REDIS_URL bin/heroku-web
release: bundle exec rake db:migrate
worker: bundle exec sidekiq -e ${RACK_ENV:-development} -C config/sidekiq.yml
