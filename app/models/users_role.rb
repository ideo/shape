class UsersRole < ApplicationRecord
  belongs_to :user
  belongs_to :role, touch: true

  amoeba do
    enable
    recognize []
  end
end
