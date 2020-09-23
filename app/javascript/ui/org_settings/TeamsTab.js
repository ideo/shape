import styled from 'styled-components'
import { observable, runInAction, action } from 'mobx'
import { observer } from 'mobx-react'
import {
  businessUnitsStore,
  industrySubcategoriesStore,
  contentVersionsStore,
} from 'c-delta-organization-settings'

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

@observer
class TeamsTab extends React.Component {
  @observable
  isLoading = null
  @observable
  isError = null
  @observable
  businessUnits = []

  // constructor(props) {
  //   super(props)
  // }

  async componentDidMount() {
    try {
      this.setIsLoading(true)

      const responses = await Promise.all([
        industrySubcategoriesStore.fetch(),
        contentVersionsStore.fetch(),
        businessUnitsStore.fetch(),
      ])

      runInAction(() => {
        this.industrySubcategories = responses[0]
        this.contentVersions = responses[1]
        this.businessUnits = responses[2]
      })
      this.setIsLoading(false)
    } catch (error) {
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
  setBusinessUnits(businessUnits) {
    this.businessUnits = businessUnits
  }

  refreshBusinessUnits = async () => {
    try {
      const results = await businessUnitsStore.fetch()
      this.setBusinessUnits(results)
      if (this.focusNameInputForNewTeam) {
        this.focusOnNameInput()
      }
    } catch (err) {}
  }

  initialNewTeamValues = () => {
    const {
      industry_subcategory_id,
      supported_languages,
      id,
    } = this.organization

    // Content version handled after create in backend
    // TODO: How to assert it is the correct one coming back?
    return {
      name: `Team ${this.businessUnits.length + 1}`,
      // TODO: causes issues when deleting records, since soft archive means they are still around
      organization_id: id,
      industry_subcategory_id,
      structure: 'Vertical',
      supported_languages,
    }
  }

  createBusinessUnit = async () => {
    const values = this.initialNewTeamValues()
    const businessUnitParams = {
      business_unit: values,
    }
    const foo = businessUnitsStore
    const businessUnitModelInstance = foo.build(values)
    businessUnitModelInstance.set({
      id: null,
    })

    try {
      const creatingBusinessUnit = businessUnitModelInstance.save(
        businessUnitParams,
        {
          optimistic: false,
        }
      )
      const result = await creatingBusinessUnit
      if (result) {
        this.setEditingBusinessUnitId(result.id)
        this.setEditingBusinessUnitName(result.name)
        this.refreshBusinessUnits()
        this.setFocusNameInputForNewTeam(true)
        // TODO: Just update one BU so we don't have to refetch all the BUs?
      }
    } catch (err) {
      this.setError(true)
      this.setBusinessUnitErrors(err.error)
    }
  }

  render() {
    const { isLoading, isError, businessUnits, createBusinessUnit } = this

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
            {businessUnits.map(businessUnit => (
              <BusinessUnitRow
                businessUnit={businessUnit}
                // updateBusinessUnit={updateBusinessUnit}
                // cloneBusinessUnit={this.cloneBusinessUnit}
                // removeBusinessUnit={this.removeBusinessUnit}
              />
            ))}
            <div>
              <AddTeamButton handleClick={createBusinessUnit} />
            </div>
          </React.Fragment>
        )}
      </div>
    )
  }
}

TeamsTab.propTypes = {}

export default TeamsTab
