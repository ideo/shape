# extends our default SerializableUser
class SerializableCurrentUser < SerializableUser
  # adds some fields that only the current user should see for themself
  attributes :terms_accepted, :notify_through_email,
             :show_helper, :show_move_helper, :show_template_helper,
             :mailing_list, :feedback_contact_preference,
             :feedback_terms_accepted, :respondent_terms_accepted,
             :current_org_terms_accepted, :locale, :use_template_setting

  has_many :most_used_templates do
    data do
      Collection.where(id: @object.cached_last_5_used_template_ids)
    end
  end

  attribute :is_current_user do
    true
  end

  attribute :google_auth_token do
    # generate user login token for firebase
    GoogleAuthService.create_custom_token(@object.id)
  end

  attribute :current_user_collection_id do
    @object.current_user_collection_id.to_s
  end

  attribute :is_super_admin do
    @current_user ? @current_user.super_admin? : false
  end

  attribute :current_incentive_balance do
    @object.incentive_owed_account_balance.to_f
  end

  attribute :incentive_due_date do
    @object.incentive_due_date&.strftime('%m/%d/%y')
  end
end
