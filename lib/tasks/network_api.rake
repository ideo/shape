namespace :network_api do
  desc 'Update Network Application to have our redirect uri'
  task application_add_redirect_uri: :environment do
    application = NetworkApi::Application.first

    if application.blank?
      puts "Could not find an application for this app using IDEO_SSO_API_TOKEN: #{ENV['IDEO_SSO_API_TOKEN']}"
      next
    end

    next if application.redirect_uri.include?(redirect_uri)

    application.redirect_uri += "\n#{redirect_uri}"
    application.save

    puts "Updated application with redirect URI: #{redirect_uri}"
  end

  task application_remove_redirect_uri: :environment do
    application = NetworkApi::Application.first

    if application.blank?
      puts "Could not find an application for this app using IDEO_SSO_API_TOKEN: #{ENV['IDEO_SSO_API_TOKEN']}"
      next
    end

    next if !application.redirect_uri.include?(redirect_uri)

    existing_redirect_uri = application.redirect_uri.split("\n")
    existing_redirect_uri.delete(redirect_uri)
    application.redirect_uri = existing_redirect_uri.join("\n")
    application.save

    puts "Updated application with redirect URI: #{redirect_uri}"
  end

  def redirect_uri
    base_url = "https://#{ENV['HEROKU_APP_NAME']}.herokuapp.com"
    URI.join(base_url, ENV['IDEO_SSO_REDIRECT_PATH']).to_s
  end
end
