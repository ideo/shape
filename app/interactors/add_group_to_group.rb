class AddGroupToGroup
  include Interactor::Organizer
  include Interactor::Schema

  schema :subgroup, :parent_group

  # Maybe change GrantXAccessToY => RelateXToY
  organize(
    GrantParentAccessToSubgroup,
    GrantParentAccessToChildrenOfSubgroup,
    GrantGrandparentsAccessToSubgroup,
  )
end
