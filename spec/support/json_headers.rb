# Implemented so jsonapi-rb plays nicely with expected params
# https://github.com/jsonapi-rb/jsonapi-rails/issues/79

module JsonHeaders
  extend ActiveSupport::Concern

  HTTP_METHODS = %w[get post put delete patch].freeze

  included do
    # make requests xhr requests for all tests
    let(:default_headers) {
      {
        HTTP_ACCEPT: 'application/vnd.api+json',
        CONTENT_TYPE: 'application/vnd.api+json',
      }
    }

    HTTP_METHODS.each do |m|
      define_method(m) do |path, *args|
        args[0] ||= {}
        args[0][:headers] ||= {}
        args[0][:headers].merge!(default_headers)

        super(path, *args)
      end
    end
  end
end
