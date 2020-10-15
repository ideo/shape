class Api::V1::CreativeDifference::BusinessUnitsController < Api::V1::CreativeDifference::BaseController
  # how to load and authorize shape groups?
  before_action :authorize_shape_group # ?

  def index
    business_units = fetch_business_units
    groups = Group.where(
                organization_id: current_user.current_organization.id
              ).
              where_application_id(1).
              where(
                ExternalRecord.arel_table[:external_id].matches('BusinessUnit%')
              )

    groups.each do |group|
      business_unit_id = group.external_records.first.external_id_to_integer
      group.business_unit = business_units.find do |bu|
        p bu["id"]
        p business_unit_id
        bu["id"] == business_unit_id
      end
    end

    render jsonapi: groups
  end

  private

  def fetch_business_units
    token = ENV['CREATIVE_DIFFERENCE_API_TOKEN']
    url = 'http://localhost:3000/api/v3/business_units'
    external_id = current_user.current_organization.external_records.where(application_id: 1).first&.external_id
    p "fetching BUs" * 10
    if external_id
      p "external ID: #{external_id}" * 10
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
    else
      []
    end
  end

  # Move to Api::V1::CreativeDifference::BaseController
  def authorize_shape_group
    # load and authorize groups?
    true
  end
end
