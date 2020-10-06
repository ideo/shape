import styled from 'styled-components'
import { observable, runInAction, action } from 'mobx'
import { observer } from 'mobx-react'
import { v4 as uuidv4 } from 'uuid'
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
import TestComponent from './TestComponent'

const StyledIconWrapper = styled.span`
  margin-left: 8px;
  display: inline-block;
  vertical-align: middle;
  width: ${props => (props.width ? props.width : 10)}px;
`

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
        businessUnitsStore.fetch(),
        // This only works right now because I'm logged into C∆
        // The C∆ controller uses current_user
        orgModelInstance.fetch(),
      ])

      runInAction(() => {
        this.industrySubcategories = responses[0]
        this.contentVersions = responses[1]
        this.businessUnits = responses[2]
        this.organization = responses[3]
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

  @action
  setBusinessUnits(businessUnits) {
    this.businessUnits = businessUnits
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
      const businessUnitModelInstance = businessUnitsStore.build(values)
      const creatingBusinessUnit = businessUnitModelInstance.save(
        {},
        {
          optimistic: false,
        }
      )
      const result = await creatingBusinessUnit

      console.log('created BU: ', result)

      if (result) {
        console.log('new BU created: ', result)
        runInAction(() => {
          this.newBusinessUnitId = result.id
        })
      }
    } catch (err) {
      console.log('failed to create BU: ', err)
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
