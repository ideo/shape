class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :rememberable, :validatable, :omniauthable,
         omniauth_providers: [:okta]

  def self.from_omniauth(email_address, auth)
    user = self.where(provider: auth.provider, uid: auth.uid).first

    unless user
      user = User.new
      user.password = Devise.friendly_token[0,40]
      user.password_confirmation = user.password
      user.provider = auth.provider
      user.uid = auth.uid
      user.email = email_address.downcase
    end
    return user
  end
end
