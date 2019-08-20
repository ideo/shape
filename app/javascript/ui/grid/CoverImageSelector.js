import { Fragment } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, action, runInAction, toJS } from 'mobx'
import styled from 'styled-components'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import FilestackUpload from '~/utils/FilestackUpload'
import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import SingleCrossIcon from '~/ui/icons/SingleCrossIcon'
import UploadIcon from '~/ui/icons/UploadIcon'
import XIcon from '~/ui/icons/XIcon'
import { SmallBreak } from '~/ui/global/styled/layout'
import v, { ITEM_TYPES } from '~/utils/variables'
// This must be imported last, or else it leads to a cryptic
// circular dependency issue
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import EditPencilIconLarge from '~/ui/icons/EditPencilIconLarge'
import TextareaAutosize from 'react-autosize-textarea'
import { CloseButton } from '~/ui/global/styled/buttons'
import PropTypes from 'prop-types'

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
const collectionBackgroundOption = {
  type: 'remove',
  title: 'gray',
  color: v.colors.commonDark,
}
const linkBackgroundOption = {
  type: 'remove',
  title: 'black',
  color: v.colors.black,
}

const TopRightHolder = styled.div`
  width: 100%;
  height: 100%;
  max-width: ${props => props.maxWidth}px;
  max-height: ${props => props.maxHeight}px;
  padding: 14px 14px 16px;
  right: 0px;
  top: 0px;
  display: block;
  position: absolute;
  z-index: ${v.zIndex.gridCardTop};
  background: ${v.colors.primaryLight};
  opacity: 0.9;
  box-sizing: border-box;
`
TopRightHolder.displayName = 'TopRightHolder'

const StyledEditTitle = styled.div`
  display: flex;
  margin-bottom: 0.75rem;
  h3 {
    flex: 1;
    margin-right: 10px;
    height: 100%;
    max-width: 50px;
    margin-bottom: 0px;
  }
  div {
    flex: 3 1 auto;
    border-bottom: 1px solid ${v.colors.black};
    max-width: 200px;
    textarea {
      width: 100%;
      background: transparent;
      border: none;
      color: ${props => props.color || v.colors.black};
      font-weight: ${v.weights.book};
      font-family: ${v.fonts.sans};
      font-size: 1rem;
      text-transform: none;
      outline-width: 0;
      resize: none;
    }
  }
`

StyledEditTitle.displayName = 'StyledEditTitle'

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
  imageOptions = []
  @observable
  parentCard = null
  @observable
  loading = false
  @observable
  cardTitle = ''

  componentDidMount() {
    const { card, uiStore } = this.props
    const { record } = card
    const { name } = record
    this.cardTitle = name || record.url
    // TODO don't like how id name is in two separate places
    runInAction(() => {
      this.parentCard = document.getElementById(`gridCard-${card.id}`)

      if (uiStore.isNewCard(record.id) && record.isLink) {
        this.populateAllOptions()
        uiStore.setEditingCardCover(card.id)
        this.props.uiStore.removeNewCard(record.id)
      }
    })
  }

  @action
  setLoading(val) {
    this.loading = val
  }

  get recordIsCollection() {
    return this.props.card.record.internalType === 'collections'
  }

  async fetchOptions() {
    const { card } = this.props
    const { record } = card
    if (!this.recordIsCollection) {
      if (!record.previous_thumbnail_urls) return []
      return record.previous_thumbnail_urls.map(url => ({
        title: 'previous image',
        imageUrl: url,
      }))
    }
    const collection = record
    await collection.API_fetchCards({ hidden: true })
    return _.take(
      collection.collection_cards
        .filter(ccard => ccard.record.isImage)
        .map(ccard => ({
          cardId: ccard.id,
          title: ccard.record.name,
          imageUrl: ccard.record.imageUrl({ resize: { width: 128 } }),
        })),
      9
    )
  }

  async populateAllOptions() {
    const { record } = this.props.card
    this.setLoading(true)
    const imageOptionsAll = await this.fetchOptions()
    this.setLoading(false)
    let bgOption = null
    if (this.recordIsCollection) {
      bgOption = collectionBackgroundOption
    } else if (record.isLink) {
      bgOption = linkBackgroundOption
    }
    runInAction(() => {
      const options = [removeOption, ...imageOptionsAll]
      if (bgOption) options.push(bgOption)
      options.push(uploadOption)
      this.imageOptions = options
    })
  }

  createCard = async file => {
    const { apiStore, card } = this.props
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
      width: 1,
      row: 0,
      col: 0,
      parent_id: collection.id,
      is_cover: true,
      hidden: true,
    }
    Object.assign(cardAttrs, attrs)
    const newCard = new CollectionCard(cardAttrs, apiStore)
    newCard.parent = collection
    this.setLoading(true)
    await newCard.API_create()
    // get collection with new collection_cover info attached
    apiStore.fetch('collections', collection.id, true)
    this.setLoading(false)
  }

  changeCover = async file => {
    const { apiStore, card } = this.props
    const { record } = card
    const item = apiStore.find('items', record.id)
    item.thumbnail_url = file.url
    return item.save()
  }

  @action
  changeTitle = ev => {
    this.cardTitle = ev.target.value
  }

  handleTitleSave = ev => {
    const { card, uiStore } = this.props
    const { record } = card
    uiStore.setEditingCardCover(null)
    record.API_updateName(this.cardTitle)
  }

  handleInputKeys = ev => {
    if (ev.key === 'Enter') this.handleTitleSave(ev)
  }

  handleInputClick = ev => {
    ev.stopPropagation()
    ev.target.focus()
  }

  handleClick = ev => {
    const { card, uiStore } = this.props
    const { id } = card
    ev.preventDefault()
    this.populateAllOptions()
    uiStore.setEditingCardCover(id)
  }

  handleClose = ev => {
    this.handleTitleSave()
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
    const { apiStore, uiStore, card } = this.props
    uiStore.setEditingCardCover(null)
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
    } else if (!this.recordIsCollection && option.imageUrl) {
      // we are picking a previous_thumbnail_url
      const item = card.record
      // update back to the selected one
      item.thumbnail_url = option.imageUrl
      item.save()
    }
    if (this.recordIsCollection) {
      apiStore.fetch('collections', card.record.id, true)
    }
  }

  onFilterOptionSelect = async option => {
    const { uiStore, card } = this.props
    uiStore.setEditingCardCover(null)
    card.filter = option.type
    await card.save()
  }

  get showFilters() {
    const { record } = this.props.card
    const { thumbnail_url, isLink } = record
    if (this.recordIsCollection) return true
    if (isLink) return true
    return !!thumbnail_url
  }

  renderEditTitleInput(title) {
    // max length 144 matches StyledEditableName's max length
    return (
      <div>
        <TextareaAutosize
          maxRows={3}
          maxLength={144}
          value={title}
          placeholder={'untitled'}
          onChange={this.changeTitle}
          onKeyPress={this.handleInputKeys}
          onBlur={this.handleTitleSave}
          onClick={this.handleInputClick}
          className={'edit-cover-text'}
        />
      </div>
    )
  }

  renderInner() {
    const { uiStore } = this.props
    const { gridSettings } = uiStore
    const { gridH, gridW } = gridSettings
    return (
      <TopRightHolder
        data-cy="EditCoverOptions"
        maxWidth={gridW}
        maxHeight={gridH}
      >
        {!this.loading && (
          <div>
            <StyledEditTitle>
              <h3>Title</h3>
              {this.renderEditTitleInput(this.cardTitle)}
            </StyledEditTitle>
            <h3>Cover Image</h3>
            <QuickOptionSelector
              options={toJS(this.imageOptions)}
              onSelect={this.onImageOptionSelect}
            />
            <SmallBreak />
            <h3>Cover effects</h3>
            {this.showFilters && (
              <QuickOptionSelector
                options={filterOptions}
                onSelect={this.onFilterOptionSelect}
              />
            )}
          </div>
        )}
        <CloseButton
          size="lg"
          onClick={this.handleClose}
          data-cy="EditCoverCloseBtn"
        />
      </TopRightHolder>
    )
  }

  render() {
    const { isEditingCardCover } = this.props
    return (
      <Fragment>
        <CardActionHolder
          active={this.isEditingCardCover}
          className="show-on-hover"
          tooltipText="edit cover"
          role="button"
          onClick={this.handleClick}
        >
          <EditPencilIconLarge />
        </CardActionHolder>
        {isEditingCardCover &&
          ReactDOM.createPortal(this.renderInner(), this.parentCard)}
      </Fragment>
    )
  }
}

CoverImageSelector.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  isEditingCardCover: PropTypes.bool.isRequired,
}

CoverImageSelector.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default CoverImageSelector
