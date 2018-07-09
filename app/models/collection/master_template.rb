class Collection
  class MasterTemplate < Collection
    def profile_template?
      organization.profile_template_id == id
    end
  end
end
