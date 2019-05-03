module IdeoSsoHelper
  def ideo_sso_init_params
    {
      env: ideo_sso_env,
      client: ideo_sso_client_id,
      redirect: ideo_sso_redirect_url.to_s,
    }
  end

  def ideo_sso_env
    return ENV['IDEO_SSO_ENV'].to_sym if ENV['IDEO_SSO_ENV'].present?
    hostname = URI.parse(request.url).hostname
    if hostname.match(/(localhost|(staging\.shape\.space))$/).present?
      :staging
    else
      :production
    end
  end

  def ideo_sso_js_sdk_url
    path = '/js/ideo-sso-js-sdk.min.js'
    case ideo_sso_env
    when :local then 'http://localhost:9000/' + path
    when :staging then 'https://d278pcsqxz7fg5.cloudfront.net/1.1' + path
    else 'https://d3none3dlnlrde.cloudfront.net/1.1' + path
    end
  end

  def ideo_sso_client_id
    ENV['IDEO_SSO_CLIENT_ID']
  end

  def ideo_sso_api_base_url
    URI.join(ENV['IDEO_SSO_HOST'], ENV['IDEO_SSO_API_PATH'])
  end

  def ideo_sso_token_auth_url(token)
    ideo_sso_oauth_url(
      auth_token: token,
    )
  end

  def ideo_sso_oauth_url(addtl_params = {})
    NetworkApi::Authentication.uri_with_oauth_params(
      redirect_url: ideo_sso_redirect_url.to_s,
      cookies: cookies,
      addtl_params: addtl_params,
    ).to_s
  end

  def stripe_js_sdk_url
    'https://js.stripe.com/v3/'
  end

  def stripe_js_api_key
    ENV['STRIPE_JS_API_KEY']
  end

  def ideo_sso_redirect_url
    return unless ENV['BASE_HOST'].present? && ENV['IDEO_SSO_REDIRECT_PATH'].present?

    URI.join(ENV['BASE_HOST'], ENV['IDEO_SSO_REDIRECT_PATH'])
  end
end
