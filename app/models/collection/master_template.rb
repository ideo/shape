class Collection
  class MasterTemplate < Collection
    acts_as_tagger
    has_many :templated_collections,
             class_name: 'Collection',
             foreign_key: :templated_from_id,
             inverse_of: :template

    def profile_template?
      organization.profile_template_id == id
    end

    # copy all the cards from this template into a new collection
    def setup_templated_collection(for_user:, collection:)
      # TODO: what if the template includes a collection of nested cards?
      # -- or linked cards?
      collection_cards.each do |cc|
        cc.duplicate!(
          for_user: for_user,
          parent: collection,
        )
      end
      collection.update(template: self)
    end
  end
end
