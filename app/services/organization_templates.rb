class OrganizationTemplates < SimpleService
  include CollectionCardBuilderHelpers

  def initialize(organization, user)
    @org = organization
    @user = user
  end

  def call
    setup_template_collection
    copy_master_templates_into_org
    @org.save
  end

  def copy_master_templates_into_org
    # NOTE: this also populates the first org admin's My Collection
    if @org.getting_started_collection.present? || getting_started_template.blank?
      # kind of an escape hatch in case your env does not have a valid getting_started_template
      return
    end

    # create Getting Started collection for the org and the first admin user
    OrganizationTemplatesWorker.new.perform(
      # for some reason the org sometimes wasn't being found right away
      @org.id,
      @user&.id,
    )
  end

  private

  def setup_template_collection
    return if @org.template_collection.present?

    # Create templates collection
    template_collection = Collection::Global.create(
      name: "#{@org.name} Templates",
      organization: @org,
    )
    @org.template_collection = template_collection
    @org.save!

    @org.admin_group.add_role(Role::EDITOR, template_collection)
    @org.primary_group.add_role(Role::VIEWER, template_collection)
    template_collection.update(shared_with_organization: true)
    # also make sure to share with the initial creator
    LinkToSharedCollectionsWorker.perform_sync(
      [@org.primary_group.user_ids],
      [],
      [template_collection.id],
      [],
    )
    return unless @org.shell

    # Manually link the template collection to the org clone my collection
    # collection that doesn't have a user yet
    org_user_collection = Collection::UserCollection.find_by(
      organization_id: @org.id,
    )
    create_card(
      parent_collection: org_user_collection,
      params: {
        collection_id: template_collection.id,
      },
    )
  end

  def getting_started_template
    @getting_started_template ||= Collection.find_by(id: ENV['GETTING_STARTED_TEMPLATE_ID'])
  end
end
