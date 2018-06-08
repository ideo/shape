# Configure Rack CORS Middleware, so that CloudFront can serve our assets.
# See https://github.com/cyu/rack-cors
# adapted from https://stackoverflow.com/a/36585871/260495
if defined? Rack::Cors
  Rails.configuration.middleware.insert_before 0, Rack::Cors do
    allow do
      origins [
        %r{^https?://[a-zA-Z0-9\-]*\.shape\.space$},
      ]
      resource '/assets/*'
      resource '/packs/*'
    end
  end
end
