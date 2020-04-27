import { Fragment } from 'react'
import { Label } from '~/ui/global/styled/forms'
// import RolesSummary from '~/ui/roles/RolesSummary'

// import UI store
// Maybe this one needs to be a class instead of a function component
// I don't know
const OrganizationRoles = () => {
  return (
    <Fragment>
      <Label
        style={{
          fontSize: '13px',
          marginTop: '28px',
        }}
        // id="content-version-select-label"
      >
        Organization Roles
      </Label>
      {/*
      <RolesSummary
      // roles={}
      // handleClick={}
      // canEdit={}
      // rolesMenuOpen={}
      />
       */}
      {/* TODO: add roles component */}
      {/* TODO: import people and groups modal & open when clicking + button */}
      {/* TODO: Is this actually reusable? Because it looks tied to the data */}
    </Fragment>
  )
}

export default OrganizationRoles
