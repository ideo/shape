
Rails.application.configure do
   config.webpacker.check_yarn_integrity = false  # Settings specified here will take precedence over those in config/application.rb.

  # Code is not reloaded between requests.
  config.cache_classes = true

  # Eager load code on boot. This eager loads most of Rails and
  # your application in memory, allowing both threaded web servers
  # and those relying on copy on write to perform better.
  # Rake tasks automatically ignore this option for performance.
  config.eager_load = true

  # Full error reports are disabled and caching is turned on.
  config.consider_all_requests_local       = false
  config.action_controller.perform_caching = true

  # Attempt to read encrypted secrets from `config/secrets.yml.enc`.
  # Requires an encryption key in `ENV["RAILS_MASTER_KEY"]` or
  # `config/secrets.yml.key`.
  config.read_encrypted_secrets = true

  # Disable serving static files from the `/public` folder by default since
  # Apache or NGINX already handles this.
  config.public_file_server.enabled = ENV['RAILS_SERVE_STATIC_FILES'].present?

  # Compress JavaScripts and CSS.
  config.assets.js_compressor = :uglifier
  # config.assets.css_compressor = :sass

  # Do not fallback to assets pipeline if a precompiled asset is missed.
  config.assets.compile = false

  # Suppress logger output for asset requests.
  config.assets.quiet = true

  # `config.assets.precompile` and `config.assets.version` have moved to config/initializers/assets.rb

  # Enable serving of images, stylesheets, and JavaScripts from an asset server.
  # config.action_controller.asset_host = 'http://assets.example.com'

  # Specifies the header that your server uses for sending files.
  # config.action_dispatch.x_sendfile_header = 'X-Sendfile' # for Apache
  # config.action_dispatch.x_sendfile_header = 'X-Accel-Redirect' # for NGINX


  # Force all access to the app over SSL, use Strict-Transport-Security, and use secure cookies.
  config.force_ssl = true

  # Use the lowest log level to ensure availability of diagnostic information
  # when problems arise.
  config.log_level = :info

  # Prepend all log lines with the following tags.
  config.log_tags = [ :request_id ]

  # Use dalli store (memcached) in production.
  if ENV['MEMCACHEDCLOUD_SERVERS']
    config.cache_store = :dalli_store,
      ENV['MEMCACHEDCLOUD_SERVERS'].split(','),
      { username: ENV['MEMCACHEDCLOUD_USERNAME'], password: ENV['MEMCACHEDCLOUD_PASSWORD'] }
  end

  # Use a real queuing backend for Active Job (and separate queues per environment)
  config.active_job.queue_adapter = :sidekiq

  # config.active_job.queue_name_prefix = "ideo-sso-demo_#{Rails.env}"
  config.action_mailer.perform_caching = false

  app_uri = URI.parse(ENV['BASE_HOST'])
  config.action_mailer.default_url_options = { host: app_uri.host }
  config.action_mailer.delivery_method = :smtp

  # Asset host must be nil for Roadie inline to work
  config.action_mailer.asset_host = nil

  # Use Roadie's url_options for inline email styles
  config.roadie.url_options = {
    host: app_uri.host,
    scheme: 'https'
  }

  config.action_mailer.perform_deliveries = true
  config.action_mailer.default charset: 'utf-8'

  config.action_mailer.smtp_settings = {
    :address        => 'smtp.sendgrid.net',
    :port           => '587',
    :authentication => :plain,
    :user_name      => ENV['SENDGRID_USERNAME'],
    :password       => ENV['SENDGRID_PASSWORD'],
    :domain         => 'heroku.com',
    :enable_starttls_auto => true
  }


  # Ignore bad email addresses and do not raise email delivery errors.
  # Set this to true and configure the email server for immediate delivery to raise delivery errors.
  # config.action_mailer.raise_delivery_errors = false

  # Enable locale fallbacks for I18n (makes lookups for any locale fall back to
  # the I18n.default_locale when a translation cannot be found).
  config.i18n.fallbacks = true

  # Send deprecation notices to registered listeners.
  config.active_support.deprecation = :notify

  # Use default logging formatter so that PID and timestamp are not suppressed.
  config.log_formatter = ::Logger::Formatter.new

  # Use a different logger for distributed setups.
  # require 'syslog/logger'
  # config.logger = ActiveSupport::TaggedLogging.new(Syslog::Logger.new 'app-name')

  if ENV["RAILS_LOG_TO_STDOUT"].present?
    logger           = ActiveSupport::Logger.new(STDOUT)
    logger.formatter = config.log_formatter
    config.logger    = ActiveSupport::TaggedLogging.new(logger)
  end

  # Do not dump schema after migrations.
  config.active_record.dump_schema_after_migration = false

  # redirect all URLs that do not match BASE_HOST
  config.middleware.insert_before(Rack::Runtime, Rack::Rewrite) do
    uri = URI.parse(ENV['BASE_HOST'])
    r301 %r{.*}, "//#{uri.host}$&", if: Proc.new { |rack_env|
      rack_env['SERVER_NAME'] != uri.host
    }
  end
end
