import { PropTypes } from 'prop-types'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, action } from 'mobx'

import PopoutMenu from '~/ui/global/PopoutMenu'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import Tooltip from '~/ui/global/Tooltip'
import { capitalize } from 'lodash'
import { Fragment } from 'react'

@observer
class CollectionTypeSelector extends React.Component {
  @observable
  collection = null
  @observable
  showPopoutMenu = false

  @action
  openPopoutMenu = ev => {
    if (ev) ev.stopPropagation()
    this.showPopoutMenu = true
  }

  @action
  hidePopoutMenu = () => {
    this.showPopoutMenu = false
  }

  updateCollectionType = async collectionType => {
    const { collection } = this.props
    await collection.API_selectCollectionType(collectionType)

    // TODO: Do we want error handling?
    // If so, I think this needs a try/catch block?
    this.hidePopoutMenu()
  }

  handleMenuItemClick = (e, collectionType) => {
    e.preventDefault()
    e.stopPropagation()

    this.updateCollectionType(collectionType)
  }

  get baseCollectionType() {
    const { collection } = this.props
    if (collection.isBoard) return 'foamcore'

    return 'collection'
  }

  get collectionTypeMenuItems() {
    const collectionTypes = [
      this.baseCollectionType,
      'project',
      'method',
      'phase',
      'prototype',
      'profile',
      'challenge',
    ]

    return collectionTypes.map(collectionType => {
      return {
        name: collectionType,
        iconRight: <CollectionIcon type={collectionType} size="xs" />,
        onClick: e => this.handleMenuItemClick(e, collectionType),
        noBorder: true,
        withAvatar: false,
      }
    })
  }

  render() {
    const { collection, children, location } = this.props
    let positionOffset = {}
    if (!collection) return null

    const position = location === 'CollectionCover' ? 'absolute' : 'relative'

    if (location === 'CollectionCover') {
      positionOffset = { x: 50, y: -50 }
    }
    if (location === 'PageHeader') {
      positionOffset = { x: -30, y: -10 }
    }

    return (
      <Fragment>
        <button
          style={{
            position,
          }}
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
        </button>
        <div style={{ position }}>
          <PopoutMenu
            offsetPosition={positionOffset}
            // y = top, x = left
            // need to set differently for page header and grid card
            onMouseLeave={this.hidePopoutMenu}
            hideDotMenu
            menuOpen={this.showPopoutMenu}
            menuItems={this.collectionTypeMenuItems}
          />
        </div>
      </Fragment>
    )
  }
}

CollectionTypeSelector.propTypes = {
  children: PropTypes.node.isRequired,
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  location: PropTypes.oneOf(['CollectionCover', 'PageHeader']).isRequired,
}

CollectionTypeSelector.displayName = 'CollectionTypeSelector'

export default CollectionTypeSelector
