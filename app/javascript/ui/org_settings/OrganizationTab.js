import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import {
  organizationsStore,
  supportedLanguagesStore,
} from 'c-delta-organization-settings'

import DropdownSelect from './DropdownSelect'
import OrganizationRoles from './OrganizationRoles'
import Languages from './Languages'
import Loader from '~/ui/layout/Loader'
import { apiStore } from '~/stores'

const OrganizationTab = ({ industrySubcategories, contentVersions }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [allFetchesComplete, setAllFetchesComplete] = useState(false)
  const [isError, setIsError] = useState(false)
  const [organization, setOrganization] = useState({})
  const [languageOptions, setLanguageOptions] = useState([])

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        setIsLoading(true)
        const orgModel = new organizationsStore.model()
        const orgModelInstance = new orgModel({
          id: 4, // TODO: how to fetch actual id
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
    }

    loadOrganization()
  }, [])

  useEffect(() => {
    const getSupportedLanguages = async () => {
      try {
        setIsLoading(true)
        console.log(isLoading)
        const response = await supportedLanguagesStore.fetch()
        console.log(response)
        setLanguageOptions(response)
        setIsLoading(false)
      } catch (err) {
        console.log('failed to fetch languages')
        setIsError(true)
        setIsLoading(false)
      }
    }
    getSupportedLanguages()
  }, [])

  // TODO: make OrganizationTab a class so it can be an observer
  useEffect(() => {
    apiStore.fetch(
      'groups',
      apiStore.currentUserOrganization.primary_group.id,
      true
    )
  }, [])

  useEffect(() => {
    if (organization.id && languageOptions.length > 1) {
      // check if primary group has roles
      setAllFetchesComplete(true)
    }
  })

  const updateOrg = async orgParams => {
    try {
      const orgModel = new organizationsStore.model()
      const orgModelInstance = new orgModel({
        id: organization.id,
      })
      const data = {
        organization: orgParams,
      }
      console.log('sending data for org: ', data)
      const promise = orgModelInstance.save(data, {
        optimistic: false,
      })
      const result = await promise
      setOrganization(result)
    } catch (err) {
      console.log('org update failed: ', err)
      setIsError(true)
    }
  }

  return (
    <div>
      {isError && <div>Something went wrong...</div>}
      {!allFetchesComplete ? (
        <Loader />
      ) : (
        <form>
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
            canEdit={apiStore.currentUserOrganization.primary_group.can_edit}
          />
          <Languages
            organization={organization}
            supportedLanguages={languageOptions}
            updateRecord={updateOrg}
          />
        </form>
      )}
    </div>
  )
}

OrganizationTab.propTypes = {
  organization: PropTypes.object,
  contentVersions: PropTypes.arrayOf(PropTypes.object),
  industrySubcategories: PropTypes.arrayOf(PropTypes.object),
  // TODO: load all groups and roles for organization
  // http://localhost:3001/api/v1/organizations/1/groups
}

export default OrganizationTab
