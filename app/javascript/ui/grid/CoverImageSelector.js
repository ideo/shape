import { Fragment } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, action, runInAction, toJS } from 'mobx'
import styled from 'styled-components'
import FlipMove from 'react-flip-move'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import CoverImageToggleIcon from '~/ui/icons/CoverImageToggleIcon'
import FilestackUpload from '~/utils/FilestackUpload'
import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import SingleCrossIcon from '~/ui/icons/SingleCrossIcon'
import UploadIcon from '~/ui/icons/UploadIcon'
import XIcon from '~/ui/icons/XIcon'
import { SmallBreak } from '~/ui/global/styled/layout'
import v, { ITEM_TYPES } from '~/utils/variables'

const removeOption = {
  type: 'remove',
  title: 'remove image',
  icon: <XIcon />,
}
const uploadOption = {
  type: 'upload',
  title: 'upload new image',
  icon: <UploadIcon />,
}
const backgroundOption = {
  type: 'remove',
  title: 'gray',
  color: v.colors.commonDark,
}

const TopRightHolder = styled.div`
  max-width: 192px;
  right: 5px;
  position: absolute;
  top: 46px;
  width: ${props => props.width}px;
  z-index: ${v.zIndex.gridCardTop};
`
TopRightHolder.displayName = 'TopRightHolder'

const filterOptions = [
  {
    type: 'nothing',
    title: 'no cover effect',
    icon: <SingleCrossIcon />,
  },
  {
    type: 'transparent_gray',
    title: 'dark overlay effect',
    color: v.colors.commonMedium,
  },
]

@inject('apiStore', 'uiStore')
@observer
class CoverImageSelector extends React.Component {
  @observable
  open = false
  @observable
  imageOptions = []
  @observable
  parentCard = null
  @observable
  loading = false

  componentDidMount() {
    const { card } = this.props
    // TODO don't like how id name is in two separate places
    runInAction(() => {
      this.parentCard = document.getElementById(`gridCard-${card.id}`)
    })
  }

  @action
  setLoading(val) {
    this.loading = val
  }

  async fetchOptions() {
    const { card } = this.props
    const collection = card.record
    if (card.record.internalType === 'items') return []
    await card.record.API_fetchCards({ hidden: true })
    return _.take(
      collection.collection_cards
        .filter(ccard => ccard.record.isImage)
        .map(ccard => ({
          cardId: ccard.id,
          title: ccard.record.name,
          imageUrl: ccard.record.filestack_file_url,
        })),
      9
    )
  }

  async populateAllOptions() {
    this.setLoading(true)
    const imageOptionsAll = await this.fetchOptions()
    this.setLoading(false)
    runInAction(
      () =>
        (this.imageOptions = [
          removeOption,
          ...imageOptionsAll,
          backgroundOption,
          uploadOption,
        ])
    )
  }

  createCard = async file => {
    const { apiStore, uiStore, card } = this.props
    const collection = apiStore.find('collections', card.record.id)
    await collection.API_clearCollectionCover()
    const attrs = {
      item_attributes: {
        type: ITEM_TYPES.FILE,
        filestack_file_attributes: FilestackUpload.filestackFileAttrs(file),
      },
    }
    const cardAttrs = {
      order: null,
      height: 1,
      widht: 1,
      parent_id: collection.id,
      is_cover: true,
      hidden: true,
    }
    Object.assign(cardAttrs, attrs)
    const newLocalCard = new CollectionCard(cardAttrs, apiStore)
    newLocalCard.parent = collection
    const newCard = await newLocalCard.API_create()
    uiStore.addNewCard(newCard.record.id)
    // get collection with new collection_cover info attached
    apiStore.fetch('collections', collection.id, true)
  }

  changeCover = async file => {
    const { apiStore, card } = this.props
    const item = apiStore.find('items', card.record.id)
    item.thumbnail_url = file.url
    return item.save()
  }

  handleClick = ev => {
    ev.preventDefault()
    this.populateAllOptions()
    runInAction(() => (this.open = !this.open))
  }

  async clearCover() {
    const { apiStore, card } = this.props
    if (card.record.internalType === 'collections') {
      const collection = apiStore.find('collections', card.record.id)
      return collection.API_clearCollectionCover()
    }
    const item = card.record
    item.thumbnail_url = ''
    return item.save()
  }

  onImageOptionSelect = async option => {
    const { apiStore, card } = this.props
    const collection = apiStore.find('collections', card.record.id)
    runInAction(() => (this.open = false))
    if (option.cardId) {
      const selectedCard = apiStore.find('collection_cards', option.cardId)
      selectedCard.is_cover = true
      await selectedCard.save()
    } else if (option.type === 'remove') {
      await this.clearCover()
    } else if (option.type === 'upload') {
      const afterPickAction =
        card.record.internalType === 'collections'
          ? this.createCard
          : this.changeCover
      FilestackUpload.pickImage({
        onSuccess: file => afterPickAction(file),
      })
    }
    if (collection) {
      apiStore.fetch('collections', collection.id, true)
    } else {
      // Fetch the current page's collection to reload any card changes
      apiStore.fetch('collections', card.parent.id, true)
    }
  }

  onFilterOptionSelect = async option => {
    const { apiStore, card } = this.props
    const collection = apiStore.find('collections', card.record.id)
    runInAction(() => (this.open = false))
    card.filter = option.type
    await card.save()
    apiStore.fetch('collections', collection.id, true)
  }

  render() {
    return (
      <Fragment>
        <CardActionHolder
          active={this.open}
          className="show-on-hover"
          tooltipText="select cover image"
          role="button"
          onClick={this.handleClick}
        >
          <CoverImageToggleIcon />
        </CardActionHolder>
        {this.open &&
          ReactDOM.createPortal(
            <TopRightHolder
              className="show-on-hover"
              width={this.imageOptions.length * 32}
            >
              {!this.loading && (
                <FlipMove
                  appearAnimation="elevator"
                  duration={300}
                  easing="ease-out"
                >
                  <QuickOptionSelector
                    options={toJS(this.imageOptions)}
                    onSelect={this.onImageOptionSelect}
                  />
                  <SmallBreak />
                  <QuickOptionSelector
                    options={filterOptions}
                    onSelect={this.onFilterOptionSelect}
                  />
                </FlipMove>
              )}
            </TopRightHolder>,
            this.parentCard
          )}
      </Fragment>
    )
  }
}

CoverImageSelector.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
}
CoverImageSelector.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CoverImageSelector
