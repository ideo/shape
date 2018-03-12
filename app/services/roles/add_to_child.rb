module Roles
  class AddToChild
    attr_reader :role

    def initialize(object:, parent_role:)
      @object = object
      @parent_role = parent_role
      @role = nil
    end

    def call
      @role = parent_role.amoeba_dup
      role.resource = object
      role.save
    end

    private

    attr_reader :object, :parent_role
  end
end
