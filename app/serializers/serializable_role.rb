class SerializableRole < BaseJsonSerializer
  type 'roles'
  attributes :name

  has_many :users do
    data do
      if @user_ids
        @object.users.where(id: @user_ids)
      else
        @object
          .users
          .order(first_name: :asc, status: :asc)
          .limit(5)
      end
    end
  end

  has_many :groups do
    data do
      if @group_ids
        @object.groups.where(id: @group_ids)
      else
        @object.groups.limit(5)
      end
    end
  end

  belongs_to :resource
end
