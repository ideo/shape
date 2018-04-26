class GroupsRole < ApplicationRecord
  belongs_to :group
  belongs_to :role, touch: true

  amoeba do
    enable
    recognize []
  end
end
