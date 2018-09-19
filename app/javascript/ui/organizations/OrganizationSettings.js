import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import { Heading2 } from '~/ui/global/styled/typography'
import TagEditor from '~/ui/pages/shared/TagEditor'

@inject('apiStore', 'routingStore')
@observer
class OrganizationSettings extends React.Component {
  componentDidMount() {
    // kick out if you're not an org admin (i.e. primary_group admin)
    if (!this.organization.primary_group.can_edit) {
      this.props.routingStore.routeTo('homepage')
    }
  }

  get organization() {
    const { apiStore } = this.props
    return apiStore.currentUserOrganization
  }

  afterDomainWhitelistUpdate = () => {
    // need to reload in case updating the domains altered any group memberships
    const { apiStore } = this.props
    apiStore.loadCurrentUserGroups({ orgOnly: true })
  }

  render() {
    return (
      <div>
        <Heading2>Official Domains</Heading2>
        <p>
          Any new people added to {this.organization.name} without these email
          domains will be considered guests.
        </p>

        <TagEditor
          canEdit
          validate="domain"
          placeholder="Please enter domains with the following format: domain.com"
          record={this.organization}
          tagField="domain_whitelist"
          tagColor="white"
          afterSave={this.afterDomainWhitelistUpdate}
        />
      </div>
    )
  }
}

OrganizationSettings.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default OrganizationSettings
