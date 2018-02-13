module IdeoSsoHelper
  def ideo_sso_init_params
    prms = {
      client: okta_client_id,
      redirect: okta_omniauth_redirect_url.to_s
    }
    prms[:recoveryToken] = ideo_sso_recovery_token if ideo_sso_recovery_token.present?
    prms
  end

  def ideo_sso_recovery_token
    @ideo_sso_recovery_token
  end

  def okta_client_id
    ENV['OKTA_CLIENT_ID']
  end

  def okta_omniauth_redirect_url
    return unless ENV['OKTA_BASE_URL'].present? && ENV['OKTA_REDIRECT_PATH'].present?

    URI.join(ENV['OKTA_BASE_URL'], ENV['OKTA_REDIRECT_PATH'])
  end
end
