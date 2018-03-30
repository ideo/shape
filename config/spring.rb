%w(
  .ruby-version
  .rbenv-vars
  .env
  Gemfile.lock
  Procfile.development
  tmp/restart.txt
  tmp/caching-dev.txt
).each { |path| Spring.watch(path) }
