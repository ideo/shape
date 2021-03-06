class ChallengeRelevantPhaseCollections < SimpleService
  def initialize(collection:, for_user: nil)
    @collection = collection
    @for_user = for_user
    @parent_challenge = @collection.parent_challenge
  end

  def call
    return [] if !challenge? && @parent_challenge.blank?

    collections = relevant_phase_collections
    return collections if @for_user.blank?

    collections.select do |collection|
      collection.can_view?(@for_user)
    end
  end

  private

  def challenge?
    @collection.collection_type_challenge?
  end

  def relevant_phase_collections
    if phase_collections.present?
      # If they all match the same breadcrumb, they are included
      return phase_collections if all_breadcrumbs_match?(phase_collections)

      # Otherwise we only pull the first descendant phases
      return phase_collections_with_shortest_breadcrumb if all_breadcrumbs_match?(phase_collections_with_shortest_breadcrumb)

      # If the closest descendant phases did not match breadcrumb
      # (e.g. they have different parent collections),
      # return no phase collections
      []
    elsif !challenge? && @collection.inside_a_challenge?
      # If no children phase collections are present, look for a parent challenge, and find it's phases
      ChallengeRelevantPhaseCollections.call(
        collection: @parent_challenge,
        for_user: @for_user,
      )
    else
      []
    end
  end

  def all_breadcrumbs_match?(collections)
    first_breadcrumb = collections.first.breadcrumb
    collections.all? do |collection|
      collection.breadcrumb == first_breadcrumb
    end
  end

  def phase_collections_with_shortest_breadcrumb
    phase_collections.select do |phase_collection|
      phase_collection.breadcrumb.size == shortest_breadcrumb_length
    end
  end

  def shortest_breadcrumb_length
    @shortest_breadcrumb_length ||= phase_collections.map do |phase_collection|
      phase_collection.breadcrumb.size
    end.min
  end

  # This returns all phases that are descendants of this collection,
  # including all collections + linked collections

  # If we want to instead use just collections that live directly in the subtree, it would be:
  #
  #  @collection.all_child_collections.where(collection_type: :phase).order(start_date: :asc)
  #
  def phase_collections
    return @phase_collections unless @phase_collections.nil?

    all_collection_ids = Collection.in_collection(@collection.id).pluck(:id) + [@collection.id]

    @phase_collections = Collection.collection_type_phase
                                   .active
                                   .joins(:parent_collection_cards)
                                   .merge(
                                     CollectionCard.visible.where(parent_id: all_collection_ids),
                                   )
                                   .distinct
                                   .order(start_date: :asc)
  end
end
