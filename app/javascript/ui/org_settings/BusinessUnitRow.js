import { Row } from '~/ui/global/styled/layout'
import { TextField } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'

import BusinessUnitActionMenu from './BusinessUnitActionMenu'
import { action, observable, runInAction } from 'mobx'
import {
  observer,
  inject,
  PropTypes as MobxPropTypes,
  PropTypes,
} from 'mobx-react'
import OrganizationRoles from './SimpleUserSummary'
import DropdownSelect from './DropdownSelect'
import Loader from '../layout/Loader'

// TODO: maybe just pass in currentUserOrganization.primary_group as prop?
@inject('apiStore')
@observer
class BusinessUnitRow extends React.Component {
  @observable
  isLoading = null
  @observable
  isError = null
  @observable
  businessUnit = null
  @observable
  businessUnitErrors = null
  @observable
  isEditingName = null

  constructor(props) {
    super(props)

    this.textInput = null

    props.apiStore.fetch(
      'groups',
      props.apiStore.currentUserOrganization.primary_group.id,
      true
    )
  }

  componentDidMount() {
    if (this.props.justCreated) {
      this.editBusinessUnitName(this.props.businessUnit)
    }
  }

  @action
  setIsLoading = value => {
    this.isLoading = value
  }

  @action
  setIsError = value => {
    this.isError = value
  }

  @action
  setIsEditingName = value => {
    this.isEditingName = value
  }

  @action
  setBusinessUnitErrors = err => {
    this.businessUnitErrors = err
  }

  updateBusinessUnit = async (businessUnit, params) => {
    console.log('in update business unit, ', businessUnit)

    this.setIsLoading(true)

    console.log('sending params: ', params)

    try {
      const result = await businessUnit.save(params, {
        optimistic: true,
      })

      console.log('result is: ', result)
      this.setBusinessUnitErrors(null)
      this.setIsLoading(false)
      return result
    } catch (err) {
      console.log('error: ', err)
      this.setIsError(true)
      this.setBusinessUnitErrors(err.error)
    }
  }

  cloneBusinessUnit = async businessUnit => {
    try {
      this.setIsLoading(true)
      // // const model = new this.props.BusinessUnitsStore
      // const modelInstance = new businessUnit({
      //   id: businessUnit.id,
      // })

      const promise = businessUnit.rpc('clone', {
        optimistic: false,
      })
      const result = await promise
      this.refreshBusinessUnits() // Should we pass this function in from Teams Tab?
      this.setIsLoading(false)
      return result
    } catch (err) {}
  }

  removeBusinessUnit = async businessUnit => {
    try {
      this.setIsLoading(true)
      // const model = businessUnitsStore.model()
      // const modelInstance = new model({
      //   id: businessUnit.id,
      // })

      const promise = businessUnit.destroy({
        optimistic: false,
      })
      const result = await promise
      console.log('destroyed: ', result)
      this.setIsLoading(false)
      return result
    } catch (err) {
      console.log('err destroying BU: ', err)
    }
  }

  setTextInputRef = element => {
    this.textInput = element
  }

  focusOnNameInput = () => {
    if (this.textInput) this.textInput.focus()
  }

  selectNameInput = () => {
    if (this.textInput) this.textInput.select()
  }

  editBusinessUnitName = businessUnit => {
    console.log('clicked rename')
    this.setIsEditingName(true)
    this.focusOnNameInput()
    // Had to do this hack so that the select would work -- before it only focused
    setTimeout(() => this.selectNameInput(), 10)
  }

  handleNameInputKeyPress = (e, businessUnit) => {
    console.log('handleNameInputKeyPress:', e)
    console.log(businessUnit.get('name'))
    if (e.key === 'Enter') {
      this.handleSaveBusinessUnit(businessUnit, {
        name: businessUnit.get('name'),
      })
    }
  }

  handleNameInputChange = (e, businessUnit) => {
    console.log('setting name to: ', e.target.value)
    businessUnit.set({ name: e.target.value })
  }

  handleSaveBusinessUnit = businessUnit => {
    console.log('saving BU: ', businessUnit)
    this.updateBusinessUnit(businessUnit, {
      name: businessUnit.get('name'),
    })
    this.setIsEditingName(false)
  }

  render() {
    const {
      isEditingName,
      businessUnitErrors,
      handleNameInputKeyPress,
      handleNameInputChange,
      handleSaveBusinessUnit,
      updateBusinessUnit,
    } = this

    const { businessUnit, industrySubcategories, contentVersions } = this.props

    console.log('render BU: ', businessUnit)

    if (this.isLoading) return <Loader />

    return (
      <Row>
        <form
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              width: '170px',
              marginRight: '20px',
            }}
          >
            {isEditingName ? (
              <React.Fragment>
                <TextField
                  style={{
                    width: 'inherit',
                  }}
                  ref={this.setTextInputRef}
                  value={businessUnit.get('name')} // TODO: May need to make this a separate component to handle updating value
                  onChange={e => handleNameInputChange(e, businessUnit)}
                  onBlur={e => handleSaveBusinessUnit(businessUnit)}
                  onKeyPress={e => handleNameInputKeyPress(e, businessUnit)}
                />
                <span
                  style={{
                    color: 'red',
                  }}
                >
                  {businessUnitErrors}
                </span>
              </React.Fragment>
            ) : (
              <DisplayText> {businessUnit.get('name')} </DisplayText>
            )}
          </div>
          <div
            style={{
              marginRight: '20px',
            }}
          >
            <DropdownSelect
              label={'Industry'}
              record={businessUnit.toJS()}
              options={industrySubcategories}
              updateRecord={params => updateBusinessUnit(businessUnit, params)}
              fieldToUpdate={'industry_subcategory_id'}
            />
          </div>
          <div
            style={{
              marginRight: '20px',
            }}
          >
            <DropdownSelect
              label={'Content Version'}
              toolTip={
                'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
              }
              objectToUpdateName={businessUnit.get('name')}
              record={businessUnit.get('closest_business_unit_deployment')}
              options={contentVersions}
              updateRecord={
                params => {
                  throw new Error(
                    'IMPLEMENT NEW ROUTE FOR BU TO UPDATE PARENT CV'
                  )
                }
                // updateBusinessUnitDeployment(
                //   businessUnit.get('closest_business_unit_deployment'),
                //   params
                // )
              }
              fieldToUpdate={'content_version_id'}
            />
          </div>
          <div
            style={{
              marginRight: '20px',
            }}
          >
            <DropdownSelect
              label={'Structure'}
              toolTip={
                "Select 'Vertical' for any market-facing team or organizational unit. Select 'Horizontal' for any internally-facing teams, departments, or other organizational groups."
              }
              record={businessUnit.toJS()}
              options={[
                {
                  name: 'Vertical',
                  id: 'Vertical',
                },
                {
                  name: 'Horizontal',
                  id: 'Horizontal',
                },
              ]}
              updateRecord={params => updateBusinessUnit(businessUnit, params)}
              fieldToUpdate={'structure'}
            />
          </div>
          <div
            style={{
              width: '42px',
              marginTop: '2px',
            }}
          >
            <BusinessUnitActionMenu
              name={businessUnit.get('name')}
              handleClone={() => this.cloneBusinessUnit(businessUnit)}
              handleRemove={() => this.removeBusinessUnit(businessUnit)}
              handleRename={() => this.editBusinessUnitName(businessUnit)}
            />
          </div>
          {/* Admins */}
          <div
            style={{
              width: '80px',
              marginTop: '-10px',
            }}
          >
            <OrganizationRoles
              roles={
                this.props.apiStore.currentUserOrganization.primary_group.roles
              }
              canEdit={
                this.props.apiStore.currentUserOrganization.primary_group
                  .can_edit
              }
            />
          </div>
          {/* Members */}
          <div
            style={{
              width: '80px',
              marginTop: '-10px',
            }}
          >
            <OrganizationRoles
              roles={
                this.props.apiStore.currentUserOrganization.primary_group.roles
              }
              canEdit={
                this.props.apiStore.currentUserOrganization.primary_group
                  .can_edit
              }
            />
          </div>
        </form>
      </Row>
    )
  }
}

BusinessUnitRow.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

BusinessUnitRow.defaultProps = {
  businessUnit: {},
  contentVersions: [],
  industrySubcategories: [],
  // supportedLanguages: [],
}

BusinessUnitRow.propTypes = {
  // TODO: Add other event handler functions
  // updateBusinessUnit: PropTypes.func,
  // updateBusinessUnitDeployment: PropTypes.func,
  businessUnit: MobxPropTypes.objectOrObservableObject.isRequired,
  contentVersions: MobxPropTypes.arrayOrObservableArray(
    MobxPropTypes.objectOrObservableObject
  ),
  industrySubcategories: MobxPropTypes.arrayOrObservableArray(
    MobxPropTypes.objectOrObservableObject
  ),
  justCreated: PropTypes.bool,
  // supportedLanguages: MobxPropTypes.arrayOrObservableArray(
  //   MobxPropTypes.objectOrObservableObject
  // ),
}

BusinessUnitRow.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BusinessUnitRow
