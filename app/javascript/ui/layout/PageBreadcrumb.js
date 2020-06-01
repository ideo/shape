import _ from 'lodash'
import PropTypes from 'prop-types'
import axios from 'axios'
import { toJS, observable, action, runInAction } from 'mobx'
import { observer, PropTypes as MobxPropTypes } from 'mobx-react'

import Breadcrumb from '~/ui/layout/Breadcrumb'
import BreadcrumbWithDropping from '~/ui/layout/BreadcrumbWithDropping'
import CollectionIconXs from '~/ui/icons/CollectionIconXs'
import FoamcoreBoardIconXs from '~/ui/icons/FoamcoreBoardIconXs'
import SubmissionBoxIconXs from '~/ui/icons/SubmissionBoxIconXs'
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
        breadcrumbDropDownRecords: [],
        path,
      })
    })

    const depth = clamp && maxDepth ? maxDepth * -1 : 0
    return _.compact(items).slice(depth)
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

  fetchBreadcrumbRecords = async (breadcrumbItem, rootItemId) => {
    const breadcrumbRecordsReq = await axios.get(
      `/api/v1/collections/${breadcrumbItem.id}/collection_cards/breadcrumb_records`
    )
    const lookupId = !!rootItemId ? rootItemId : breadcrumbItem.id
    runInAction(() => {
      const item = this.items.find(i => i.id === lookupId)
      if (item) {
        item.breadcrumbDropDownRecords = breadcrumbRecordsReq.data
      }
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

  renderIcon(menuItem) {
    let icon
    switch (menuItem.collection_type) {
      case 'Collection':
        icon = <CollectionIconXs />
        break
      case 'Collection::Board':
        icon = <FoamcoreBoardIconXs />
        break
      case 'Collection::SubmissionBox':
        icon = <SubmissionBoxIconXs />
        break
    }
    return <IconHolder>{icon}</IconHolder>
  }

  render() {
    const { containerWidth, record, isHomepage } = this.props
    const { breadcrumb } = record
    const renderItems = !isHomepage && breadcrumb && breadcrumb.length > 0

    return (
      <Breadcrumb
        breadcrumbItemComponent={BreadcrumbWithDropping}
        // deeply convert this into a normal array of JS objects
        items={toJS(this.items)}
        onBack={this.onBack}
        onBreadcrumbClick={this.onBreadcrumbClick}
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
  useLinkedBreadcrumb: PropTypes.bool,
}

PageBreadcrumb.defaultProps = {
  isHomepage: false,
  containerWidth: null,
  maxDepth: 6,
  backButton: false,
  useLinkedBreadcrumb: true,
}

export default PageBreadcrumb
