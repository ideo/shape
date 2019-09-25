class AddGroupToGroup
  include Interactor::Organizer
  include Interactor::Schema

  schema :subgroup, :parent_group, :new_hierarchy

  organize(
    GrantParentAccessToSubgroup,
    GrantParentAccessToChildrenOfSubgroup,
  )
end
