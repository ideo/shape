import PropTypes from 'prop-types'
// import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import Box from '~shared/components/atoms/Box'
import TeamsTab from './TeamsTab'
import OrganizationTab from './OrganizationTab'
import v from '~/utils/variables'
import {
  contentVersionsStore,
  industrySubcategoriesStore,
} from 'c-delta-organization-settings'
import { routingStore } from '~/stores'
import Loader from '~/ui/layout/Loader'
import { runInAction, observable, action } from 'mobx'
import { observer } from 'mobx-react'

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

@observer
class CreativeDifferenceTabs extends React.Component {
  @observable
  industrySubcategories = []
  @observable
  contentVersions = []
  @observable
  organization = {}
  @observable
  isLoading = false
  @observable
  isError = false
  @observable
  tabValue = ''

  constructor(props) {
    super(props)

    runInAction(() => {
      this.tabValue = props.tab || 'organization'
    })
  }

  async componentDidMount() {
    // fetch data here
    const responses = await Promise.all([
      industrySubcategoriesStore.fetch(),
      contentVersionsStore.fetch(),
    ])

    runInAction(() => {
      this.industrySubcategories = responses[0]
      this.contentVersions = responses[1]
    })
  }

  @action
  setTabValue(val) {
    this.tabValue = val
  }

  handleChange = (event, newValue) => {
    // event.preventDefault()
    console.log(event, newValue)
    this.setTabValue(newValue)
    routingStore.goToPath(`/org-settings/${newValue}`)
  }

  render() {
    const { orgName, tab } = this.props
    const {
      industrySubcategories,
      contentVersions,
      isError,
      isLoading,
      tabValue,
      handleChange,
    } = this
    return (
      <div
        style={{
          height: '1000px',
          // background:
          //   'url(https://www.startrek.com/sites/default/files/styles/content_full/public/images/2019-07/c82b013313066e0702d58dc70db033ca.jpg?itok=9-M5ggoe)',
        }}
      >
        {isError && <div>Something went wrong... </div>}
        {isLoading ? (
          <Loader />
        ) : (
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
              <OrganizationTab
                industrySubcategories={industrySubcategories}
                contentVersions={contentVersions}
              />
            </TabPanel>
            <TabPanel value={tabValue} tabName="teams">
              <TeamsTab industrySubcategories={industrySubcategories} />
            </TabPanel>
          </React.Fragment>
        )}
      </div>
    )
  }
}

CreativeDifferenceTabs.propTypes = {
  orgName: PropTypes.string,
  tab: PropTypes.oneOf(['teams', 'organization']),
}

export default CreativeDifferenceTabs
