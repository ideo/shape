import PropTypes from 'prop-types'
import { useEffect } from 'react'
// import { organizationsStore } from 'c-delta-organization-settings'

import IndustrySubcategorySelectField from './IndustrySubcategory'
import ContentVersionSelectField from './ContentVersion'
import OrganizationRoles from './OrganizationRoles'
import Languages from './Languages'

const OrganizationTab = ({ organization, industrySubcategories }) => {
  // const [isLoading, setIsLoading] = useState(false)
  // const [isError, setIsError] = useState(false)

  useEffect(() => {}, [])

  return (
    <div>
      <form>
        <IndustrySubcategorySelectField
          organization={organization}
          industrySubcategories={industrySubcategories}
        />
        <ContentVersionSelectField organization={organization} />
        {/* TODO: How to populate OrganizationRoles? */}
        <OrganizationRoles />
        <Languages organization={organization} />
      </form>
    </div>
  )
}

OrganizationTab.propTypes = {
  organization: PropTypes.object,
  industrySubcategories: PropTypes.arrayOf(PropTypes.object),
}

export default OrganizationTab
