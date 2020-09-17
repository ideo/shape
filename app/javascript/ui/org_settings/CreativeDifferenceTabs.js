import PropTypes from 'prop-types'
// import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import Box from '~shared/components/atoms/Box'
import TeamsTab from './TeamsTab'
import OrganizationTab from './OrganizationTab'
import v from '~/utils/variables'
import Loader from '~/ui/layout/Loader'
import { runInAction, observable, action } from 'mobx'
import { observer, inject, PropTypes as MobxPropTypes } from 'mobx-react'

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
  children: PropTypes.node.isRequired,
  tabName: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
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
  tabValue = ''
  @observable
  roles = []

  constructor(props) {
    super(props)

    runInAction(() => {
      this.tabValue = props.tab || 'organization'
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
    this.setTabValue(newValue)
    this.props.routingStore.goToPath(`/org-settings/${newValue}`)
  }

  render() {
    const { orgName, tab } = this.props
    const { isError, isLoading, tabValue, handleChange } = this

    return (
      <div>
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
            <OrganizationTab />
          </TabPanel>
          <TabPanel value={tabValue} tabName="teams">
            <TeamsTab />
          </TabPanel>
        </React.Fragment>
      </div>
    )
  }
}

CreativeDifferenceTabs.defaultProps = {
  orgName: 'Org Name', // TODO: should these just be required?
  tab: 'organization',
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
