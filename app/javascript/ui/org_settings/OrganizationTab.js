// import PropTypes from 'prop-types'
import { action, observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import {
  organizationsStore,
  supportedLanguagesStore,
  contentVersionsStore,
  industrySubcategoriesStore,
} from 'c-delta-organization-settings'

import DropdownSelect from './DropdownSelect'
import OrganizationRoles from './OrganizationRoles'
import Languages from './Languages'
import Loader from '~/ui/layout/Loader'
import { apiStore } from '~/stores'
import { Label } from '../global/styled/forms'
import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'

@observer
class OrganizationTab extends React.Component {
  @observable
  isLoading = true
  @observable
  isError = null
  @observable
  organization = null
  @observable
  industrySubcategories = null
  @observable
  contentVersions = null
  @observable
  supportedLanguages = null

  constructor(props) {
    super(props)
  }

  async componentDidMount() {
    this.setIsLoading(true)

    const orgModel = new organizationsStore.model()
    const orgModelInstance = new orgModel({
      id: 4, // TODO: how to fetch actual id
      // Does this come from apiStore.currentUserOrganization?
    })

    try {
      const responses = await Promise.all([
        industrySubcategoriesStore.fetch(),
        contentVersionsStore.fetch(),
        orgModelInstance.fetch(),
        supportedLanguagesStore.fetch(),
      ])

      runInAction(() => {
        this.industrySubcategories = responses[0]
        this.contentVersions = responses[1]
        this.organization = responses[2]
        this.supportedLanguages = responses[3]
      })

      this.setIsLoading(false)
    } catch (error) {
      this.setIsError(true)
    }
  }

  hasLoadedAllRequests() {
    return [
      this.organization,
      this.industrySubcategories,
      this.contentVersions,
      this.supportedLanguages,
    ].every(observableValue => !null)
  }

  @action
  setIsLoading(value) {
    this.isLoading = value
  }

  @action
  setIsError(value) {
    this.isError = value
  }

  @action
  setOrganization(record) {
    this.organization = record
  }

  updateOrg = async orgParams => {
    try {
      const orgModel = new organizationsStore.model()
      const orgModelInstance = new orgModel({
        id: this.organization.id,
      })
      const data = {
        organization: orgParams,
      }
      const promise = orgModelInstance.save(data, {
        optimistic: false,
      })
      const result = await promise
      this.setOrganization(result)
    } catch (err) {
      this.setIsError(true)
    }
  }

  render() {
    const {
      isLoading,
      isError,
      organization,
      industrySubcategories,
      contentVersions,
      supportedLanguages,
      updateOrg,
    } = this
    console.table(
      isLoading,
      organization,
      industrySubcategories,
      contentVersions,
      supportedLanguages
    )

    return (
      <div
        style={{
          width: '500px',
        }}
      >
        {isError && <div> Something went wrong... </div>}{' '}
        {isLoading ? (
          <Loader />
        ) : (
          <React.Fragment>
            <Label
              style={{
                fontSize: '13px',
                marginBottom: '11px',
                marginTop: '24px',
                width: '170px',
              }}
            >
              Industry
            </Label>
            <DropdownSelect
              label={'Industry'}
              record={organization}
              options={industrySubcategories}
              updateRecord={updateOrg}
              fieldToUpdate={'industry_subcategory_id'}
            />
            <Label
              style={{
                fontSize: '13px',
                marginBottom: '11px',
                marginTop: '24px',
                width: '170px',
              }}
            >
              Content Version
              <HoverableDescriptionIcon
                description={
                  'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
                }
                width={16}
              ></HoverableDescriptionIcon>
            </Label>
            <DropdownSelect
              label={'Content Version'}
              toolTip={
                'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
              }
              record={organization}
              options={contentVersions}
              updateRecord={updateOrg}
              fieldToUpdate={'default_content_version_id'}
            />
            <Label
              style={{
                fontSize: '13px',
                marginBottom: '11px',
                marginTop: '24px',
                width: '170px',
              }}
            >
              Organization Administrators
            </Label>
            <OrganizationRoles
              roles={apiStore.currentUserOrganization.primary_group.roles}
              canEdit={apiStore.currentUserOrganization.primary_group.can_edit}
            />
            <Label
              style={{
                fontSize: '13px',
                marginBottom: '11px',
                marginTop: '24px',
                width: '170px',
              }}
            >
              Organization Members
            </Label>
            {/* TODO: Need to figure out admins/members vs viewers/editors */}
            <OrganizationRoles
              roles={apiStore.currentUserOrganization.primary_group.roles}
              canEdit={apiStore.currentUserOrganization.primary_group.can_edit}
            />
            <Languages
              orgLanguages={organization.supported_languages}
              supportedLanguages={supportedLanguages}
              updateRecord={updateOrg}
            />
            {/* <Label
              style={{
                fontSize: '13px',
                marginBottom: '11px',
                marginTop: '24px',
                width: '170px',
              }}
            >
              Onboarding Message
              <HoverableDescriptionIcon
                description={'TBD'}
                width={16}
              ></HoverableDescriptionIcon>
            </Label> */}
          </React.Fragment>
        )}
      </div>
    )
  }
}

// THIS DOES NOT TAKE PROPS
// OrganizationTab.defaultProps = {
//   organization: {
//     supported_languages: [],
//   },
//   contentVersions: [],
//   industrySubcategories: [],
//   supportedLanguages: [],
// }
// OrganizationTab.propTypes = {
//   organization: PropTypes.object,
//   contentVersions: PropTypes.arrayOf(PropTypes.object),
//   industrySubcategories: PropTypes.arrayOf(PropTypes.object),
//   supportedLanguages: PropTypes.arrayOf(PropTypes.object),
//   // TODO: load all groups and roles for organization
//   // http://localhost:3001/api/v1/organizations/1/groups
// }

export default OrganizationTab
