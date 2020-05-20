class RequestApiToken
  def initialize(user)
    @user = user
    # what about token?
  end

  def call
    # ping C∆ for user
  end

  def invalidate_token
    # remove token for user
  end
end
