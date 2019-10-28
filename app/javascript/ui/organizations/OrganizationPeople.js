import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { TextButton } from '~/ui/global/styled/buttons'
import { FormSpacer } from '~/ui/global/styled/forms'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import {
  Heading3,
  DisplayText,
  SubduedText,
} from '~/ui/global/styled/typography'
import TrashIcon from '~/ui/icons/TrashIconXl'
import { GroupIconContainer } from '~/ui/groups/styles'

const RemoveIconHolder = styled.button`
  width: 16px;
`

const renderGroup = group => {
  return (
    <DisplayText>
      {group.name}
      {group.icon_url && (
        <GroupIconContainer>
          <img src={group.icon_url} />
        </GroupIconContainer>
      )}
    </DisplayText>
  )
}

@observer
class OrganizationPeople extends React.Component {
  renderUserGroups = () => {
    const { userGroups } = this.props
    const groups = userGroups.filter(g => g.isNormalGroup)
    if (!groups.length) {
      return <SubduedText>You have not been added to any groups.</SubduedText>
    }
    return groups.map(group => (
      <Row key={group.id}>
        <button className="groupEdit" onClick={this.props.onGroupRoles(group)}>
          {renderGroup(group)}
        </button>
        {group.can_edit && (
          <RemoveIconHolder onClick={this.props.onGroupRemove(group)}>
            <TrashIcon />
          </RemoveIconHolder>
        )}
      </Row>
    ))
  }

  renderYourOrganization() {
    const { organization, userGroups } = this.props
    const primaryGroup = organization.primary_group
    const guestGroup = organization.guest_group
    const adminGroup = organization.admin_group

    const orgMember = userGroups.indexOf(primaryGroup) > -1
    const showGuests = orgMember && guestGroup
    const showAdmins = orgMember && userGroups.indexOf(adminGroup) > -1

    return (
      <Fragment>
        <Heading3>Your Organization</Heading3>
        <Row>
          {orgMember && (
            <button
              className="orgEdit"
              onClick={this.props.onGroupRoles(primaryGroup)}
            >
              {renderGroup(primaryGroup)}
            </button>
          )}
          {!orgMember && renderGroup(primaryGroup)}
        </Row>
        {showGuests && (
          <Row>
            <button
              className="orgEdit"
              onClick={this.props.onGroupRoles(guestGroup)}
            >
              {renderGroup(guestGroup)}
            </button>
          </Row>
        )}
        {showAdmins && (
          <Row>
            <button
              className="orgEdit"
              onClick={this.props.onGroupRoles(adminGroup)}
            >
              {renderGroup(adminGroup)}
            </button>
          </Row>
        )}
      </Fragment>
    )
  }

  render() {
    return (
      <div>
        <Row>
          <RowItemRight>
            <TextButton onClick={this.props.onGroupAdd}>+ New Group</TextButton>
          </RowItemRight>
        </Row>
        {this.renderYourOrganization()}
        <FormSpacer />
        <Heading3>Your Groups</Heading3>
        {this.renderUserGroups()}
      </div>
    )
  }
}

OrganizationPeople.propTypes = {
  organization: MobxPropTypes.objectOrObservableObject.isRequired,
  userGroups: MobxPropTypes.arrayOrObservableArray.isRequired,
  onGroupAdd: PropTypes.func.isRequired,
  onGroupRemove: PropTypes.func.isRequired,
  onGroupRoles: PropTypes.func.isRequired,
}

export default OrganizationPeople
