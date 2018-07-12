class Collection
  class MasterTemplate < Collection
    acts_as_tagger
    has_many :templated_collections,
             class_name: 'Collection',
             foreign_key: :template_id,
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

    def update_templated_collections
      templated_collections.each do |templated|
        collection_cards.pinned.each do |pin|
          # this will iterate in order...
          cc = templated.collection_cards.where(templated_from: pin).first
          if cc.nil?
            pin.duplicate!(
              for_user: templated.created_by,
              parent: templated,
            )
          else
            cc.update(
              order: pin.order,
              height: pin.height,
              width: pin.width,
            )
          end
        end
        templated.reorder_cards!
      end
    end
  end
end
