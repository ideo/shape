class Collection
  class MasterTemplate < Collection
    def profile_template?
      organization.profile_template_id == id
    end

    def setup_profile_template
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
        parent: self,
        item: photo,
        pinned: true,
      )
      CollectionCard::Primary.create(
        order: 1,
        width: 2,
        height: 2,
        parent: self,
        item: text,
        pinned: true,
      )
      save
    end
  end
end
