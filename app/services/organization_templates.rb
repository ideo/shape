class OrganizationTemplates < SimpleService
  def initialize(organization, user)
    @org = organization
    @user = user
  end

  def call
    setup_template_collection
    setup_profile_template
    setup_profile_collection
    setup_getting_started_collection
    @org.save
  end

  def setup_getting_started_collection
    return if @org.getting_started_collection.present? || getting_started_template.blank?

    OrganizationTemplatesWorker.new.perform(
      @org.id,
      getting_started_template.id,
      @user.id,
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
    LinkToSharedCollectionsWorker.new.perform(
      [@org.admin_group.user_ids],
      [@org.admin_group.id],
      [template_collection.id],
      [],
    )
  end

  def setup_profile_template
    return if @org.profile_template.present?
    # Create default profile template and add it to the templates collection
    profile_template = @org.create_profile_master_template(
      name: 'Profile',
    )
    CollectionCard::Primary.create(
      order: 1,
      width: 1,
      height: 1,
      parent: @org.template_collection,
      collection: profile_template,
    )
    @org.admin_group.add_role(Role::EDITOR, profile_template)
    profile_template.reload.update_cached_tag_lists
    profile_template.recalculate_breadcrumb!
    setup_profile_template_items
  end

  def setup_profile_template_items
    return if @org.profile_template.items.any?
    photo = Item::FileItem.create(
      name: 'Default profile',
      filestack_file: FilestackFile.create(
        handle: 'Qs0v5CCTt2DiqlG8grVH',
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
      text_data: {
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
      parent: @org.profile_template,
      item: photo,
      pinned: true,
    )
    CollectionCard::Primary.create(
      order: 1,
      width: 2,
      height: 2,
      parent: @org.profile_template,
      item: text,
      pinned: true,
    )
    [photo, text].each do |item|
      @org.admin_group.add_role(Role::EDITOR, item)
      item.recalculate_breadcrumb!
    end
  end

  def setup_profile_collection
    return if @org.profile_collection.present?
    # Create profile collection (directory of user profiles)
    @org.create_profile_collection(
      name: 'People',
      organization: @org,
    )
    @org.primary_group.add_role(Role::VIEWER, @org.profile_collection)
    @org.guest_group.add_role(Role::VIEWER, @org.profile_collection)
  end

  def getting_started_template
    @getting_started_template ||= Collection.find_by(id: ENV['GETTING_STARTED_TEMPLATE_ID'])
  end
end
