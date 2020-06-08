source 'https://rubygems.org'
ruby '2.5.5'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?('/')
  "https://github.com/#{repo_name}.git"
end

# NOTE: IMPORTANT for this to be first so that gems e.g. omniauth-ideo
#       can pull in the right ENV vars
# ENV variables in dev
gem 'dotenv-rails', groups: %i[development test], require: 'dotenv/rails-now'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 5.2'

# Use postgresql as the database for Active Record
gem 'pg', '~> 1.1'

# Use Puma as the app server
gem 'puma', '~> 4.3.1'

# Use SCSS for stylesheets
gem 'autoprefixer-rails'
gem 'normalize-rails', '~> 4.1'
gem 'sass-rails', '~> 5.0'

# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'

# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.5'

# Devise for auth
gem 'devise', '~> 4.7.1'
gem 'omniauth-ideo', git: 'https://github.com/ideo/omniauth-ideo.git'

# Consumer for IDEO Network JSON APIs
gem 'network-api-ruby', git: 'https://github.com/ideo/network-api-ruby.git'

# Webpacker
gem 'webpacker', '>= 4.0.0'

# JSON serializer
gem 'jsonapi-rails'

# For defining user abilities
gem 'cancancan', '~> 2.0'

# For assigning user roles
gem 'rolify', '~> 5.2.0'

# Exception notification
gem 'appsignal'
gem 'sentry-raven'

# Easy DSL for cloning AR objects
gem 'amoeba'

# Background processing
gem 'sidekiq', '~> 6'
gem 'sidekiq-scheduler'

# ElasticSearch wrapper
gem 'searchkick', '~> 4.1.0'
# see https://github.com/elastic/elasticsearch-ruby/issues/669
gem 'elasticsearch', '~> 6'

# For taggable collections/items
gem 'acts-as-taggable-on', '~> 6.0.0'

# middleware for 301 redirects
gem 'rack-rewrite', '~> 1.5'
# for CORS requests (specifically for CDN handling)
gem 'rack-cors', '~> 1.0.1'

# Filestack API Wrapper
gem 'filestack', '~> 2.6.1'

# inline styles for email
gem 'roadie-rails', '~> 1.3'

# For easier http request
gem 'httparty'

# Redis in-memory caching
gem 'redis', '~> 4.1'

# memcache
gem 'dalli', '~> 2.7'

gem 'bootsnap', require: false

# easy pagination
gem 'kaminari', '~> 1.1'

# google auth + firestore
gem 'google-cloud-firestore', '~> 0.21.0'
gem 'jwt', '~> 1.5'

# looking up records by slug
gem 'friendly_id', '~> 5.2.0'

# State machine for ruby classes
gem 'aasm', '~> 5.0'
# mailchimp API
gem 'gibbon', '~> 3.2'

# distributed mutex
gem 'redis-mutex', '~> 4.0.1'

gem 'oj'
gem 'scout_apm'

# phone number normalization
gem 'phony'

# sending sms messages
gem 'twilio-ruby'

# Nice patterns for service objects
gem 'interactor'
gem 'interactor-schema'

# Double-entry accounting system
gem 'double_entry', '~> 2.0.0.beta1'

# custom wrapper for globalize gem
gem 'ideo-translation', git: 'https://github.com/ideo/ideo-translation.git'
gem 'globalize-accessors', ref: '2bf2bde' # Latest commit on master to get dirty tracking

gem 'slack-ruby-client'

# Text helper to provide possessive strings
gem 'possessive'

gem 'activerecord-import'

# Helper for writing union queries
gem 'active_record_union'

gem 'schmooze', require: false

# Faker needed for generating fake names
gem 'faker', '~> 1.9.5'

# Anycable for more performant ActionCable
# Note: you must `brew install anycable-go` if you want to run it locally
# See: https://docs.anycable.io/#/using_with_rails
gem 'anycable-rails', '>= 0.6.2'

gem 'rails_same_site_cookie'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: %i[mri mingw x64_mingw]
  gem 'action-cable-testing'
  gem 'active_record_query_trace'
  gem 'capybara', '~> 2.13'
  gem 'crystalball'
  gem 'database_cleaner'
  gem 'factory_bot_rails'
  gem 'lefthook'
  gem 'pry-byebug'
  gem 'pry-rails'
  gem 'rails-controller-testing'
  gem 'rspec-rails', '~> 3.9'
end

group :development do
  # annotate models with schema attributes
  gem 'annotate' # https://github.com/ctran/annotate_models
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'listen', '>= 3.0.5', '< 3.2'
  gem 'web-console', '>= 3.3.0'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'better_errors'
  gem 'binding_of_caller'
  gem 'derailed_benchmarks'
  gem 'guard', require: false
  gem 'guard-rspec', require: false
  gem 'rubocop', require: false
  gem 'spring'
  gem 'spring-commands-rspec'
  gem 'spring-watcher-listen', '~> 2.0.0'
  gem 'stackprof'
end

group :test do
  gem 'fakeredis', require: 'fakeredis/rspec'
  gem 'json-schema'
  gem 'shoulda-matchers', '~> 3.1'
  gem 'vcr'
  gem 'webmock'
  gem 'timecop'
  gem 'jsonapi_spec_helpers'
end

group :production do
  gem 'heroku-deflater', github: 'ideo/heroku-deflater'
  # https://devcenter.heroku.com/articles/rails-autoscale
  gem 'rails_autoscale_agent'
  # performance tuning
  gem 'tunemygc'
  gem 'barnes'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
# gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
