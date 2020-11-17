class Api::V1::CreativeDifference::ProxyController < Api::V1::CreativeDifference::BaseController
  def index
    result = fetch_url
    render json: result
  end

  # TODO:
  # Add update route
  # proxy to C∆ OrganizationsController#update for industry/content_version_id/supported_languages

  private

  def fetch_url
    token = ENV['CREATIVE_DIFFERENCE_API_TOKEN']
    url = 'http://localhost:3000/api/v3/' + params[:url]
    external_id = current_user.current_organization.external_records.where(application_id: ENV["CREATIVE_DIFFERENCE_APPLICATION_ID"]).first&.external_id
    creative_difference_org_id = external_id.split("_").last
      # => "Organization_4" => "4"
      # HTTParty.get('http://localhost:3000/api/v3/business_units')
      p request = HTTParty.get(
        URI.encode(url),
        headers: {
          "Content-Type" => "application/json",
          "Authorization" => "Bearer #{token}"
        },
        query: {
          'organization_id': creative_difference_org_id
        },
        # format: :plain, # https://github.com/jnunemaker/httparty/tree/master/docs#parsing-json
        timeout: 10,
        retries: 1
      )
      JSON.parse(request.body, symbolize_keys: true)
  end
end
