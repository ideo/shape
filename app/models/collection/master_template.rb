class Collection
  class MasterTemplate < Collection
    has_many :templated_collections,
             class_name: 'Collection',
             foreign_key: :templated_from_id,
             inverse_of: :template

    def profile_template?
      organization.profile_template_id == id
    end

    # copy all the cards from this template into a new collection
    def create_templated_cards(for_user:, parent:)
      # TODO: what if the template includes a collection of nested cards?
      # -- or linked cards?
      collection_cards.each do |cc|
        cc.duplicate!(
          for_user: for_user,
          parent: parent,
        )
      end
    end
  end
end
