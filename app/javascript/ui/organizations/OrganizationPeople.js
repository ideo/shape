import { Fragment } from 'react'
import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import EntityAvatarAndName from '~/ui/global/EntityAvatarAndName'
import ExpandableSearchInput from '~/ui/global/ExpandableSearchInput'
import { FormSpacer } from '~/ui/global/styled/forms'
import { GroupIconContainer } from '~/ui/groups/styles'
import { Row, RowItemRight } from '~/ui/global/styled/layout'
import {
  Heading3,
  DisplayText,
  SubduedText,
} from '~/ui/global/styled/typography'
import TextButton from '~/ui/global/TextButton'
import Tooltip from '~/ui/global/Tooltip'
import TrashIcon from '~/ui/icons/TrashIconXl'
import v from '~/utils/variables'

const RemoveIconHolder = styled.button`
  width: 16px;
`

const ResponsiveSearchPosition = styled.div`
  position: absolute;
  right: 40px;
  top: -40px;

  @media only screen and (max-width: ${v.responsive.medBreakpoint}px) {
    left: 0;
    right: auto;
    top: inherit;
    width: 100%;
  }
`

const ResponsiveScrollingModalList = styled.div``

const GroupRow = styled(Row)`
  ${RemoveIconHolder} {
    display: none;

    &:hover {
      display: block;
    }
  }
`

function fuzzySearch(items, query, propsToSearch) {
  const search = query.split(' ')
  return items.reduce((found, i) => {
    let matches = 0
    search.forEach(s => {
      let props = 0
      propsToSearch.forEach(prop => {
        if (i[prop].indexOf(s) > -1) {
          props++
        }
      })
      if (props >= 1) {
        matches++
      }
    })
    if (matches == search.length) {
      found.push(i)
    }
    return found
  }, [])
}

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
  @observable
  groupSearchTerm = ''

  onGroupSearch = term => {
    runInAction(() => {
      this.groupSearchTerm = term
    })
  }

  filterGroupsWithTerm() {
    const { userGroups } = this.props
    const groups = userGroups.filter(g => g.isNormalGroup)
    if (this.groupSearchTerm.length < 3) return groups
    const filteredGroups = fuzzySearch(groups, this.groupSearchTerm, [
      'name',
      'handle',
    ])
    return filteredGroups
  }

  renderUserGroups = () => {
    const groups = this.filterGroupsWithTerm()
    return (
      <div style={{ position: 'relative' }}>
        <ResponsiveSearchPosition>
          <ExpandableSearchInput
            onChange={this.onGroupSearch}
            onClear={() => runInAction(() => (this.groupSearchTerm = ''))}
            value={this.groupSearchTerm}
          />
        </ResponsiveSearchPosition>
        <ResponsiveScrollingModalList>
          {!groups.length ? (
            <SubduedText>You have not been added to any groups.</SubduedText>
          ) : (
            groups.map(group => (
              <GroupRow key={group.id}>
                <button
                  className="groupEdit"
                  onClick={this.props.onGroupRoles(group)}
                >
                  <EntityAvatarAndName entity={group} isJoinableGroup />
                </button>
                {group.can_edit && (
                  <RemoveIconHolder onClick={this.props.onGroupRemove(group)}>
                    <Tooltip
                      classes={{ tooltip: 'Tooltip' }}
                      title="delete group"
                    >
                      <TrashIcon />
                    </Tooltip>
                  </RemoveIconHolder>
                )}
              </GroupRow>
            ))
          )}
        </ResponsiveScrollingModalList>
      </div>
    )
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
