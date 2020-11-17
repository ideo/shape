import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'

import { Row } from '~/ui/global/styled/layout'
import { TextField } from '~/ui/global/styled/forms'
import { DisplayText } from '~/ui/global/styled/typography'

import BusinessUnitActionMenu from './BusinessUnitActionMenu'
import SimpleUserSummary from './SimpleUserSummary'
import DropdownSelect from './DropdownSelect'
import Loader from '../layout/Loader'

@inject('apiStore', 'uiStore')
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

  updateBusinessUnit = async params => {
    console.log('updateBusinessUnit sending params: ', params)

    try {
      const result = await this.props.businessUnit.save(params, {
        optimistic: true,
      })

      console.log('result is: ', result)
      this.setBusinessUnitErrors(null)
      return result
    } catch (err) {
      console.log('error: ', err)
      this.setIsError(true)
      this.setBusinessUnitErrors(err.error)
    }
  }

  cloneBusinessUnit = async businessUnit => {
    this.props.cloneBusinessUnit(businessUnit)
  }

  removeBusinessUnit = async businessUnit => {
    this.props.removeBusinessUnit(businessUnit)
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
    if (e.key === 'Enter') {
      this.handleSaveBusinessUnit(businessUnit, {
        name: businessUnit.get('name'),
      })
    }
  }

  handleNameInputChange = (e, businessUnit) => {
    businessUnit.set({ name: e.target.value })
  }

  handleSaveBusinessUnit = businessUnit => {
    this.updateBusinessUnit({
      name: businessUnit.get('name'),
    })
    this.setIsEditingName(false)
  }

  openGroup = groupId => {
    this.props.uiStore.openGroup(groupId)
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
              updateRecord={params => updateBusinessUnit(params)}
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
              record={businessUnit.toJS()}
              options={contentVersions}
              updateRecord={params => updateBusinessUnit(params)}
              fieldToUpdate={'parent_content_version_id'}
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
              updateRecord={params => updateBusinessUnit(params)}
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
              width: '120px',
              marginTop: '-10px',
            }}
          >
            <SimpleUserSummary
              group={this.props.adminGroup}
              roleName={'admin'}
              handleClick={() => this.openGroup(this.props.adminGroup.id)}
            />
          </div>
          {/* Members */}
          <div
            style={{
              width: '120px',
              marginTop: '-10px',
            }}
          >
            <SimpleUserSummary
              group={this.props.memberGroup}
              roleName={'admin'}
              handleClick={() => this.openGroup(this.props.memberGroup.id)}
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
  cloneBusinessUnit: PropTypes.func,
  removeBusinessUnit: PropTypes.func,
  // updateBusinessUnit: PropTypes.func,
  // updateBusinessUnitDeployment: PropTypes.func,
  businessUnit: MobxPropTypes.objectOrObservableObject.isRequired,
  adminGroup: MobxPropTypes.objectOrObservableObject.isRequired,
  memberGroup: MobxPropTypes.objectOrObservableObject.isRequired,
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
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default BusinessUnitRow
