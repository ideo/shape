source 'https://rubygems.org'
ruby '2.4.3'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

# NOTE: IMPORTANT for this to be first so that gems e.g. omniauth-ideo
#       can pull in the right ENV vars
# ENV variables in dev
gem 'dotenv-rails', groups: [:development, :test], require: 'dotenv/rails-now'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 5.1.4'

# Use postgresql as the database for Active Record
gem 'pg', '~> 0.21'

# Use Puma as the app server
gem 'puma', '~> 3.11'

# Use SCSS for stylesheets
gem 'sass-rails', '~> 5.0'
gem 'autoprefixer-rails'
gem 'normalize-rails', '~> 4.1'

# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'

# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.5'

# Devise for auth
gem 'devise'
gem 'omniauth-oauth2'
gem 'omniauth-ideo', git: 'https://github.com/ideo/omniauth-ideo.git'

# Webpacker
gem 'webpacker', '~> 3.0'

# JSON serializer
gem 'jsonapi-rails'

# For defining user abilities
gem 'cancancan', '~> 2.0'

# For assigning user roles
gem 'rolify', '~> 5.2.0'

# Exception notification
gem 'appsignal'

# Easy DSL for cloning AR objects
gem 'amoeba'

# Background processing
gem 'sidekiq'
gem 'sidekiq-scheduler'

# ElasticSearch wrapper
gem 'searchkick', '~> 3.0.0'

# For taggable collections/items
gem 'acts-as-taggable-on'

# middleware for 301 redirects
gem 'rack-rewrite', '~> 1.5'

# Filestack API Wrapper
gem 'filestack'

# inline styles for email
gem 'roadie-rails', '~> 1.2'

# For easier http request
gem 'httparty'

# Redis in-memory caching
gem 'redis'

# memcache
gem 'dalli', '~> 2.7'

gem 'bootsnap', require: false


group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  # Adds support for Capybara system testing and selenium driver
  gem 'capybara', '~> 2.13'
  gem 'selenium-webdriver'

  gem 'pry-rails'
  gem 'factory_bot_rails'
  gem 'faker', '~> 1.8.7'
  gem 'rspec-rails', '~> 3.7'
  gem 'database_cleaner'
  gem 'rails-controller-testing'
  gem 'action-cable-testing'
end

group :development do
  # Access an IRB console on exception pages or by using <%= console %> anywhere in the code.
  gem 'web-console', '>= 3.3.0'
  gem 'listen', '>= 3.0.5', '< 3.2'
  # Spring speeds up development by keeping your application running in the background. Read more: https://github.com/rails/spring
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'
  gem 'rubocop', require: false
  gem 'spring-commands-rspec'
  gem 'guard', require: false
  gem 'guard-rspec', require: false
  gem 'binding_of_caller'
  gem 'better_errors'
end

group :test do
  gem 'fakeredis', require: 'fakeredis/rspec'
  gem 'shoulda-matchers', '~> 3.1'
  gem 'json-schema'
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
# gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
