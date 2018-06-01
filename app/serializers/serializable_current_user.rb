class SerializableCurrentUser < SerializableUser
  # adds some fields that only the current user should see for themself
  attributes :current_user_collection_id, :terms_accepted, :show_helper
  attribute :google_auth_token do
    # generate user login token for firebase
    GoogleAuthService.create_custom_token(@object.id)
  end
end
