module UserTaggable
  extend ActiveSupport::Concern

  included do
    has_many :user_tags, as: :record, dependent: :destroy
    has_many :tagged_users, through: :user_tags, source: :user
    after_save :assign_and_remove_user_tags
  end

  class UserTagList < ActsAsTaggableOn::TagList
    # Override TagList implementation to skip downcasing,
    # as well as validate handles are user handles
    # https://github.com/mbleigh/acts-as-taggable-on/blob/master/lib/acts_as_taggable_on/tag_list.rb
    def clean!
      reject!(&:blank?)
      map!(&:to_s)
      map!(&:strip)
      # Ensure they are valid user handle
      valid_handles = User.where(handle: self).pluck(:handle)
      reject! { |handle| !valid_handles.include?(handle) }
      self
    end
  end

  def user_tag_list
    @user_tag_list ||= UserTagList.new(tagged_users.pluck(:handle))
  end

  def user_tag_list=(*assign_user_handles)
    @user_tag_list = UserTagList.new(assign_user_handles)
  end

  def reload(*args)
    @user_tag_list = nil
    super(*args)
  end

  private

  def assign_and_remove_user_tags
    if @user_tag_remove_user_ids.present?
      user_tags.where(user_id: @user_tag_remove_user_ids).delete_all
      after_remove_tagged_user_ids(@user_tag_remove_user_ids)
      @user_tag_remove_user_ids = nil
    end

    return if @user_tag_add_user_ids.blank?

    @user_tag_add_user_ids.each do |user_id|
      UserTag.create(
        record_id: id,
        record_type: self.class.base_class.name,
        user_id: user_id,
      )
    end

    # Reload so relationship isn't cached if assigning in-memory object instance
    tagged_users.reload if @user_tag_add_user_ids.present?

    # Set to nil so it is reloaded when accessed again,
    # so any invalid handles aren't preserved
    @user_tag_list = nil
    after_add_tagged_user_ids(@user_tag_add_user_ids)

    @user_tag_add_user_ids = nil
  end

  def after_remove_tagged_user_ids(user_ids)
    return unless submission? && parent_challenge.present?

    # Remove the challenge collection filter for these user(s)
    User.where(id: user_ids).each do |user|
      remove_challenge_reviewer(user)
    end
  end

  def after_add_tagged_user_ids(user_ids)
    # If a user is tagged on a submission within a challenge,
    # add them to the selectable collection filters if not already
    return unless submission? && parent_challenge.present?

    User.where(id: user_ids).each do |user|
      add_challenge_reviewer(user)
    end
  end
end
