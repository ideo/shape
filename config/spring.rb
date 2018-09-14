# see:
# https://github.com/rails/rails/issues/32700
# and:
# https://github.com/jonleighton/spring-watcher-listen/issues/15

Spring::Watcher::Listen.class_eval do
  def base_directories
    %w[app lib config test spec]
      .uniq.map { |path| Pathname.new(File.join(root, path)) }
  end
end

%w[
  .ruby-version
  .rbenv-vars
  .env
  Gemfile.lock
  Procfile.development
  tmp/restart.txt
  tmp/caching-dev.txt
].each { |path| Spring.watch(path) }
