import PropTypes from 'prop-types'
import { useState, useEffect, Fragment } from 'react'

import { businessUnitsStore } from 'c-delta-organization-settings'
import { Row } from '../global/styled/layout'
import IndustrySubcategorySelectField from './IndustrySubcategory'
import ContentVersionSelectField from './ContentVersion'

// TODO: pass in organization from C∆Tabs component
const TeamsTab = ({ organization, industrySubcategories }) => {
  const [businessUnits, setBusinessUnits] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  useEffect(() => {
    async function businessUnits() {
      console.log('fetching BUs')
      try {
        setIsLoading(true)
        const response = await businessUnitsStore.fetch()
        console.log('BU response: ', response)
        setBusinessUnits(response)
        setIsLoading(false)
      } catch (err) {
        console.log('failed to fetch BUs: ', err)
        setIsError(true)
      }
    }
    businessUnits()
  }, [])

  // TODO: figure out table implemenation
  return (
    <div>
      {isError && <div>Something went wrong...</div>}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <Fragment>
          {businessUnits.map(businessUnit => (
            <Row>
              <form>
                {/* TODO: replace with DropdownSelect */}
                <IndustrySubcategorySelectField
                  record={businessUnit}
                  industrySubcategories={industrySubcategories}
                />
                <ContentVersionSelectField organization={organization} />
              </form>
            </Row>
          ))}
        </Fragment>
      )}
    </div>
  )
}

TeamsTab.propTypes = {
  organization: PropTypes.object,
  industrySubcategories: PropTypes.arrayOf(PropTypes.object),
}

export default TeamsTab
