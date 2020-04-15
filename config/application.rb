require_relative 'boot'

require 'rails'
# we omit 'active_storage/engine' since we're not using it
%w[
  active_record/railtie
  action_controller/railtie
  action_view/railtie
  action_mailer/railtie
  active_job/railtie
  action_cable/engine
  rails/test_unit/railtie
  sprockets/railtie
].each do |railtie|
  require railtie
end

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module Shape
  SUPPORT_EMAIL = 'hello@shape.space'.freeze
  ZENDESK_EMAIL = 'help@shape.space'.freeze
  IDEO_PRODUCTS_GROUP_ID = 27
  COMMON_RESOURCE_GROUP_ID = (ENV['COMMON_RESOURCE_GROUP_ID'] || 1000).to_i

  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.2

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    config.autoload_paths << "#{config.root}/app/interactors"

    # ActionCable settings
    config.action_cable.url = ENV.fetch('ACTION_CABLE_URL') { 'ws://localhost:3000/cable' }

    # don't enable CSRF by default, opt-in via controller
    config.action_controller.default_protect_from_forgery = false

    # for serving gzipped assets
    config.middleware.use Rack::Deflater

    # https://github.com/globalize/globalize#i18n-fallbacks-for-empty-translations
    config.i18n.fallbacks = [I18n.default_locale]

    config.log_level = ENV.fetch('LOG_LEVEL') { :debug }
  end
end
