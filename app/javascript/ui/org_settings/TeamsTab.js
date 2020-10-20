import styled from 'styled-components'
import { observable, runInAction, action } from 'mobx'
import { inject, observer } from 'mobx-react'
import { v4 as uuidv4 } from 'uuid'
import _ from 'lodash'
import {
  businessUnitsStore,
  industrySubcategoriesStore,
  contentVersionsStore,
  organizationsStore,
} from './creativeDifferenceApis'

import v from '~/utils/variables'
import InfoIconXs from '~/ui/icons/InfoIconXs'

import BusinessUnitRow from './BusinessUnitRow'
import AddTeamButton from './AddTeamButton'
import BusinessUnitRowHeadings from './BusinessUnitRowHeadings'

const StyledIconWrapper = styled.span`
  margin-left: 8px;
  display: inline-block;
  vertical-align: middle;
  width: ${props => (props.width ? props.width : 10)}px;
`

@inject('apiStore', 'uiStore')
@observer
class TeamsTab extends React.Component {
  @observable
  isLoading = true
  @observable
  isError = null
  @observable
  businessUnits = []
  @observable
  newBusinessUnitId = null

  async componentDidMount() {
    // Can't use organizationsStore.fetch() because C∆ only exposes /organizations/:id route
    const orgModel = new organizationsStore.model()
    const orgModelInstance = new orgModel({
      id: 4,
    })
    // TODO: How do we reconcile Shape org ids vs C∆ org ids?
    // Does this come from apiStore.currentUserOrganization?

    try {
      this.setIsLoading(true)

      const responses = await Promise.all([
        industrySubcategoriesStore.fetch(),
        contentVersionsStore.fetch(),
        this.props.apiStore.fetchCreativeDifferenceGroups(),
        // businessUnitsStore.fetch(),
        // This only works right now because I'm logged into C∆
        // The C∆ controller uses current_user
        orgModelInstance.fetch(),
      ])

      runInAction(() => {
        this.industrySubcategories = responses[0]
        this.contentVersions = responses[1]
        this.businessUnitGroups = responses[2].data // for JSON API
        this.organization = responses[3]
        // extract BUs from Groups
        console.log('bu groups: ', this.businessUnitGroups)
        const businessUnits = _.map(this.businessUnitGroups, group => ({
          ...group.business_unit,
        }))
        const uniqueBUs = _.uniqBy(businessUnits, 'id')
        console.log(uniqueBUs)
        businessUnitsStore.set(uniqueBUs)
      })

      this.setIsLoading(false)
    } catch (error) {
      console.log('teams tab CDM error: ', error)
      this.setIsError(true)
    }
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
  setBusinessUnitErrors = err => {
    this.businessUnitErrors = err
  }

  initialNewTeamValues = () => {
    const {
      industry_subcategory_id,
      supported_languages,
      id,
    } = this.organization

    return {
      // name is set in backend
      organization_id: id,
      industry_subcategory_id,
      structure: 'Vertical',
      supported_languages,
    }
  }

  createBusinessUnit = async () => {
    const values = this.initialNewTeamValues()
    // TODO: how to show loader without causing rerender that makes componentDidMount fire?
    try {
      const result = await this.props.apiStore.createCreativeDifferenceGroup({
        business_unit: values,
      })

      const groups = result.data
      console.log('created result.data with BU data: ', groups)

      if (groups) {
        console.log('setting BU from groups: ', groups[0].business_unit.id)
        runInAction(() => {
          this.newBusinessUnitId = groups[0].business_unit.id
          businessUnitsStore.add([groups[0].business_unit])
          this.businessUnitGroups = this.businessUnitGroups.concat(groups)
        })
      }
    } catch (err) {
      console.log('failed to create BU and groups: ', err)
      this.setIsError(true)
      this.setBusinessUnitErrors(err.error)
    }
  }

  render() {
    const {
      isLoading,
      isError,
      businessUnitErrors,
      newBusinessUnitId,
      // businessUnits,
      contentVersions,
      industrySubcategories,
      createBusinessUnit,
    } = this
    console.log('rendering teams tab')

    return (
      <div>
        {isError && <div>Something went wrong...</div>}
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <React.Fragment>
            <div
              style={{
                color: v.colors.cDeltaBlue,
                marginBottom: '23px',
                marginTop: '20px',
              }}
            >
              {/* TODO: Use InfoIconXs with custom StyledIconWrapper; style the text  */}
              <StyledIconWrapper
                width={'16'}
                style={{
                  marginRight: '9px',
                }}
              >
                <InfoIconXs />
              </StyledIconWrapper>
              <span>
                In Creative Difference, a team is a group of individuals working
                together towards a common output.Examples of this are business
                units, segments, squads, etc.
              </span>
            </div>
            {/* Table Headers */}
            <BusinessUnitRowHeadings createBusinessUnit={createBusinessUnit} />
            {businessUnitsStore.map(businessUnit => (
              <BusinessUnitRow
                justCreated={newBusinessUnitId == businessUnit.id}
                key={uuidv4()}
                adminGroup={_.find(this.businessUnitGroups, {
                  external_id: `BusinessUnit_${businessUnit.id}_Admins`,
                })}
                memberGroup={_.find(this.businessUnitGroups, {
                  external_id: `BusinessUnit_${businessUnit.id}_Members`,
                })}
                businessUnit={businessUnit}
                contentVersions={contentVersions}
                industrySubcategories={industrySubcategories}
                businessUnitsStore={businessUnitsStore}
              />
            ))}
            <div>
              <AddTeamButton handleClick={createBusinessUnit} />
              <span
                style={{
                  color: 'red',
                }}
              >
                {businessUnitErrors}{' '}
              </span>
            </div>
          </React.Fragment>
        )}
      </div>
    )
  }
}

TeamsTab.propTypes = {}

export default TeamsTab
