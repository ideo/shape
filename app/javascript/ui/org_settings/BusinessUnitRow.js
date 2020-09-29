import { Row } from '~/ui/global/styled/layout'
import { TextField } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'

import BusinessUnitActionMenu from './BusinessUnitActionMenu'
import { action, observable, runInAction } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import OrganizationRoles from './OrganizationRoles'
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
  businessUnitErrors = null
  @observable
  isEditingName = null
  @observable
  businessUnit = null
  @observable
  editableNameValue = null

  constructor(props) {
    super(props)

    runInAction(() => {
      // this.isEditingName = props.editingBusinessUnitName
    })

    props.apiStore.fetch(
      'groups',
      props.apiStore.currentUserOrganization.primary_group.id,
      true
    )
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
  setBusinessUnitErrors = err => {
    this.businessUnitErrors = err
  }

  @action
  setBusinessUnit = record => {
    this.businessUnit = record
  }

  updateBusinessUnit = async (businessUnit, params) => {
    console.log('in update business unit, ', businessUnit)

    this.setIsLoading(true)

    // const data = {
    //   business_unit: params,
    // }
    console.log('sending params: ', params)

    try {
      const result = await businessUnit.save(params, {
        optimistic: true,
      })

      this.setBusinessUnitErrors(null)
      // Need to check that the result has been properly updated record
      console.log('result is: ', result)
      // this.setBusinessUnit(result)
      console.log('mobx object', businessUnit.toJS())

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
      // const model = new this.props.BusinessUnitsStore
      const modelInstance = new model({
        id: businessUnit.id,
      })

      const promise = modelInstance.rpc('clone', {
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
      const model = new this.props.BusinessUnitsStore()
      const modelInstance = new model({
        id: businessUnit.id,
      })

      const promise = modelInstance.destroy({
        optimistic: false,
      })
      const result = await promise
      this.refreshBusinessUnits()
      this.setIsLoading(false)
      return result
    } catch (err) {}
  }

  updateBusinessUnitDeployment = async (businessUnitDeployment, params) => {
    const model = this.props.businessUnitDeploymentsStore.model()
    const modelInstance = new model({
      id: businessUnitDeployment.id,
    })
    const data = {
      business_unit_deployment: params,
    }
    try {
      const promise = modelInstance.save(data, {
        optimistic: false,
      })
      const result = await promise
      if (result) {
        this.refreshBusinessUnits()
      }
    } catch (err) {}
  }

  handleNameInputKeyPress = businessUnit => {
    if (event.key === 'Enter') {
      this.handleSaveBusinessUnit(businessUnit, {
        name: this.editingBusinessUnitName,
      })
    }
  }

  handleNameInputChange = e => {
    this.setEditingBusinessUnitName(e.target.value)
  }

  handleSaveBusinessUnit = businessUnit => {
    this.updateBusinessUnit(businessUnit, {
      name: this.editingBusinessUnitName,
    })
  }

  render() {
    const {
      isEditingName,
      editableNameValue,
      businessUnitErrors,
      handleNameInputKeyPress,
      handleNameInputChange,
      handleSaveBusinessUnit,
      // TODO: finish converting these to work inside of BU row instead of teams tab
      // cloneBusinessUnit,
      // removeBusinessUnit,
      updateBusinessUnit,
      updateBusinessUnitDeployment,
    } = this

    const { businessUnit, industrySubcategories, contentVersions } = this.props
    console.log('rendering business unit:', businessUnit)

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
                  autoFocus
                  // onFocus={() => this.focusOnNameInput()} // TODO: use a ref
                  id={'new-team-name'}
                  value={editableNameValue} // TODO: May need to make this a separate component to handle updating value
                  onChange={handleNameInputChange}
                  onBlur={e => handleSaveBusinessUnit(businessUnit)}
                  onKeyPress={e => handleNameInputKeyPress(businessUnit)}
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
            {/*
                                  TODO: this updates a BU Deployment, not the BU itself
                                  - It should probably accept the BU Deployment as the record
                                  - and use content_version_id as the fieldToUpdate
                                */}
            {/* <DropdownSelect
              label={'Content Version'}
              toolTip={
                'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
              }
              objectToUpdateName={businessUnit.get('name')}
              record={businessUnit.get('closest_business_unit_deployment')}
              options={contentVersions}
              updateRecord={params =>
                updateBusinessUnitDeployment(
                  businessUnit.get('closest_business_unit_deployment'),
                  params
                )
              }
              fieldToUpdate={'content_version_id'}
            /> */}
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
              handleRename={() => {
                this.setEditingBusinessUnitName(businessUnit.get('name'))
                this.setEditingBusinessUnitId(businessUnit.get('id'))
              }}
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
  // supportedLanguages: MobxPropTypes.arrayOrObservableArray(
  //   MobxPropTypes.objectOrObservableObject
  // ),
}

export default BusinessUnitRow
