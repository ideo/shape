# extends our default SerializableUser
class SerializableCurrentUser < SerializableUser
  # adds some fields that only the current user should see for themself
  attributes :terms_accepted, :notify_through_email,
             :show_helper, :show_move_helper, :show_template_helper,
             :mailing_list

  attribute :google_auth_token do
    # generate user login token for firebase
    GoogleAuthService.create_custom_token(@object.id)
  end

  attribute :current_user_collection_id do
    @object.current_user_collection_id.to_s
  end
end
