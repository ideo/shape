module IdeoSsoHelper
  def ideo_sso_client_id
    ENV['IDEO_SSO_CLIENT_ID']
  end

  def ideo_sso_api_base_url
    URI.join(ENV['IDEO_SSO_HOST'], ENV['IDEO_SSO_API_PATH'])
  end

  def ideo_sso_url(method, addtl_params = {})
    NetworkApi::Authentication.send(
      method,
      redirect_url: ideo_sso_redirect_url.to_s,
      cookies: cookies,
      addtl_params: addtl_params,
    ).to_s
  end

  def ideo_sso_token_auth_url(token = nil)
    ideo_sso_url(:uri_with_oauth_params, auth_token: token)
  end

  def ideo_sso_sign_up_url(addtl_params = {})
    ideo_sso_url(:sign_up_url, addtl_params)
  end

  def ideo_sso_sign_in_url(addtl_params = {})
    ideo_sso_url(:sign_in_url, addtl_params)
  end

  def stripe_js_sdk_url
    'https://js.stripe.com/v3/'
  end

  def stripe_js_api_key
    ENV['STRIPE_JS_API_KEY']
  end

  def ideo_sso_redirect_url
    return unless ENV['BASE_HOST'].present? && ENV['IDEO_SSO_REDIRECT_PATH'].present?

    # NOTE: disabling this as it was breaking the redirect
    # organization_id_param = ''
    # if redirect_organization.present?
    #   organization_id_param = "?organization_id=#{redirect_organization.id}"
    # end

    URI.join(ENV['BASE_HOST'], ENV['IDEO_SSO_REDIRECT_PATH'])
  end
end
