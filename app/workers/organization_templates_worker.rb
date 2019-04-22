class OrganizationTemplatesWorker
  include Sidekiq::Worker

  def perform(organization_id, user_id)
    @organization = Organization.find(organization_id)
    @original_getting_started_collection = Collection.find(ENV['GETTING_STARTED_TEMPLATE_ID'])
    @original_templates_collection = Collection.find(ENV['ORG_MASTER_TEMPLATES_ID'])
    @user = User.find(user_id)

    copy_templates_from_master
    create_profile_template
    create_profile_collection
    create_org_getting_started_collection
    create_user_getting_started_collection
  rescue ActiveRecord::RecordNotFound
    # org was already deleted, e.g. in a test
    false
  end

  private

  def copy_templates_from_master
    @original_templates_collection.copy_all_cards_into!(
      @organization.template_collection,
      synchronous: true,
    )
  end

  def create_profile_template
    return if @organization.profile_template.present?
    # Create default profile template and add it to the templates collection
    profile_template = @organization.create_profile_master_template(
      name: 'Profile',
    )
    CollectionCard::Primary.create(
      # stick at the end
      order: @organization.template_collection.collection_cards.count,
      width: 1,
      height: 1,
      parent: @organization.template_collection,
      collection: profile_template,
    )
    profile_template.reload.update_cached_tag_lists
    profile_template.reanchor!
    profile_template.recalculate_breadcrumb!
    create_profile_template_items
  end

  def create_profile_template_items
    return if @organization.profile_template.items.any?
    photo = Item::FileItem.create(
      name: 'Default profile',
      filestack_file: FilestackFile.create(
        handle: 'mgHQ3TGEQ42W2EU82nQ8',
        mimetype: 'image/png',
        size: 15_945,
        filename: 'mustache_man.png',
        url: 'https://cdn.filestackcontent.com/mgHQ3TGEQ42W2EU82nQ8',
      ),
    )
    text = Item::TextItem.create(
      name: 'Biography',
      content: %(
        <h3>BIOGRAPHY</h3><p>Tell us about yourself by typing over this text.</p>
        <h3>EXPERTISE</h3><p>vacuum tubes, calligraphy</p>
        <h3>LOCATION</h3><p>Metropolis</p>
      ),
      data_content: {
        "ops": [
          { "insert": 'BIOGRAPHY' },
          { "insert": "\n", "attributes": { "header": 3 } },
          { "insert": "Tell us about yourself by typing over this text.\nEXPERTISE" },
          { "insert": "\n", "attributes": { "header": 3 } },
          { "insert": "vacuum tubes, calligraphy\nLOCATION" },
          { "insert": "\n", "attributes": { "header": 3 } },
          { "insert": "Metropolis\n" },
        ],
      },
    )
    CollectionCard::Primary.create(
      order: 0,
      width: 2,
      height: 1,
      parent: @organization.profile_template,
      item: photo,
      pinned: true,
    )
    CollectionCard::Primary.create(
      order: 1,
      width: 2,
      height: 2,
      parent: @organization.profile_template,
      item: text,
      pinned: true,
    )
    [photo, text].each(&:recalculate_breadcrumb!)
  end

  def create_profile_collection
    return if @organization.profile_collection.present?
    # Create profile collection (directory of user profiles)
    @organization.create_profile_collection(
      name: 'People',
      organization: @organization,
    )
    @organization.primary_group.add_role(Role::VIEWER, @organization.profile_collection)
    @organization.guest_group.add_role(Role::VIEWER, @organization.profile_collection)
  end

  def create_org_getting_started_collection
    return if @organization.getting_started_collection.present?
    getting_started_collection = @original_getting_started_collection.duplicate!(
      copy_parent_card: true,
      parent: @organization.template_collection,
      system_collection: true,
      synchronous: true,
    )
    return unless getting_started_collection.persisted?

    unless getting_started_collection.is_a?(Collection::Global)
      getting_started_collection.update_attributes(
        type: Collection::Global.to_s,
      )
      getting_started_collection = getting_started_collection.becomes(Collection::Global)
    end
    @organization.update_attributes!(getting_started_collection: getting_started_collection)
  end

  def create_user_getting_started_collection
    @organization.find_or_create_user_getting_started_content(
      @user,
      synchronous: true,
    )
  end
end
