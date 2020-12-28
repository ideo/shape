import _ from 'lodash'
import PropTypes from 'prop-types'
import { Fragment } from 'react'
import { Flex, Box } from 'reflexbox'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, action, runInAction, toJS } from 'mobx'
import styled from 'styled-components'
import TextareaAutosize from 'react-autosize-textarea'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import FilestackUpload from '~/utils/FilestackUpload'
import Modal from '~/ui/global/modals/Modal'
import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import FontColorSelector from '~/ui/global/FontColorSelector'
import CollectionIconSelector from '~/ui/grid/CollectionIconSelector'
import InlineLoader from '~/ui/layout/InlineLoader'
import SingleCrossIcon from '~/ui/icons/SingleCrossIcon'
import UploadIcon from '~/ui/icons/UploadIcon'
import XIcon from '~/ui/icons/XIcon'
import v, { ITEM_TYPES, COLLECTION_CARD_TYPES } from '~/utils/variables'
// This must be imported last, or else it leads to a cryptic
// circular dependency issue
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import EditPencilIconLarge from '~/ui/icons/EditPencilIconLarge'
import { NamedActionButton } from '~/ui/global/styled/buttons'
import CheckboxWithLabel from '~/ui/global/CheckboxWithLabel'
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

const StyledEditTitle = styled.div`
  display: flex;
  max-width: 94%;
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

const BigBreak = styled.div`
  display: block;
  margin-bottom: 1.5rem;
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
  coverImageOptions = []
  @observable
  backgroundImageOptions = []
  @observable
  loading = false
  @observable
  cardTitle = ''
  @observable
  cardUrl = ''
  @observable
  hardcodedSubtitle = '' // overrides cover text set by text items
  @observable
  subtitleHidden = false

  constructor(props) {
    super(props)
    this.saveFontColor = _.debounce(this._saveFontColor, 2000)
  }

  componentDidMount() {
    const { card, uiStore } = this.props
    const { record } = card
    this.setObservableInputs()
    runInAction(() => {
      if (uiStore.isNewCard(record.id) && record.isLink) {
        this.populateAllImageOptions()
        uiStore.setEditingCardCover(card.id)
        uiStore.removeNewCard(record.id)
      }
    })
  }

  componentDidUpdate(prevProps) {
    const { isEditingCardCover, pageMenu, card } = this.props
    if (prevProps.isEditingCardCover !== isEditingCardCover) {
      const { record } = this

      if (isEditingCardCover) {
        // just opened
        if (pageMenu) {
          this.setObservableInputs()
          this.populateAllImageOptions()
        }
        return
      }

      let titleForComparison = record.name
      let cardOrRecord = record
      const data = {
        hardcodedSubtitle: this.hardcodedSubtitle,
        subtitleHidden: this.subtitleHidden,
      }
      if (this.cardIsLink) {
        cardOrRecord = card
        titleForComparison = _.get(card, 'cover.hardcoded_title')
        // editing a link means you're editing the cover.hardcoded_title
        data.hardcodedTitle = this.cardTitle
      } else {
        // editing a record means you're editing the record.name
        data.name = this.cardTitle
      }

      if (record.isLink) {
        data.url = this.cardUrl
      }

      if (
        titleForComparison === this.cardTitle &&
        cardOrRecord.subtitle === this.hardcodedSubtitle &&
        cardOrRecord.subtitleHidden === this.subtitleHidden &&
        (!record.isLink || record.url === this.cardUrl)
      ) {
        return
      }

      // only update when you close the editor and there are changes
      cardOrRecord.API_updateNameAndCover(data)
    }
  }

  componentWillUnmount() {
    this.saveFontColor.flush()
  }

  get record() {
    return this.props.card.record
  }

  @action
  setLoading(val) {
    this.loading = val
  }

  get recordIsCollection() {
    return this.props.card.record.internalType === 'collections'
  }

  get cardIsLink() {
    return (
      this.recordIsCollection &&
      this.props.card.type === COLLECTION_CARD_TYPES.LINK
    )
  }

  fetchOptions() {
    const { record } = this
    if (!this.recordIsCollection) {
      return
    }
    const collection = record
    // fetch the full collection to get the styles
    collection.refetch()
    return collection.API_fetchCards({ hidden: true, per_page: 10 })
  }

  get coverImageBaseOptions() {
    const { record } = this
    if (!this.recordIsCollection) {
      if (!record.previous_thumbnail_urls) return []
      return record.previous_thumbnail_urls.map(url => ({
        title: 'previous image',
        imageUrl: url,
      }))
    }
    return this.imageBaseOptions(record.sortedCoverCards)
  }

  get backgroundImageBaseOptions() {
    const { record } = this
    const { backgroundImageUrl, sortedBackgroundCards } = record
    if (_.isEmpty(sortedBackgroundCards) && backgroundImageUrl) {
      let imageUrl = backgroundImageUrl
      if (_.includes(imageUrl, 'cdn.filestackcontent.com')) {
        const handle = _.last(imageUrl.split('/'))
        imageUrl = FilestackUpload.imageUrl({
          handle,
          filestackOpts: { resize: { width: 128 } },
        })
      }
      return [
        {
          title: 'inherited background',
          imageUrl,
        },
      ]
    }
    return this.imageBaseOptions(sortedBackgroundCards)
  }

  imageBaseOptions(imageCards) {
    if (!this.recordIsCollection) {
      return []
    }
    return _.take(
      imageCards.map(card => ({
        cardId: card.id,
        title: card.record.name,
        imageUrl: card.record.imageUrl({ resize: { width: 128 } }),
      })),
      9
    )
  }

  async populateAllImageOptions() {
    const { record } = this
    this.setLoading(true)
    await this.fetchOptions()
    this.setLoading(false)

    let bgOption = null
    if (this.recordIsCollection && !this.cardIsLink) {
      bgOption = collectionBackgroundOption
    } else if (record.isLink) {
      bgOption = linkBackgroundOption
    }
    runInAction(() => {
      const options = [removeOption, ...this.coverImageBaseOptions]
      if (bgOption) options.push(bgOption)
      options.push(uploadOption)
      this.coverImageOptions = options

      this.backgroundImageOptions = [
        removeOption,
        ...this.backgroundImageBaseOptions,
        uploadOption,
      ]
    })
  }

  createCard = async (file, type = 'cover') => {
    const { apiStore, uiStore, card, pageMenu } = this.props
    const collection = card.record
    const isCover = type === 'cover'
    const isBackground = type === 'background'
    if (isCover) {
      await collection.API_clearCover()
    }
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
      is_cover: isCover,
      is_background: isBackground,
      hidden: true,
      section_type: type,
    }
    Object.assign(cardAttrs, attrs)
    const newCard = new CollectionCard(cardAttrs, apiStore)
    newCard.parent = collection
    this.setLoading(true)
    await newCard.API_create()
    // get collection with new collection_cover info attached
    apiStore.fetch('collections', collection.id, true)
    if (isBackground && pageMenu) {
      // set this, which otherwise happens on page load
      uiStore.setBodyBackgroundImage(collection.backgroundImageUrl)
    }
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
  changeUrl = ev => {
    this.cardUrl = ev.target.value
  }

  @action
  changeHardcodedSubtitle = ev => {
    this.hardcodedSubtitle = ev.target.value
  }

  @action
  onToggleSubtitleCheckbox = () => {
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
    const { record } = this
    const meta = await parseURLMeta(record.url)
    runInAction(() => {
      this.hardcodedSubtitle = meta.description
      this.cardTitle = meta.title
    })
  }

  @action
  setObservableInputs = () => {
    const { card } = this.props
    const { record } = this
    const { name } = record
    if (this.cardIsLink) {
      this.cardTitle = card.titleForEditing || name
      this.hardcodedSubtitle = card.subtitleForEditing
      this.subtitleHidden = card.subtitleHidden
    } else if (record.isCollection) {
      this.cardTitle = name || record.url
      this.hardcodedSubtitle = record.subtitleForEditing
      this.subtitleHidden = record.subtitleHidden
    } else if (record.isLink) {
      this.cardTitle = name || record.url
      this.cardUrl = record.url
      this.hardcodedSubtitle = record.content
      this.subtitleHidden = record.subtitleHidden
    }
  }

  async clearCover() {
    const { card } = this.props
    const { recordIsCollection } = this
    if (this.cardIsLink || recordIsCollection) {
      const cardOrRecord = this.cardIsLink ? card : card.record
      return cardOrRecord.API_clearCover()
    }
    const item = card.record
    item.thumbnail_url = ''
    return item.save()
  }

  async clearBackground() {
    const collection = this.props.card.record
    return collection.API_clearBackgroundImage()
  }

  onImageOptionSelect = async option => {
    const { apiStore, card } = this.props
    const { recordIsCollection } = this
    // if card's cover is already set, then edit its own
    if (option.cardId) {
      const selectedCard = apiStore.find('collection_cards', option.cardId)
      if (this.cardIsLink) {
        card.cover_card_id = option.cardId
        card.save()
        return
      }
      await selectedCard.patch({ attributes: { is_cover: true } })
    } else if (option.type === 'remove') {
      await this.clearCover()
    } else if (option.type === 'upload') {
      const afterPickAction = recordIsCollection
        ? this.createCard
        : this.changeCover
      FilestackUpload.pickImage({
        onSuccess: file => afterPickAction(file),
      })
    } else if (!recordIsCollection && option.imageUrl) {
      // we are picking a previous_thumbnail_url
      const item = card.record
      // update back to the selected one
      item.thumbnail_url = option.imageUrl
      item.save()
    }
    if (recordIsCollection) {
      card.record.refetch()
    }
  }

  onBackgroundImageOptionSelect = async option => {
    const { apiStore, card } = this.props
    const collection = card.record

    if (option.cardId) {
      const selectedCard = apiStore.find('collection_cards', option.cardId)
      await selectedCard.patch({ attributes: { is_background: true } })
    } else if (option.type === 'remove') {
      await collection.API_clearBackgroundImage()
    } else if (option.type === 'upload') {
      FilestackUpload.pickImage({
        onSuccess: file => this.createCard(file, 'background'),
      })
    }
    // The cover effects should be off by defaulting when selecting cover image
    await card.API_updateCardFilter('nothing')
    collection.refetch()
  }

  onFilterOptionSelect = async option => {
    const { card } = this.props
    await card.API_updateCardFilter(option.type)
  }

  onCustomIconSelect = iconName => {
    const { record } = this
    record.icon = iconName
    record.save()
  }

  @action
  onSelectTitleFontColor = ({ hex }) => {
    const { record } = this
    // set immediately to reflect in UI
    record.collection_style.font_color = hex
    this.saveFontColor('record', hex)
  }

  @action
  onSelectCoverFontColor = ({ hex }) => {
    const { card } = this.props
    // set immediately to reflect in UI
    card.font_color = hex
    this.saveFontColor('card', hex)
  }

  _saveFontColor = (type, hex) => {
    let obj
    if (type === 'record') {
      obj = this.record
    } else {
      obj = this.props.card
    }
    obj.patch({ cancel_sync: true, attributes: { font_color: hex } })
  }

  onTogglePropagate = field => ev => {
    const { checked } = ev.target
    const { record } = this
    const fieldName = `propagate_${field}`
    record[fieldName] = checked
    record.patch({ cancel_sync: true, attributes: { [fieldName]: checked } })
  }

  onToggleShowIconOnCoverCheckbox = () => {
    const { record } = this
    record.show_icon_on_cover = !record.show_icon_on_cover
    record.save()
  }

  get showFilters() {
    const { record } = this
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

  renderEditUrlInput() {
    return (
      <div>
        <TextareaAutosize
          maxRows={3}
          value={this.cardUrl}
          placeholder="url"
          onChange={this.changeUrl}
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
    const { card } = this.props
    const { record, recordIsCollection, loading } = this

    if (loading) {
      return (
        <div
          data-cy="EditCoverOptions"
          style={{ marginTop: '40px', paddingTop: '80px' }}
        >
          <InlineLoader />
        </div>
      )
    }

    // the right column is only needed for collection settings
    const leftColumnWidth = recordIsCollection ? [1, 0.425] : 1

    return (
      <div>
        <StyledEditTitle>
          <h3>Title</h3>
          {this.renderEditTitleInput()}
        </StyledEditTitle>
        <BigBreak />
        <Flex wrap w={1} data-cy="EditCoverOptions">
          <Box w={leftColumnWidth}>
            <h3>Cover Image</h3>
            <QuickOptionSelector
              options={toJS(this.coverImageOptions)}
              onSelect={this.onImageOptionSelect}
            />

            <MediumBreak />
            <h3>Cover Effects</h3>
            {this.showFilters && (
              <QuickOptionSelector
                options={filterOptions}
                onSelect={this.onFilterOptionSelect}
              />
            )}

            <MediumBreak />
            <h3>Cover Font Color</h3>
            <FontColorSelector
              fontColor={card.font_color}
              defaultFontColor={v.colors.white}
              onSelect={this.onSelectCoverFontColor}
            />

            {(recordIsCollection || record.isLink) && (
              <Fragment>
                <MediumBreak />
                <h3>Subtitle</h3>
                <StyledEditTitle>
                  {this.renderEditSubtitleInput()}
                </StyledEditTitle>

                <CheckboxWithLabel
                  onChange={this.onToggleSubtitleCheckbox}
                  checked={this.subtitleHidden}
                  label="Hide subtitle"
                />
                <br />
                {record.isLink && (
                  <Fragment>
                    <MediumBreak />
                    <h3>URL</h3>
                    <StyledEditTitle>
                      {this.renderEditUrlInput()}
                    </StyledEditTitle>
                    <MediumBreak />

                    <NamedActionButton
                      noPadding
                      marginBottom={20}
                      onClick={this.handleRestore}
                    >
                      Restore
                    </NamedActionButton>
                  </Fragment>
                )}
              </Fragment>
            )}
          </Box>
          {recordIsCollection && !this.cardIsLink && (
            <Box w={[1, 0.425]} ml={[0, 64]}>
              <MediumBreak />
              <h3>Background Image</h3>
              <QuickOptionSelector
                options={toJS(this.backgroundImageOptions)}
                onSelect={this.onBackgroundImageOptionSelect}
              />
              <CheckboxWithLabel
                onChange={this.onTogglePropagate('background_image')}
                checked={record.propagate_background_image}
                label="Apply to all nested collections"
              />

              <MediumBreak />
              <h3>Title Font Color</h3>
              <FontColorSelector
                fontColor={record.fontColor}
                defaultFontColor={v.colors.black}
                onSelect={this.onSelectTitleFontColor}
                onTogglePropagate={this.onTogglePropagate('font_color')}
                propagate={record.propagate_font_color}
              />
              <MediumBreak />
              <h3>Icon</h3>
              <CollectionIconSelector
                selectedIcon={<CollectionIcon type={record.icon} size="lg" />}
                onSelectIcon={this.onCustomIconSelect}
              />
              <CheckboxWithLabel
                onChange={this.onToggleShowIconOnCoverCheckbox}
                checked={record.show_icon_on_cover}
                label="Show icon on cover"
              />
            </Box>
          )}
        </Flex>
      </div>
    )
  }

  get title() {
    const { card } = this.props
    const { recordIsCollection } = this
    let type = recordIsCollection ? 'Collection' : 'Cover'
    if (card.isLinkCard && recordIsCollection) {
      type = 'Link'
    }
    return `${type} Settings`
  }

  render() {
    const { title } = this
    const { isEditingCardCover, pageMenu } = this.props

    return (
      <Fragment>
        {!pageMenu && (
          <CardActionHolder
            active={this.isEditingCardCover}
            className="show-on-hover"
            tooltipText={`edit ${_.lowerCase(title)}`}
            role="button"
            onClick={this.handleClick}
          >
            <EditPencilIconLarge />
          </CardActionHolder>
        )}
        {isEditingCardCover && (
          <Modal open onClose={this.handleClose} title={title}>
            {this.renderInner()}
          </Modal>
        )}
      </Fragment>
    )
  }
}

CardCoverEditor.propTypes = {
  card: MobxPropTypes.objectOrObservableObject.isRequired,
  isEditingCardCover: PropTypes.bool.isRequired,
  pageMenu: PropTypes.bool,
}
CardCoverEditor.defaultProps = {
  pageMenu: false,
}

CardCoverEditor.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

CardCoverEditor.displayName = 'CardCoverEditor'

export default CardCoverEditor
