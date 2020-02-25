import _ from 'lodash'
import PropTypes from 'prop-types'
import axios from 'axios'
import { observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Breadcrumb from '~/ui/layout/Breadcrumb'
import { apiStore, uiStore, routingStore } from '~/stores'

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

  @action
  initBreadcrumb(record) {
    this.breadcrumbWithLinks.replace(
      // this may also have the effect of marking uiStore.linkedInMyCollection
      uiStore.linkedBreadcrumbTrailForRecord(record)
    )
    // this will set record.inMyCollection = true/false
    apiStore.checkInMyCollection(record)
    this.items = this.initItems()
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

  initItems = (clamp = true) => {
    const { maxDepth, record } = this.props
    const items = []
    const breadcrumb = this.breadcrumbWithLinks
    if (record.inMyCollection || uiStore.linkedInMyCollection) {
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
        if (idx == len - 3) {
          return items.push({
            ...item,
            name,
            ellipses: true,
            identifier,
          })
        }
        return
      }
      return items.push({
        ...item,
        name,
        truncatedName: null,
        ellipses: false,
        identifier,
        nested: 0,
      })
    })

    const depth = clamp && maxDepth ? maxDepth * -1 : 0
    return _.compact(items).slice(depth)
  }

  fetchBreadcrumbRecords = async itemId => {
    const breadcrumbRecordsReq = await axios.get(
      `/api/v1/collections/${itemId}/collection_cards/breadcrumb_records`
    )
    runInAction(() => {
      const item = this.items.find(i => i.id === itemId)
      item.breadcrumbDropDownRecords = breadcrumbRecordsReq.data
    })
  }

  onBack = path => {
    routingStore.routeTo(path)
  }

  onRestore = item => {
    // this will clear out any links in the breadcrumb and revert it back to normal
    uiStore.restoreBreadcrumb(item)
    this.initBreadcrumb(this.props.record, true)
  }

  onBreadcrumbClick = itemId => {
    routingStore.routeTo('collections', itemId)
  }

  render() {
    const { containerWidth, record, isHomepage } = this.props
    const { inMyCollection, breadcrumb } = record
    const renderItems =
      !isHomepage &&
      // wait until we load this value before rendering
      inMyCollection !== null &&
      breadcrumb &&
      breadcrumb.length > 0
    return (
      <Breadcrumb
        items={this.items}
        onBack={this.onBack}
        onBreadcrumbDive={this.fetchBreadcrumbRecords}
        showBackButton={!uiStore.isLargeBreakpoint}
        visiblyHidden={!renderItems}
        containerWidth={containerWidth}
        isTouchDevice={uiStore.isTouchDevice}
        isSmallScreen={uiStore.isMobileXs}
      />
    )
  }
}

PageBreadcrumb.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
  isHomepage: PropTypes.bool,
  containerWidth: PropTypes.number,
  maxDepth: PropTypes.number,
  backButton: PropTypes.bool,
}

PageBreadcrumb.defaultProps = {
  isHomepage: false,
  containerWidth: null,
  maxDepth: 6,
  backButton: false,
}

export default PageBreadcrumb