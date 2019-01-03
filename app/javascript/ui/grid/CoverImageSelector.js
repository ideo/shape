import { Fragment } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import CollectionCard from '~/stores/jsonApi/CollectionCard'
import CoverImageToggleIcon from '~/ui/icons/CoverImageToggleIcon'
import FilestackUpload from '~/utils/FilestackUpload'
import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import UploadIcon from '~/ui/icons/UploadIcon'
import XIcon from '~/ui/icons/XIcon'
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

@inject('apiStore', 'uiStore')
@observer
class CoverImageSelector extends React.Component {
  @observable
  open = false
  @observable
  options = []
  @observable
  parentCard = null

  componentDidMount() {
    const { card } = this.props
    // TODO don't like how id name is in two separate places
    runInAction(() => {
      this.parentCard = document.getElementById(`gridCard-${card.id}`)
    })
  }

  async fetchOptions() {
    const { apiStore, card } = this.props
    const res = await apiStore.fetch('collections', card.record.id)
    const collection = res.data
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
    const imageOptions = await this.fetchOptions()
    runInAction(
      () =>
        (this.options = [
          removeOption,
          ...imageOptions,
          backgroundOption,
          uploadOption,
        ])
    )
  }

  async createCard(file) {
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
      order: 1,
      height: 1,
      widht: 1,
      parent_id: collection.id,
      is_cover: true,
    }
    Object.assign(cardAttrs, attrs)
    const newLocalCard = new CollectionCard(cardAttrs, apiStore)
    newLocalCard.parent = collection
    const newCard = await newLocalCard.API_create()
    uiStore.addNewCard(newCard.record.id)
    apiStore.fetch('collections', collection.id, true)
  }

  handleClick = ev => {
    ev.preventDefault()
    this.populateAllOptions()
    runInAction(() => (this.open = !this.open))
  }

  onOptionSelect = async option => {
    const { apiStore, card } = this.props
    const collection = apiStore.find('collections', card.record.id)
    runInAction(() => (this.open = false))
    if (option.cardId) {
      const selectedCard = apiStore.find('collection_cards', option.cardId)
      selectedCard.is_cover = true
      await selectedCard.save()
    } else if (option.type === 'remove') {
      await collection.API_clearCollectionCover()
    } else if (option.type === 'upload') {
      FilestackUpload.pickImage({
        onSuccess: file => this.createCard(file),
      })
    }
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
              width={this.options.length * 32}
            >
              <QuickOptionSelector
                options={this.options}
                onSelect={this.onOptionSelect}
              />
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
