# CreativeDifference::Groups == BusinessUnit
class Api::V1::CreativeDifference::GroupsController < Api::V1::CreativeDifference::BaseController
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
              ).
              includes(:roles)

    groups.each do |group|
      business_unit_id = group.external_records.first.external_id_to_integer
      group.business_unit = business_units.find do |bu|
        bu["id"] == business_unit_id
      end
    end
    groups_with_bus = groups.select { |group| group.business_unit.present? }

    render jsonapi: groups_with_bus, include: [roles: %i[users groups]]
  end

  def create
    business_unit = create_business_unit
    if business_unit["errors"]
      group = Group.new
      group.errors.add(:business_unit, business_unit["errors"])
      render_api_errors group.errors
    else
      groups = create_related_groups(business_unit)

      render jsonapi: groups, include: [roles: %i[users groups]]
    end
  end

  def update
    # update BU name
    # also handle updating other values? (industry subcategory, structure)
    # find the Shape groups and update their names as well
  end

  private
  # TODO: extract methods to a standalone object in /services/creative_difference/client.rb
  def create_related_groups(business_unit)
    %w[admin member].map do |role_name|
      role_type = role_name.pluralize.titleize
      group = Group.create({
        name: "#{business_unit["name"]} #{role_type}",
        organization_id: current_organization.id,
        created_by: current_user,
        application: current_application,
      })
      # Assign business unit so the group can render properly
      group.business_unit = business_unit

      group.add_external_id("BusinessUnit_#{business_unit["id"]}_#{role_type}", ENV["CREATIVE_DIFFERENCE_APPLICATION_ID"])

      current_user.add_role(Role::ADMIN, group)
      group
    end
  end

  def create_business_unit
    token = ENV['CREATIVE_DIFFERENCE_API_TOKEN']
    url = 'http://localhost:3000/api/v3/business_units'
    external_id = current_user.current_organization.external_records.where(application_id: ENV["CREATIVE_DIFFERENCE_APPLICATION_ID"]).first&.external_id
    creative_difference_org_id = external_id.split("_").last

    p response = HTTParty.post(
        URI.encode(url),
        headers: {
          "Content-Type" => "application/json",
          "Authorization" => "Bearer #{token}"
        },
        body: {
          business_unit: json_api_params[:business_unit],
        }.to_json,
        query: {
          'organization_id': creative_difference_org_id
        },
        # format: :plain, # https://github.com/jnunemaker/httparty/tree/master/docs#parsing-json
        timeout: 10,
        retries: 1
      )
      JSON.parse(response.body, symbolize_keys: true)
  end

  def fetch_business_units
    token = ENV['CREATIVE_DIFFERENCE_API_TOKEN']
    url = 'http://localhost:3000/api/v3/business_units'
    external_id = current_user.current_organization.external_records.where(application_id: ENV["CREATIVE_DIFFERENCE_APPLICATION_ID"]).first&.external_id

    if external_id
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
