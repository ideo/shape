import PropTypes from 'prop-types'

// import { makeStyles } from '@material-ui/core/styles'
import AppBar from '@material-ui/core/AppBar'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'

import Box from '~shared/components/atoms/Box'
import TeamsTab from './TeamsTab'
import OrganizationTab from './OrganizationTab'
import v from '~/utils/variables'

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

const CreativeDifferenceTabs = () => {
  // const classes = useStyles()
  const [value, setValue] = React.useState(0)

  const handleChange = (event, newValue) => {
    setValue(newValue)
  }
  // TODO: Figure out how to get makeStyles to work
  return (
    <div>
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
          <Tab label="C∆ Org Settings" {...a11yProps(0)} />
          <Tab label="C∆ Teams" {...a11yProps(1)} />
        </Tabs>
      </AppBar>
      <TabPanel value={value} index={0}>
        <OrganizationTab />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <TeamsTab />
      </TabPanel>
    </div>
  )
}

export default CreativeDifferenceTabs
