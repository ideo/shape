module UserTaggable
  extend ActiveSupport::Concern

  included do
    has_many :user_tags, as: :record, dependent: :destroy
    has_many :tagged_users, through: :user_tags, source: :user
    after_create :assign_and_remove_user_tags
  end

  def user_tag_list
    tagged_users.pluck(:handle)
  end

  def user_tag_list=(assign_user_handles)
    if assign_user_handles.blank?
      # If they are clearing it out, remove all tagged users
      @user_tag_remove_user_ids = tagged_user_ids
    else
      assign_user_ids = User.where(handle: assign_user_handles).pluck(:id)
      @user_tag_remove_user_ids = []

      tagged_user_ids.each do |tagged_user_id|
        unless assign_user_ids.include?(tagged_user_id)
          @user_tag_remove_user_ids << tagged_user_id
        end
      end

      @user_tag_add_user_ids = assign_user_ids - tagged_user_ids

      # Assign and remove immediately, otherwise do in after_create
      assign_and_remove_user_tags if persisted?
    end
  end

  private

  def assign_and_remove_user_tags
    if @user_tag_remove_user_ids.present?
      user_tags.where(user_id: @user_tag_remove_user_ids).delete_all
    end

    return if @user_tag_add_user_ids.blank?

    @user_tag_add_user_ids.each do |user_id|
      user_tags.create(user_id: user_id)
    end
  end
end
