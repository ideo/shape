import PropTypes from 'prop-types'

import TeamsTab from './TeamsTab'
import OrganizationTab from './OrganizationTab'

const CreativeDifferenceTabs = ({ tab }) => {
  const component = tab === 'teams' ? <TeamsTab /> : <OrganizationTab />
  return <div>{component}</div>
}

CreativeDifferenceTabs.propTypes = {
  tab: PropTypes.oneOf(['teams', 'organization']).isRequired,
}

export default CreativeDifferenceTabs
