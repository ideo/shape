module Templateable
  extend ActiveSupport::Concern

  included do
    acts_as_tagger
    has_many :templated_collections,
             class_name: 'Collection',
             foreign_key: :template_id,
             inverse_of: :template

    after_create :add_template_tag, if: :master_template?
  end

  def profile_template?
    return false unless master_template?
    organization.profile_template_id == id
  end

  def system_required?
    return false unless master_template?
    profile_template?
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
      update_templated_collection(templated)
    end
  end

  def update_templated_collection(templated)
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

  def add_template_tag
    # create the special #template tag
    tag(
      self,
      with: 'template',
      on: :tags,
    )
    update_cached_tag_lists
  end
end
