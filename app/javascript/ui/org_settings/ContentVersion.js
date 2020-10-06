// import { Fragment, useState, useEffect } from 'react'
// import { PropTypes as MobxPropTypes } from 'mobx-react'

// import {
//   // LabelContainer,
//   Select,
//   SelectOption,
//   Label,
//   // LabelTextStandalone,
//   // LabelHint,
// } from '~/ui/global/styled/forms'
// // import {
// //   contentVersionsStore,
// //   organizationsStore,
// // } from 'c-delta-organization-settings'
// import HoverableDescriptionIcon from '~/ui/global/HoverableDescriptionIcon'
// // Fetch all the categories and render the one with the ID of API
// // match org subcategory to show current option
// // update on change
// const ContentVersionSelectField = ({ organization }) => {
//   const [contentVersions, setContentVersions] = useState([])
//   const [contentVersion, setContentVersion] = useState({
//     name: '--None--', // TODO: update if needed
//   })
//   const [open, setOpen] = useState(false)
//   const [isLoading, setIsLoading] = useState(false)
//   const [isError, setIsError] = useState(false)

//   useEffect(() => {
//     async function getContentVersions() {
//       try {
//         setIsLoading(true)
//         const result = await contentVersionsStore.fetch()

//         setContentVersions(result)
//         setIsLoading(false)
//       } catch (err) {
//         setIsError(err)
//       }
//     }

//     getContentVersions()
//   }, [organization])

//   const handleChange = async e => {
//     e.preventDefault()

//     try {
//       setIsLoading(true)
//       const orgModel = new organizationsStore.model()
//       const orgModelInstance = new orgModel({
//         id: organization.id,
//       })

//       const promise = orgModelInstance.save(
//         {
//           organization: {
//             default_content_version: e.target.value,
//           },
//         },
//         {
//           optimistic: false,
//           // , patch: false
//         }
//         // need patch false because the fetch adapter does not support PATCH
//       )
//       const result = await promise
//       setContentVersion(result)
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
//         <div>Loading... </div>
//       ) : (
//         <Fragment>
//           {/* TODO: Should these labels be their own component? */}
//           <Label
//             style={{
//               fontSize: '13px',
//               marginTop: '28px',
//             }}
//             id="content-version-select-label"
//           >
//             Content Version {''}
//             <HoverableDescriptionIcon
//               description={
//                 'Content Versions provide alternative wording to content that are more suitable for certain kinds of teams or organizations. We suggest leaving the default if you are unsure.'
//               }
//               width={16}
//             />
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
//             value={contentVersion}
//             open={open}
//             // inline
//           >
//             {/* TODO: deal with placeholder if org has no subcategory */}
//             {contentVersions.map(option => (
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

// ContentVersionSelectField.defaultProps = {
//   organization: {},
// }

// ContentVersionSelectField.propTypes = {
//   organization: MobxPropTypes.objectOrObservableObject,
// }

// export default ContentVersionSelectField
