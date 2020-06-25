import { Fragment } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, action, runInAction, toJS } from 'mobx'
import styled from 'styled-components'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import FilestackUpload from '~/utils/FilestackUpload'
import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import CustomIconSelector from '~/ui/grid/CustomIconSelector'
import SingleCrossIcon from '~/ui/icons/SingleCrossIcon'
import UploadIcon from '~/ui/icons/UploadIcon'
import XIcon from '~/ui/icons/XIcon'
import v, { ITEM_TYPES } from '~/utils/variables'
// This must be imported last, or else it leads to a cryptic
// circular dependency issue
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import EditPencilIconLarge from '~/ui/icons/EditPencilIconLarge'
import TextareaAutosize from 'react-autosize-textarea'
import { CloseButton, NamedActionButton } from '~/ui/global/styled/buttons'
import PropTypes from 'prop-types'
import { Checkbox, LabelContainer } from '~/ui/global/styled/forms'
import CollectionIcon from '~/ui/icons/CollectionIcon'
import parseURLMeta from '~/utils/parseURLMeta'

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

const TopRightHolderWrapper = styled.div`
  display: flex;
  width: 100%;
  max-width: ${props => props.maxWidth}px;
  position: absolute;
  right: 0px;
  top: 0px;
  z-index: ${v.zIndex.gridCardTop};
  opacity: 0.9;
  align-items: stretch;
  background: ${v.colors.primaryLight};
  min-height: ${v.defaultGridSettings.gridH}px;
`
TopRightHolderWrapper.displayName = 'TopRightHolderWrapper'

const TopRightHolder = styled.div`
  margin: 14px 14px 0px;
`

const StyledEditTitle = styled.div`
  display: flex;
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
    max-width: 316px;
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

export const MediumBreak = styled.div`
  display: block;
  margin-bottom: 0.75rem;
`

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
class CardCoverEditor extends React.Component {
  @observable
  imageOptions = []
  @observable
  parentCard = null
  @observable
  loading = false
  @observable
  cardTitle = ''
  @observable
  hardcodedSubtitle = '' // overrides cover text set by text items
  @observable
  subtitleHidden = false

  componentDidMount() {
    const { card, uiStore } = this.props
    const { record } = card
    this.setObservableInputs()
    runInAction(() => {
      // this references the id in GridCard.js
      this.parentCard = document.getElementById(`gridCard-${card.id}`)
      if (uiStore.isNewCard(record.id) && record.isLink) {
        this.populateAllImageOptions()
        uiStore.setEditingCardCover(card.id)
        this.props.uiStore.removeNewCard(record.id)
      }
    })
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isEditingCardCover !== this.props.isEditingCardCover) {
      const { card } = this.props
      const { record } = card

      if (
        record.name === this.cardTitle &&
        record.subtitle === this.hardcodedSubtitle &&
        record.subtitleHidden === this.subtitleHidden
      ) {
        return
      }

      // only update when there are changes
      record.API_updateNameAndCover({
        name: this.cardTitle,
        hardcodedSubtitle: this.hardcodedSubtitle,
        subtitleHidden: this.subtitleHidden,
      })
    }
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
      collection.sortedCoverCards.map(card => ({
        cardId: card.id,
        title: card.record.name,
        imageUrl: card.record.imageUrl({ resize: { width: 128 } }),
      })),
      9
    )
  }

  async populateAllImageOptions() {
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

  @action
  changeHardcodedSubtitle = ev => {
    this.hardcodedSubtitle = ev.target.value
  }

  @action
  onToggleSubtitleCheckbox = async e => {
    this.subtitleHidden = !this.subtitleHidden
  }

  handleInputKeyPress = ev => {
    if (ev.key === 'Enter') {
      this.handleClose()
    }
  }

  handleInputKeyDown = ev => {
    if (ev.key === 'Escape') {
      this.handleClose()
    }
  }

  handleInputClick = ev => {
    ev.stopPropagation()
    ev.target.focus()
  }

  handleClick = ev => {
    const { card, uiStore } = this.props
    const { id } = card
    ev.preventDefault()
    this.setObservableInputs()
    this.populateAllImageOptions()
    uiStore.setEditingCardCover(id)
  }

  handleClose = ev => {
    const { uiStore } = this.props
    uiStore.setEditingCardCover(null)
  }

  handleRestore = async ev => {
    const { record } = this.props.card
    const meta = await parseURLMeta(record.url)
    runInAction(() => {
      this.hardcodedSubtitle = meta.description
      this.cardTitle = meta.title
    })
  }

  @action
  setObservableInputs = () => {
    const { record } = this.props.card
    const { name } = record
    this.cardTitle = name || record.url
    if (record.isCollection) {
      this.hardcodedSubtitle = record.subtitleForEditing
    } else if (record.isLink) {
      this.hardcodedSubtitle = record.content
    }
    this.subtitleHidden = record.subtitleHidden
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
    await card.API_updateCardFilter(option.type)
  }

  onCustomIconSelect = iconName => {
    const {
      card: { record },
    } = this.props
    record.custom_icon = iconName
    record.save()
  }

  onToggleShowIconOnCoverCheckbox = () => {
    const {
      card: { record },
    } = this.props
    record.show_icon_on_cover = !record.show_icon_on_cover
    record.save()
  }

  get showFilters() {
    const { record } = this.props.card
    const { thumbnail_url, isLink } = record
    if (this.recordIsCollection) return true
    if (isLink) return true
    return !!thumbnail_url
  }

  renderEditTitleInput() {
    // max length 144 matches StyledEditableName's max length
    return (
      <div>
        <TextareaAutosize
          maxRows={3}
          maxLength={144}
          value={this.cardTitle}
          placeholder="untitled"
          onChange={this.changeTitle}
          onKeyPress={this.handleInputKeyPress}
          onClick={this.handleInputClick}
          onKeyDown={this.handleInputKeyDown}
          className="edit-cover-title"
        />
      </div>
    )
  }

  renderEditSubtitleInput() {
    // max length 144 matches StyledEditableName's max length
    return (
      <div>
        <TextareaAutosize
          maxRows={3}
          maxLength={144}
          value={this.hardcodedSubtitle}
          placeholder="default"
          onChange={this.changeHardcodedSubtitle}
          onKeyPress={this.handleInputKeyPress}
          onClick={this.handleInputClick}
          onKeyDown={this.handleInputKeyDown}
          className="edit-cover-subtitle"
        />
      </div>
    )
  }

  renderInner() {
    const { uiStore, card } = this.props
    const { record } = card
    const { gridSettings } = uiStore
    const { gridW } = gridSettings
    return (
      <TopRightHolderWrapper maxWidth={gridW}>
        <TopRightHolder data-cy="EditCoverOptions">
          {!this.loading && (
            <div>
              <StyledEditTitle>
                <h3>Title</h3>
                {this.renderEditTitleInput()}
              </StyledEditTitle>
              <MediumBreak />
              <h3>Cover</h3>
              <QuickOptionSelector
                options={toJS(this.imageOptions)}
                onSelect={this.onImageOptionSelect}
              />
              <MediumBreak />
              <h3>Icon</h3>
              <CustomIconSelector
                selectedIcon={
                  <CollectionIcon type={record.custom_icon} size="lg" />
                }
                onSelectIcon={this.onCustomIconSelect}
              />
              <LabelContainer
                labelPlacement={'end'}
                control={
                  <Checkbox
                    onChange={this.onToggleShowIconOnCoverCheckbox}
                    checked={record.show_icon_on_cover}
                  />
                }
                label={
                  <div style={{ maxWidth: '582px', paddingTop: '9px' }}>
                    Show icon on cover
                  </div>
                }
              ></LabelContainer>
              <MediumBreak />
              <h3>Cover Effects</h3>
              {this.showFilters && (
                <QuickOptionSelector
                  options={filterOptions}
                  onSelect={this.onFilterOptionSelect}
                />
              )}
              <MediumBreak />
              {(record.isCollection || record.isLink) && (
                <div>
                  <h3>Subtitle</h3>
                  <StyledEditTitle>
                    {this.renderEditSubtitleInput()}
                  </StyledEditTitle>
                  <LabelContainer
                    labelPlacement={'end'}
                    control={
                      <Checkbox
                        onChange={this.onToggleSubtitleCheckbox}
                        checked={this.subtitleHidden}
                      />
                    }
                    label={
                      <div style={{ maxWidth: '582px', paddingTop: '9px' }}>
                        Hide subtitle
                      </div>
                    }
                  ></LabelContainer>
                  <br />
                  {record.isLink && (
                    <NamedActionButton
                      noPadding
                      marginBottom={20}
                      onClick={this.handleRestore}
                    >
                      Restore
                    </NamedActionButton>
                  )}
                </div>
              )}
            </div>
          )}
          <CloseButton
            size="lg"
            onClick={this.handleClose}
            data-cy="EditCoverCloseBtn"
          />
        </TopRightHolder>
      </TopRightHolderWrapper>
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
          this.parentCard &&
          ReactDOM.createPortal(this.renderInner(), this.parentCard)}
      </Fragment>
    )
  }
}

CardCoverEditor.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  isEditingCardCover: PropTypes.bool.isRequired,
}

CardCoverEditor.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CardCoverEditor.displayName = 'CardCoverEditor'

export default CardCoverEditor
