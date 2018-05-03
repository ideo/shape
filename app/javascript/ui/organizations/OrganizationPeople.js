import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { FormSpacer, TextButton } from '~/ui/global/styled/forms'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import { Heading3, DisplayText, SubduedText } from '~/ui/global/styled/typography'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'

const RemoveIconHolder = styled.button`
  width: 16px;
`

class OrganizationPeople extends React.PureComponent {
  renderUserGroups = () => {
    const { userGroups } = this.props
    const groups = userGroups.filter(g => !g.isNormalGroup)
    if (!groups.length) {
      return (
        <SubduedText>You have not been added to any groups.</SubduedText>
      )
    }
    return userGroups.map(group => (
      <Row key={group.id}>
        <button
          className="groupEdit"
          onClick={this.props.onGroupRoles(group)}
        >
          <DisplayText>{group.name}</DisplayText>
        </button>
        { group.can_edit &&
          <RemoveIconHolder onClick={this.props.onGroupRemove(group)}>
            <ArchiveIcon />
          </RemoveIconHolder>
        }
      </Row>
    ))
  }

  renderYourOrganization() {
    const { organization, userGroups } = this.props
    const primaryGroup = organization.primary_group
    const guestGroup = organization.guest_group

    const orgMember = (userGroups.indexOf(primaryGroup) > -1)
    const showGuests = orgMember && !!guestGroup.groupRoles.length

    return (
      <Fragment>
        <Heading3>
          Your Organization
        </Heading3>
        <Row>
          { orgMember &&
            <button className="orgEdit" onClick={this.props.onGroupRoles(primaryGroup)}>
              <DisplayText>{ primaryGroup.name }</DisplayText>
            </button>
          }
          { !orgMember &&
            <DisplayText>{ primaryGroup.name }</DisplayText>
          }
        </Row>
        { showGuests &&
          <Row>
            <button className="orgEdit" onClick={this.props.onGroupRoles(guestGroup)}>
              <DisplayText>{ guestGroup.name }</DisplayText>
            </button>
          </Row>
        }
      </Fragment>
    )
  }

  render() {
    const { organization } = this.props
    return (
      <div>
        {organization.primary_group.can_edit &&
          <Row>
            <RowItemRight>
              <TextButton onClick={this.props.onGroupAdd}>
                + New Group
              </TextButton>
            </RowItemRight>
          </Row>
        }
        {this.renderYourOrganization()}
        <FormSpacer />
        <Heading3>
          Your Groups
        </Heading3>
        { this.renderUserGroups() }
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
