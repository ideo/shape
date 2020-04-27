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
import {
  industrySubcategoriesStore,
  organizationsStore,
} from 'c-delta-organization-settings'
import { routingStore } from '~/stores'

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

// TODO: replace with JWT token data
// const organization = { name: 'IDEO', id: 4, industry_subcategory_id: null }
// TODO: replace orgName with org you fetch in this component
const CreativeDifferenceTabs = ({ orgName }) => {
  // const classes = useStyles()
  const [value, setValue] = useState('organization')
  // const [user, setUser] = useState({})
  const [organization, setOrganization] = useState({})
  const [subcategories, setSubcategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const handleChange = (event, newValue) => {
    // event.preventDefault()
    console.log(event, newValue)
    setValue(newValue)
    routingStore.goToPath(`/org-settings/${newValue}`)
  }

  useEffect(() => {
    const fetchJwtData = async () => {
      try {
        setIsLoading(true)
        const orgModel = new organizationsStore.model()
        const orgModelInstance = new orgModel({
          id: 4,
        })
        const promise = orgModelInstance.fetch()
        const result = await promise
        setOrganization(result)
        setIsLoading(false)
      } catch (err) {
        console.log('fetch org failed: ', err)
        setIsError(true)
        setIsLoading(false)
      }
      // const response = await someApiCall()
      // const orgInfo = decrypt(response).organization
      // setOrganization(orgInfo)
    }
    fetchJwtData()
  }, [])

  useEffect(() => {
    async function getIndustrySubcategories() {
      try {
        setIsLoading(true)
        const result = await industrySubcategoriesStore.fetch()
        console.log('subcategories fetch: ', result)
        setSubcategories(result)
        setIsLoading(false)
      } catch (err) {
        console.log('subcategory request failed')
        setIsError(err)
      }
    }

    getIndustrySubcategories()
  }, [])

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
          <TabPanel value={value} tabName="organization">
            <OrganizationTab
              organization={organization}
              industrySubcategories={subcategories}
            />
          </TabPanel>
          <TabPanel value={value} tabName="teams">
            <TeamsTab
              organization={organization}
              industrySubcategories={subcategories}
            />
          </TabPanel>
        </Fragment>
      )}
    </div>
  )
}

CreativeDifferenceTabs.propTypes = {
  orgName: PropTypes.string,
  tab: PropTypes.oneOf(['teams', 'organization']),
}

export default CreativeDifferenceTabs
