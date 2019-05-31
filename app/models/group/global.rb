class Group
  class Global < Group
    def common_resource?
      id == Shape::COMMON_RESOURCE_GROUP_ID
    end

    def primary?
      false
    end

    def guest?
      false
    end

    def admin?
      false
    end

    def org_group?
      false
    end

    def requires_org?
      false
    end
  end
end
