import PropTypes from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import { FormSpacer, TextButton } from '~/ui/global/styled/forms'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import { Heading3, DisplayText } from '~/ui/global/styled/typography'
import ArchiveIcon from '~/ui/icons/ArchiveIcon'

const RemoveIconHolder = styled.button`
  width: 16px;
`

class OrganizationPeople extends React.PureComponent {
  render() {
    const { organization, userGroups } = this.props
    const primaryGroup = organization.primary_group
    const guestGroup = organization.guest_group
    return (
      <div>
        {organization.primary_group.currentUserCanEdit &&
          <Row>
            <RowItemRight>
              <TextButton onClick={this.props.onGroupAdd}>
                + New Group
              </TextButton>
            </RowItemRight>
          </Row>
        }
        <Heading3>
          Your Organization
        </Heading3>
        <Row>
          <button className="orgEdit" onClick={this.props.onGroupRoles(primaryGroup)}>
            <DisplayText>{ primaryGroup.name }</DisplayText>
          </button>
        </Row>
        <Row>
          <button className="orgEdit" onClick={this.props.onGroupRoles(guestGroup)}>
            <DisplayText>{ guestGroup.name }</DisplayText>
          </button>
        </Row>
        <FormSpacer />
        <Heading3>
          Your Groups
        </Heading3>
        { userGroups.map((group) =>
          (!group.is_primary &&
          <Row key={group.id}>
            <button
              className="groupEdit"
              onClick={this.props.onGroupRoles(group)}
            >
              <DisplayText>{group.name}</DisplayText>
            </button>
            { group.currentUserCanEdit &&
              <RemoveIconHolder onClick={this.props.onGroupRemove(group)}>
                <ArchiveIcon />
              </RemoveIconHolder>
            }
          </Row>))
        }
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
