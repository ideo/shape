import { PropTypes } from 'prop-types'
import { PropTypes as MobxPropTypes } from 'mobx-react'
import { observable } from 'mobx'

import PopoutMenu from '~/ui/global/PopoutMenu'
import { editableCollectionTypes } from '~/ui/global/CollectionTypeIcon'
import Tooltip from '~/ui/global/Tooltip'
import { capitalize } from 'lodash'
// Need to work around /collections/:id link in CollectionCover
// Should CollectionCoverTitle be just icon, title, icon
// in CollectionCover so that only the title is a link?
class CollectionTypeSelector extends React.Component {
  @observable
  collection = null

  constructor(props) {
    super(props)

    this.collection = props.collection
  }

  updateCollectionType = async collectionType => {
    const { collection } = this.props
    await collection.API_selectCollectionType
    // anything else here? error handling?
  }

  get collectionTypeMenuItems() {
    const { collection } = this.props
    const collectionTypes = [('collection', 'project', 'method', 'prototype')]

    return collectionTypes.map(collectionType => {
      return {
        name: collectionType,
        iconLeft: null,
        iconRight: editableCollectionTypes[collectionType],
        onClick: () => {
          console.log('clicked menu item')
          collection.API_selectCollectionType('method')
        },
        noBorder: true,
        loading: false,
        withAvatar: false,
      }
    })
  }

  render() {
    const { collection, children } = this.props
    console.log(this.collectionTypeMenuItems)
    if (!collection) return null
    return (
      <button
        onClick={() => console.log('clicked collection selector')}
        style={{ border: '1px red solid', zIndex: 1000 }}
        data-cy="CollectionTypeSelector"
      >
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title={capitalize(collection.collection_type)}
          placement="bottom"
        >
          {children}
        </Tooltip>
        <PopoutMenu
          // need to adjust position/location?
          hideDotMenu
          menuOpen={true}
          menuItems={this.collectionTypeMenuItems}
        />
      </button>
    )
  }
}

CollectionTypeSelector.propTypes = {
  children: PropTypes.node.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CollectionTypeSelector
