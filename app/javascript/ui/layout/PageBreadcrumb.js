import _ from 'lodash'
import PropTypes from 'prop-types'
import { toJS, observable, action } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Breadcrumb from '~/ui/layout/Breadcrumb'
import BreadcrumbWithDropping from '~/ui/layout/BreadcrumbWithDropping'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import FoamcoreBoardIcon from '~/ui/icons/collection_icons/FoamcoreBoardIcon'
import SubmissionBoxIcon from '~/ui/icons/SubmissionBoxIcon'
import styled from 'styled-components'
import { apiStore, uiStore, routingStore } from '~/stores'
import v from '~/utils/variables'

const IconHolder = styled.div`
  color: ${v.colors.commonMedium};
  display: inline-block;
  margin-right: 6px;
  transform: translate(0, -1px);

  .icon.icon {
    transform: none;
    position: static;
    vertical-align: bottom;
  }
`

@observer
class PageBreadcrumb extends React.Component {
  @observable
  breadcrumbWithLinks = []
  @observable
  items = []

  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { record, isHomepage } = this.props
    if (isHomepage) return
    this.initBreadcrumb(record)
  }

  componentDidUpdate(prevProps) {
    const { record, windowWidth } = this.props
    if (prevProps.windowWidth !== windowWidth) {
      this.initBreadcrumb(record)
    }
  }

  @action
  initBreadcrumb(record) {
    this.breadcrumbWithLinks.replace(
      // this may also have the effect of marking uiStore.linkedInMyCollection
      uiStore.linkedBreadcrumbTrailForRecord(record)
    )
    this.items = this.initItems()
  }

  initItems = (clamp = true) => {
    const { maxDepth, record, useLinkedBreadcrumb } = this.props
    const items = []
    const breadcrumb = this.breadcrumbWithLinks
    const inMyCollection =
      record.in_my_collection ||
      (useLinkedBreadcrumb && uiStore.linkedInMyCollection)
    if (inMyCollection) {
      items.push(this.myCollectionItemProps)
    }
    if (!breadcrumb) return items

    const len = breadcrumb.length
    const longBreadcrumb = maxDepth && len >= maxDepth

    _.each(breadcrumb, (item, idx) => {
      const { type, id } = item
      // use apiStore to observe record changes e.g. when editing current collection name
      const itemRecord = apiStore.find(type, id)
      const name = itemRecord ? itemRecord.name : item.name
      const identifier = `${type}_${id}`

      if (longBreadcrumb && idx >= 2 && idx <= len - 3) {
        // if we have a really long breadcrumb we compress some options in the middle
        if (idx === len - 3) {
          return items.push({
            ...item,
            name,
            ellipses: true,
            identifier,
          })
        }
        return
      }
      let path
      if (item.identifier === 'homepage') {
        path = routingStore.pathTo('homepage')
      } else {
        path = routingStore.pathTo(item.type, item.id)
      }
      return items.push({
        ...item,
        name,
        truncatedName: null,
        ellipses: false,
        identifier,
        nested: 0,
        icon: this.renderIcon(item),
        path,
      })
    })

    return _.compact(items)
  }

  get myCollectionItemProps() {
    return {
      type: 'collections',
      id: apiStore.currentUserCollectionId,
      identifier: 'homepage',
      name: 'My Collection',
      can_edit_content: true,
      truncatedName: null,
      ellipses: false,
      has_children: true,
    }
  }

  fetchBreadcrumbRecords = breadcrumbItem => {
    return apiStore.requestJson(
      `collections/${breadcrumbItem.id}/collection_cards/breadcrumb_records`
    )
  }

  onBack = item => {
    let path = routingStore.pathTo(item.type, item.id)
    if (item.identifier === 'homepage') {
      path = routingStore.pathTo('homepage')
    }
    routingStore.routeTo(path)
  }

  onRestore = item => {
    // this will clear out any links in the breadcrumb and revert it back to normal
    uiStore.restoreBreadcrumb(item)
    this.initBreadcrumb(this.props.record, true)
  }

  onBreadcrumbClick = itemId => {
    if (itemId === apiStore.currentUserCollectionId) {
      routingStore.routeTo('homepage')
    } else {
      routingStore.routeTo('collections', itemId)
    }
  }

  renderIcon(menuItem) {
    let icon
    switch (menuItem.collection_type) {
      case 'Collection':
        icon = <CollectionIcon size="xs" />
        break
      case 'Collection::Board':
        icon = <FoamcoreBoardIcon size="xs" />
        break
      case 'Collection::SubmissionBox':
        icon = <SubmissionBoxIcon size="xs" />
        break
    }
    return <IconHolder>{icon}</IconHolder>
  }

  render() {
    const {
      record,
      containerWidth,
      isHomepage,
      maxDepth,
      offsetPosition,
    } = this.props
    const { breadcrumb } = record
    const renderItems = !isHomepage && breadcrumb && breadcrumb.length > 0

    return (
      <Breadcrumb
        breadcrumbItemComponent={BreadcrumbWithDropping}
        maxDepth={maxDepth}
        items={toJS(this.items)}
        onBack={this.onBack}
        onBreadcrumbClick={this.onBreadcrumbClick}
        onBreadcrumbDive={this.fetchBreadcrumbRecords}
        onRestore={this.onRestore}
        showBackButton={!uiStore.isLargeBreakpoint}
        visiblyHidden={!renderItems}
        containerWidth={containerWidth}
        isTouchDevice={uiStore.isTouchDevice}
        isSmallScreen={uiStore.isMobileXs}
        offsetPosition={offsetPosition}
      />
    )
  }
}

PageBreadcrumb.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  backButton: PropTypes.bool,
  containerWidth: PropTypes.number,
  isHomepage: PropTypes.bool,
  maxDepth: PropTypes.number,
  offsetPosition: PropTypes.shape({
    x: PropTypes.number,
    y: PropTypes.number,
  }),
  useLinkedBreadcrumb: PropTypes.bool,
  windowWidth: PropTypes.number,
}

PageBreadcrumb.defaultProps = {
  backButton: false,
  containerWidth: null,
  isHomepage: false,
  maxDepth: 6,
  offsetPosition: null,
  useLinkedBreadcrumb: true,
  windowWidth: 1024,
}

export default PageBreadcrumb
