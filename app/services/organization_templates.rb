class OrganizationTemplates < SimpleService
  def initialize(organization)
    @org = organization
  end

  def call
    setup_template_collection
    setup_profile_template
    setup_profile_collection
    @org.save
  end

  private

  def setup_template_collection
    return if @org.template_collection.present?
    # Create templates collection
    template_collection = @org.create_template_collection(
      name: "#{@org.name} Templates",
      organization: @org,
    )

    @org.admin_group.add_role(Role::CONTENT_EDITOR, template_collection)
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
    profile_template = @org.create_profile_template(
      name: 'Profile',
      organization: @org,
    )
    CollectionCard::Primary.create(
      order: 1,
      width: 1,
      height: 1,
      parent: @org.template_collection,
      collection: profile_template,
    )
    @org.admin_group.add_role(Role::CONTENT_EDITOR, profile_template)
    setup_profile_template_items
  end

  def setup_profile_template_items
    return if @org.profile_template.items.any?
    photo = Item::ImageItem.create(
      name: 'Default profile',
      filestack_file: FilestackFile.create(
        handle: 'Qs0v5CCTt2DiqlG8grVH',
        mimetype: 'image/png',
        size: 15_945,
        filename: 'default_profile.png',
        url: 'https://cdn.filestackcontent.com/Qs0v5CCTt2DiqlG8grVH',
      ),
    )
    text = Item::TextItem.create(
      name: 'Biography',
      content: '<h3>BIOGRAPHY</h3><p>Tell us about yourself by typing over this text.</p><h3>EXPERTISE</h3><p>vacuum tubes, calligraphy</p><h3>LOCATION</h3><p>Metropolis</p>',
      text_data: { "ops": [{ "insert": 'BIOGRAPHY' }, { "insert": "\n", "attributes": { "header": 3 } }, { "insert": "Tell us about yourself by typing over this text.\nEXPERTISE" }, { "insert": "\n", "attributes": { "header": 3 } }, { "insert": "vacuum tubes, calligraphy\nLOCATION" }, { "insert": "\n", "attributes": { "header": 3 } }, { "insert": "Metropolis\n" }] },
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
      @org.admin_group.add_role(Role::CONTENT_EDITOR, item)
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
  end
end
