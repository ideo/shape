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
    console.log('opening popout menu')
    runInAction(() => {
      this.showPopoutMenu = true
    })
  }

  hidePopoutMenu = () => {
    console.log('hiding popout menu')
    runInAction(() => {
      this.showPopoutMenu = false
    })
  }

  updateCollectionType = async collectionType => {
    const { collection } = this.props
    console.log('sending ', collectionType)
    await collection.API_selectCollectionType(collectionType)
    // Do we want error handling?
    // If so, I think this needs a try/catch block?
    // if (res) {
    //   console.log(res)
    // } else {
    //   // error handling?
    // }
    runInAction(() => {
      this.showPopoutMenu = false
    })
  }

  handleMenuItemClick = collectionType => {
    this.updateCollectionType(collectionType)
  }

  get collectionTypeMenuItems() {
    const collectionTypes = ['collection', 'project', 'method', 'prototype']

    return collectionTypes.map(collectionType => {
      return {
        name: collectionType,
        iconLeft:
          collectionType === this.collection.collection_type ? (
            <span>⏩</span>
          ) : (
            ''
          ), // Do we even need an "active/selected Icon?"
        iconRight: collectionTypeToIcon[collectionType],
        onClick: () => this.handleMenuItemClick(collectionType),
        noBorder: true,
        loading: false,
        withAvatar: false,
      }
    })
  }

  render() {
    const { collection, children, position } = this.props
    console.log(this.collection.collection_type)
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
          // need to adjust position/location?
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
