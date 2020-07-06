class Ability
  include CanCan::Ability

  def initialize(user, current_application = nil)
    # See the wiki for details:
    # https://github.com/CanCanCommunity/cancancan/wiki/Defining-Abilities

    user ||= User.new
    # modify represents all the non-read-only actions
    alias_action :create, :update, :destroy, to: :modify

    if user.has_cached_role?(Role::SUPER_ADMIN)
      can :read, :all
      can :manage, :all

    elsif user.persisted? && user.active?
      # Logged-in users only

      can :read, Organization do |organization|
        organization.can_view?(user)
      end
      can :read, User

      can :create, Group
      can :read, Group do |group|
        group.can_view?(user)
      end

      can :manage, Group do |group|
        group.can_edit?(user)
      end

      can :manage, Organization do |organization|
        organization.can_edit?(user)
      end

      can :create, Collection
      can %i[read challenge_phase_collections], Collection do |collection|
        collection.can_view?(user)
      end
      can :duplicate, Collection do |collection|
        collection.can_view?(user) &&
          !collection.system_required?
      end
      can :edit_content, Collection do |collection|
        collection.can_edit_content?(user)
      end
      can :edit_name, Collection do |collection|
        collection.can_edit_content?(user) &&
          !collection.system_required?
      end
      can :manage, Collection do |collection|
        collection.can_edit?(user) &&
          !collection.system_required? &&
          (user.application_bot? || !collection.pinned_and_locked?)
      end

      can :create, CollectionCard
      can :read, CollectionCard do |collection_card|
        collection_card.can_view?(user)
      end
      can :duplicate, CollectionCard do |collection_card|
        collection_card.can_view?(user) &&
          !collection_card.system_required?
      end
      can :move, CollectionCard do |collection_card|
        !collection_card.pinned_and_locked? &&
          (
            collection_card.parent.can_edit_content?(user) ||
            collection_card.can_edit?(user)
          )
      end
      can :manage, CollectionCard do |collection_card|
        collection_card.can_edit?(user) &&
          (user.application_bot? ||
          !collection_card.pinned_and_locked?)
      end

      can :create, Item
      can %i[read duplicate], Item do |item|
        item.can_view?(user)
      end
      can :edit_content, Item do |item|
        item.can_edit_content?(user)
      end
      can :manage, Item do |item|
        item.can_edit?(user) &&
          (user.application_bot? ||
          !item.pinned_and_locked?)
      end

      can :create, CommentThread
      can %i[read manage], CommentThread do |comment_thread|
        # equivalent to comment_thread.record.can_view?
        comment_thread.can_edit?(user)
      end

      can :read, Audience do |audience|
        audience.can_view?(user)
      end
      can :manage, Audience do |audience|
        audience.can_edit?(user)
      end

      can :read, Comment do |comment|
        comment.can_view?(user)
      end
      can :manage, Comment do |comment|
        comment.can_edit?(user)
      end

      can :create, Dataset
      if current_application.present?
        can :manage, Dataset, application_id: current_application.id
      end

      can :create, DataItemsDataset
      can :manage, DataItemsDataset do |data_items_dataset|
        data_items_dataset.data_item.can_edit?(user)
      end

      can :manage, TestAudience do |test_audience|
        # TestAudience can only be updated through the API, not created/destroyed
        # which happens via PurchaseTestAudience service
        test_audience.link_sharing? &&
          test_audience.test_collection.can_edit?(user)
      end

      can :manage, QuestionChoice do |question_choice|
        question_choice.can_edit?(user)
      end

      can :read, QuestionChoice do |question_choice|
        question_choice.can_view?(user)
      end
    end
    # for logged-out users and fallback for all users
    can :read, Collection, anyone_can_view: true
    can :read, Collection, anyone_can_join: true
    can :read, Item, anyone_can_view: true

    # don't allow any of the editing actions unless you've accepted terms
    # (i.e. user becomes view-only)
    cannot :modify, :all unless user.current_org_terms_accepted
  end
end
