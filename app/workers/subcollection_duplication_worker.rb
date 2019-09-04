class SubcollectionDuplicationWorker
  include Sidekiq::Worker
  sidekiq_options queue: 'critical'

  def perform(card_ids, user_id = nil)
    for_user = User.find_by_id(user_id)
    cards = CollectionCard.where(id: card_ids)
    cards.each do |card|
      collection = card.collection

      next unless collection.present?

      # enable org view access
      collection.enable_org_view_access_if_allowed

      if collection.is_a?(Collection::SubmissionBox)
        after_submission_box_duplication(collection)
      elsif collection.is_a?(Collection::TestCollection)
        after_test_collection_duplication(collection)
      elsif collection.is_a?(Collection::TestDesign)
        after_test_design_duplication(collection)
      end

      # run any after_create callbacks e.g. ones defined in TestCollection/Design
      collection.run_callbacks :create

      cloned_from = collection.cloned_from
      next unless cloned_from.present? && cloned_from.collection_cards.any?

      cards = cloned_from.collection_cards
      if for_user.present?
        # skip any cards this user can't view
        cards = CollectionCardFilter.call(
          collection: cloned_from,
          user: for_user,
        )
        # `to_a` to make later references to `cards.count` still work
        cards = cards.to_a
      end
      next if for_user.present? && !card.record.can_view?(for_user)

      if for_user.nil? && collection&.cloned_from&.parent&.parent&.getting_started?
        collection.mark_as_getting_started_shell!
        # don't continue duplicating collection cards if it is a getting_started_shell
        next
      end

      CardDuplicator::Service.call(
        for_user: for_user,
        to_collection: collection,
        placement: 'beginning',
        # TODO: filter out cards based on for_user (!for_user == system_collection??)
        cards: cards,
        user_initiated: false,
        synchronous: true,
      )
    end
  end

  def after_submission_box_duplication(collection)
    collection.setup_submissions_collection!
  end

  def after_test_collection_duplication(collection)
    if collection.test_design.present?
      # If test design has already been created, just dupe that
      collection.cloned_from = collection.test_design
    end
    cloned_from = collection.cloned_from

    collection.type = 'Collection::TestCollection'
    collection = collection.becomes(Collection::TestCollection)
    if cloned_from.collection_to_test.present?
      # Point to the new parent as the one to test
      collection.collection_to_test = collection.parent
    elsif !cloned_from.parent.master_template? && !collection.parent.master_template?
      # Prefix with 'Copy' if it isn't still within a template
      collection.name = "Copy of #{collection.name}"
    end
    collection.save
  end

  def after_test_design_duplication(collection)
    collection = collection.becomes(Collection::TestCollection)
    cloned_from = collection.cloned_from
    collection.update(
      test_collection_id: nil,
      type: 'Collection::TestCollection',
      # Don't set this to be a master template if the parent is a template
      master_template: cloned_from.parent.master_template? ? false : cloned_from.master_template,
    )
  end
end
