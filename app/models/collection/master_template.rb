class Collection
  class MasterTemplate < Collection
    def searchable?
      false
    end

    def should_index?
      false
    end

    def breadcrumbable?
      false
    end

    def profile_template?
      organization.profile_template_id == id
    end

    def setup_profile_template
      photo = Item::ImageItem.create(
        name: 'Default profile',
        filestack_file: FilestackFile.create_from_url('https://cdn.filestackcontent.com/j5dVggcYTq4afTEdLqJD')
      )
      text = Item::TextItem.create(
        name: 'Biography',
        content: '<h3>BIOGRAPHY</h3><p>Tell us about yourself by typing over this text.&nbsp;</p><h3>Expertise</h3><p>Write some of  the things you are an expert in</p><h3>Location</h3><p>San Francisco, CA</p>',
        text_data: '"{"ops":[{"insert":"BIOGRAPHY"},{"insert":"\n","attributes":{"header":3}},{"insert":"Tell us about yourself by typing over this text. \nExpertise"},{"insert":"\n","attributes":{"header":3}},{"insert":"Write some of  the things you are an expert in\nLocation"},{"insert":"\n","attributes":{"header":3}},{"insert":"San Francisco, CA\n"}]}"',
      )
      CollectionCard::Primary.create(
        order: 0,
        width: 2,
        height: 1,
        parent: self,
        item: photo,
      )
      CollectionCard::Primary.create(
        order: 1,
        width: 2,
        height: 2,
        parent: self,
        item: text,
      )
      save
    end
  end
end
