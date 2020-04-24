import PropTypes from 'prop-types'
import { Fragment, useState, useEffect } from 'react'
// import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import Box from '~shared/components/atoms/Box'
import TeamsTab from './TeamsTab'
import OrganizationTab from './OrganizationTab'
import v from '~/utils/variables'
import { usersStore } from 'c-delta-organization-settings'

function TabPanel(props) {
  const { children, value, index } = props

  return (
    <div
      style={{ background: v.colors.tabsBackground }}
      component="div"
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  )
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.any.isRequired,
  value: PropTypes.any.isRequired,
}

function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  }
}

// const useStyles = makeStyles({
//   root: {
//     flexGrow: 1,
//     backgroundColor: v.colors.cDeltaBlue,
//   },
// })

const CreativeDifferenceTabs = ({ orgName }) => {
  // const classes = useStyles()
  const [value, setValue] = useState(0)
  const [user, setUser] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }

  useEffect(() => {
    const getCDeltaUser = async () => {
      const userModel = new usersStore.model()
      const userModelInstance = new userModel()
      userModelInstance.set({
        id: 'me',
      })
      console.log(userModelInstance)
      try {
        setIsLoading(true)
        const response = await userModelInstance.fetch()
        setUser(response)
        setIsLoading(false)
      } catch (err) {
        console.log('user request failed: ', err)
        setIsError(true)
      }
    }

    getCDeltaUser()
  }, [])
  // TODO: Figure out how to get makeStyles to work

  return (
    <div>
      {isError && <div>Something went wrong... </div>}
      {isLoading ? (
        <div>Loading... </div>
      ) : (
        <Fragment>
          <AppBar
            position="static"
            style={{
              flexGrow: 1,
              backgroundColor: v.colors.cDeltaBlue,
              color: v.colors.black,
            }}
          >
            <Tabs
              value={value}
              onChange={handleChange}
              aria-label="simple tabs example"
            >
              {/* TODO: How to inject icon into this? CSS before content? */}
              {/* TODO: Change underline for selected tab from Material-UI default */}
              <Tab label={`C∆ ${orgName} Settings`} {...a11yProps(0)} />
              <Tab label={`C∆ ${orgName} Teams`} {...a11yProps(1)} />
            </Tabs>
          </AppBar>
          <TabPanel value={value} index={0}>
            <OrganizationTab orgId={user.organization_id} />
          </TabPanel>
          <TabPanel value={value} index={1}>
            <TeamsTab />
          </TabPanel>
        </Fragment>
      )}
    </div>
  )
}

CreativeDifferenceTabs.propTypes = {
  orgName: PropTypes.string,
}

export default CreativeDifferenceTabs
