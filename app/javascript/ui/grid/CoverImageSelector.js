import { Fragment } from 'react'
import ReactDOM from 'react-dom'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import CardActionHolder from '~/ui/icons/CardActionHolder'
import CoverImageToggleIcon from '~/ui/icons/CoverImageToggleIcon'
import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import UploadIcon from '~/ui/icons/UploadIcon'
import XIcon from '~/ui/icons/XIcon'
import v from '~/utils/variables'

const removeOption = {
  type: 'remove',
  title: 'remove image',
  icon: <XIcon />,
}
const uploadOption = {
  title: 'upload new image',
  icon: <UploadIcon />,
}
const backgroundOption = {
  type: 'remove',
  title: 'gray',
  color: v.colors.commonDark,
}

const TopRightHolder = styled.div`
  left: 216px;
  max-width: 192px;
  position: absolute;
  top: 46px;
  width: ${props => props.width}px;
  z-index: ${v.zIndex.gridCardTop};
`

@inject('apiStore')
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
    return collection.collection_cards
      .filter(ccard => ccard.record.isImage)
      .map(ccard => ({
        cardId: ccard.id,
        title: ccard.record.name,
        imageUrl: ccard.record.filestack_file_url,
      }))
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

  handleClick = ev => {
    ev.preventDefault()
    this.populateAllOptions()
    runInAction(() => (this.open = true))
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
    }
    apiStore.fetch('collections', collection.id, true)
  }

  render() {
    return (
      <Fragment>
        <CardActionHolder
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
}

export default CoverImageSelector
