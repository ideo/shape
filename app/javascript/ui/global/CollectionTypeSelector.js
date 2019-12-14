import { PropTypes } from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { runInAction, observable } from 'mobx'

import PopoutMenu from '~/ui/global/PopoutMenu'
import { collectionTypeToIcon } from '~/ui/global/CollectionTypeIcon'
import Tooltip from '~/ui/global/Tooltip'
import { capitalize } from 'lodash'

@observer
class CollectionTypeSelector extends React.Component {
  @observable
  collection = null
  @observable
  showPopoutMenu = false

  constructor(props) {
    super(props)

    runInAction(() => {
      this.collection = props.collection
    })
  }

  openPopoutMenu = () => {
    runInAction(() => {
      this.showPopoutMenu = true
    })
  }

  hidePopoutMenu = () => {
    runInAction(() => {
      this.showPopoutMenu = false
    })
  }

  updateCollectionType = async collectionType => {
    const { collection } = this.props
    await collection.API_selectCollectionType(collectionType)
    // TODO: Do we want error handling?
    // If so, I think this needs a try/catch block?
    runInAction(() => {
      this.showPopoutMenu = false
    })
  }

  handleMenuItemClick = (e, collectionType) => {
    e.preventDefault()
    e.stopPropagation()

    this.updateCollectionType(collectionType)
  }

  get collectionTypeMenuItems() {
    const collectionTypes = ['collection', 'project', 'method', 'prototype']

    return collectionTypes.map(collectionType => {
      return {
        name: collectionType,
        // Replace iconLeft with other indicator of current collection type
        iconLeft:
          collectionType === this.collection.collection_type ? (
            <span>⏩</span>
          ) : (
            ''
          ),
        iconRight: collectionTypeToIcon[collectionType],
        onClick: e => this.handleMenuItemClick(e, collectionType),
        noBorder: true,
        loading: false,
        withAvatar: false,
      }
    })
  }

  render() {
    const { collection, children, position } = this.props

    if (!collection) return null

    return (
      <button
        style={{ position: position }}
        onClick={this.openPopoutMenu}
        data-cy="CollectionTypeSelector"
      >
        <Tooltip
          classes={{ tooltip: 'Tooltip' }}
          title={capitalize(collection.collection_type)}
          placement="top"
        >
          {children}
        </Tooltip>
        <PopoutMenu
          offsetPosition={{ x: 0, y: -60 }}
          onMouseLeave={this.hidePopoutMenu}
          hideDotMenu
          menuOpen={this.showPopoutMenu}
          menuItems={this.collectionTypeMenuItems}
        />
      </button>
    )
  }
}

CollectionTypeSelector.propTypes = {
  children: PropTypes.node.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  position: PropTypes.string.isRequired,
}

export default CollectionTypeSelector
