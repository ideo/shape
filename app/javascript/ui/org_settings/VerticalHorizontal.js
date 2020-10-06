// import PropTypes from 'prop-types'
// import { Fragment, useState, useEffect } from 'react'
// import _ from 'lodash'
// import {
//   // LabelContainer,
//   Select,
//   SelectOption,
//   Label,
//   // LabelTextStandalone,
//   // LabelHint,
// } from '~/ui/global/styled/forms'
// // import {
// //   organizationsStore,
// //   industrySubcategoriesStore,
// //   // TODO: replace with businessUnitsStore? Vertical/Horizontal
// // } from 'c-delta-organization-settings'
// // Fetch all the categories and render the one with the ID of API
// // match org subcategory to show current option
// // update on change
// const VerticalHorizontalSelectField = ({ organization }) => {
//   const [subcategories, setSubcategories] = useState([])
//   const [selectedCategory, setSelectedCategory] = useState({
//     name: '--None--',
//   })
//   const [open, setOpen] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [isError, setIsError] = useState(false)

//   useEffect(() => {
//     async function getIndustrySubcategories() {
//       try {
//         setIsLoading(true)
//         const result = await industrySubcategoriesStore.fetch()
//         setSubcategories(result)
//         const industry = _.find(subcategories, subcategory => {
//           return subcategory.id === organization.industry_subcategory_id
//         })
//         if (industry) {
//           setSelectedCategory(industry)
//         }
//         setIsLoading(false)
//       } catch (err) {
//         setIsError(err)
//       }
//     }

//     getIndustrySubcategories()
//   }, [organization])

//   const handleChange = async e => {
//     e.preventDefault()
//     try {
//       setIsLoading(true)
//       const orgModel = new organizationsStore.model()
//       const orgModelInstance = new orgModel({
//         id: organization.id,
//       })
//       debugger
//       const promise = orgModelInstance.save(
//         {
//           organization: {
//             industry_subcategory_id: e.target.value,
//           },
//         },
//         {
//           optimistic: false,
//           // , patch: false
//         }
//         // need patch false because the fetch adapter does not support PATCH
//       )
//       const result = await promise
//       setSelectedCategory(result)
//       setIsLoading(false)
//     } catch (err) {
//       setIsError(true)
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div>
//       {isError && <div> Something went wrong... </div>}
//       {isLoading ? (
//         <div> Loading... </div>
//       ) : (
//         <Fragment>
//           {/* Should these labels be their own component? */}
//           <Label
//             style={{
//               fontSize: '13px',
//             }}
//             id="content-version-select-label"
//           >
//             Content Version
//           </Label>
//           <Select
//             labelId="content-version-select-label"
//             classes={{
//               root: 'select',
//               selectMenu: 'selectMenu',
//             }}
//             onOpen={() => setOpen(true)}
//             onClose={() => setOpen(false)}
//             onChange={e => handleChange(e)}
//             value={selectedCategory.id}
//             open={open}
//             // inline
//           >
//             {/* TODO: deal with placeholder if org has no subcategory */}
//             {subcategories.map(option => (
//               <SelectOption
//                 classes={{
//                   root: 'selectOption',
//                   selected: 'selected',
//                 }}
//                 key={option.id} // TODO: need actual unique key here?
//                 value={option.id}
//               >
//                 {option.name}
//               </SelectOption>
//             ))}
//           </Select>
//         </Fragment>
//       )}
//     </div>
//   )
// }
// VerticalHorizontalSelectField.defaultProps = {
//   organization: {},
// }
// VerticalHorizontalSelectField.propTypes = {
//   organization: PropTypes.object,
// }

// export default VerticalHorizontalSelectField
