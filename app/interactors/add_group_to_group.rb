class AddGroupToGroup
  include Interactor::Organizer
  include Interactor::Schema

  schema :subgroup, :parent_group, :new_hierarchy

  # Maybe change GrantXAccessToY => RelateXToY
  organize(
    GrantParentAccessToSubgroup,
    GrantParentAccessToChildrenOfSubgroup,
  )
end
