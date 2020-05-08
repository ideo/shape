// import PropTypes from 'prop-types'
// import { useState, useEffect } from 'react'
// import {
//   organizationsStore,
//   supportedLanguagesStore,
// } from 'c-delta-organization-settings'

// import DropdownSelect from './DropdownSelect'
// import OrganizationRoles from './OrganizationRoles'
// import Languages from './Languages'
// import Loader from '~/ui/layout/Loader'
// import { apiStore } from '~/stores'

// const OrganizationTab = ({
//   industrySubcategories,
//   contentVersions,
//   supportedLanguages,
//   organization,
// }) => {
//   const [isLoading, setIsLoading] = useState(false)
//   const [isError, setIsError] = useState(false)
//   const [organization, setOrganization] = useState({})

//   const updateOrg = async orgParams => {
//     try {
//       const orgModel = new organizationsStore.model()
//       const orgModelInstance = new orgModel({
//         id: organization.id,
//       })
//       const data = {
//         organization: orgParams,
//       }
//       console.log('sending data for org: ', data)
//       const promise = orgModelInstance.save(data, {
//         optimistic: false,
//       })
//       const result = await promise
//       setOrganization(result)
//     } catch (err) {
//       console.log('org update failed: ', err)
//       setIsError(true)
//     }
//   }

//   return (
//     <div>
//       {isError && <div> Something went wrong... </div>}{' '}
//       {!isLoading ? (
//         <Loader />
//       ) : (
//         <form>
//           <DropdownSelect
//             label={'Industry'}
//             record={organization}
//             options={industrySubcategories}
//             updateRecord={updateOrg}
//             fieldToUpdate={'industry_subcategory_id'}
//           />
//           <DropdownSelect
//             label={'Content Version'}
//             toolTip={
//               'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
//             }
//             record={organization}
//             options={contentVersions}
//             updateRecord={updateOrg}
//             fieldToUpdate={'default_content_version_id'}
//           />
//           <OrganizationRoles
//             roles={apiStore.currentUserOrganization.primary_group.roles}
//             canEdit={apiStore.currentUserOrganization.primary_group.can_edit}
//           />
//           <Languages
//             organization={organization}
//             supportedLanguages={supportedLanguages}
//             updateRecord={updateOrg}
//           />
//         </form>
//       )}
//     </div>
//   )
// }

// OrganizationTab.propTypes = {
//   organization: PropTypes.object,
//   contentVersions: PropTypes.arrayOf(PropTypes.object),
//   industrySubcategories: PropTypes.arrayOf(PropTypes.object),
//   supportedLanguages: PropTypes.arrayOf(PropTypes.object),
//   // TODO: load all groups and roles for organization
//   // http://localhost:3001/api/v1/organizations/1/groups
// }

// export default OrganizationTab
