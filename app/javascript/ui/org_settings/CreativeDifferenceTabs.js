import PropTypes from 'prop-types'
// import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import Box from '~shared/components/atoms/Box'
// import TeamsTab from './TeamsTab'
// import OrganizationTab from './OrganizationTab'
import v from '~/utils/variables'
import {
  contentVersionsStore,
  industrySubcategoriesStore,
  organizationsStore,
  supportedLanguagesStore,
} from 'c-delta-organization-settings'
import Loader from '~/ui/layout/Loader'
import { runInAction, observable, action } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'
import DropdownSelect from './DropdownSelect'
import OrganizationRoles from './OrganizationRoles'
import Languages from './Languages'

function TabPanel(props) {
  const { children, value, tabName } = props

  return (
    <div
      style={{ background: v.colors.tabsBackground }}
      component="div"
      role="tabpanel"
      hidden={value !== tabName}
      id={`simple-tabpanel-${tabName}`}
      aria-labelledby={`simple-tab-${tabName}`}
    >
      {value === tabName && <Box p={3}>{children}</Box>}
    </div>
  )
}

TabPanel.propTypes = {
  children: PropTypes.node,
  tabName: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}
// TODO: Figure out how to get makeStyles to work
// const useStyles = makeStyles({
//   root: {
//     flexGrow: 1,
//     backgroundColor: v.colors.cDeltaBlue,
//   },
// })

@inject('apiStore', 'routingStore')
@observer
class CreativeDifferenceTabs extends React.Component {
  @observable
  industrySubcategories = []
  @observable
  contentVersions = []
  @observable
  organization = null
  @observable
  isLoading = false
  @observable
  isError = false
  @observable
  tabValue = ''
  @observable
  roles = []
  @observable
  supportedLanguages = []

  constructor(props) {
    super(props)

    runInAction(() => {
      this.tabValue = props.tab || 'organization'
    })

    props.apiStore.fetch(
      'groups',
      props.apiStore.currentUserOrganization.primary_group.id,
      true
    )
  }

  async componentDidMount() {
    const orgModel = new organizationsStore.model()
    const orgModelInstance = new orgModel({
      id: 4, // TODO: how to fetch actual id
    })
    // fetch data here
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
  }

  @action
  setTabValue(val) {
    this.tabValue = val
  }

  @action
  setLoading(value) {
    this.isLoading = value
  }

  @action
  setError(value) {
    this.isError = value
  }

  handleChange = (event, newValue) => {
    // event.preventDefault()
    console.log(event, newValue)
    this.setTabValue(newValue)
    this.props.routingStore.goToPath(`/org-settings/${newValue}`)
  }

  updateOrg = async orgParams => {
    try {
      this.setLoading(true)
      const orgModel = new organizationsStore.model()
      const orgModelInstance = new orgModel({
        id: this.organization.id,
      })
      const data = {
        organization: orgParams,
      }
      console.log('sending data for org: ', data)
      const promise = orgModelInstance.save(data, {
        optimistic: false,
      })
      const result = await promise
      runInAction(() => {
        this.organization = result
      })
      this.setLoading(false)
    } catch (err) {
      console.log('org update failed: ', err)
      this.setError(true)
    }
  }

  render() {
    const { orgName, tab, apiStore } = this.props
    const {
      industrySubcategories,
      contentVersions,
      supportedLanguages,
      organization,
      isError,
      isLoading,
      tabValue,
      handleChange,
      updateOrg,
    } = this

    console.log('C∆ Tabs render: ', organization, supportedLanguages)

    return (
      <div
        style={{
          height: '1200px',
          // background:
          //   'url(https://www.startrek.com/sites/default/files/styles/content_full/public/images/2019-07/c82b013313066e0702d58dc70db033ca.jpg?itok=9-M5ggoe)',
        }}
      >
        {isError && <div>Something went wrong... </div>}
        {isLoading ? <Loader /> : ''}
        <React.Fragment>
          <AppBar
            position="static"
            style={{
              flexGrow: 1,
              backgroundColor: v.colors.cDeltaBlue,
              color: v.colors.black,
            }}
          >
            <Tabs
              value={tab}
              onChange={handleChange}
              aria-label="simple tabs example"
            >
              {/* TODO: How to inject icon into this? CSS before content? */}
              {/* TODO: Change underline for selected tab from Material-UI default */}
              <Tab
                value={'organization'}
                label={`C∆ ${orgName} Settings`}
                {...a11yProps(0)}
              />
              <Tab
                value={'teams'}
                label={`C∆ ${orgName} Teams`}
                {...a11yProps(1)}
              />
            </Tabs>
          </AppBar>
          <TabPanel value={tabValue} tabName="organization">
            {organization && (
              <React.Fragment>
                <DropdownSelect
                  label={'Industry'}
                  record={organization}
                  options={industrySubcategories}
                  updateRecord={updateOrg}
                  fieldToUpdate={'industry_subcategory_id'}
                />
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
                <OrganizationRoles
                  roles={apiStore.currentUserOrganization.primary_group.roles}
                  canEdit={
                    apiStore.currentUserOrganization.primary_group.can_edit
                  }
                />
                <Languages
                  orgLanguages={organization.supported_languages}
                  supportedLanguages={supportedLanguages}
                  updateRecord={updateOrg}
                />
              </React.Fragment>
            )}
          </TabPanel>
          <TabPanel value={tabValue} tabName="teams">
            {/* <TeamsTab industrySubcategories={industrySubcategories} /> */}
          </TabPanel>
        </React.Fragment>
      </div>
    )
  }
}

CreativeDifferenceTabs.propTypes = {
  orgName: PropTypes.string,
  tab: PropTypes.oneOf(['teams', 'organization']),
}

CreativeDifferenceTabs.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  routingStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CreativeDifferenceTabs
