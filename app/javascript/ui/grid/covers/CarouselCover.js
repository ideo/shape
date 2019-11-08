import PropTypes from 'prop-types'
import { observable, runInAction } from 'mobx'
import { inject, observer } from 'mobx-react'

@inject('apiStore')
@observer
class CarouselCover extends React.Component {
  @observable
  records = []

  async componentDidMount() {
    const { apiStore, collectionId } = this.props

    const res = await apiStore.fetch('collections', collectionId)
    const { data } = res
    const { collection_cards } = data
    console.log({ res })
    console.log({ data })
    console.log({ collection_cards })
    console.log(collection_cards.length)
    // Why is the collection card length 0?
    runInAction(() => {
      this.records = collection_cards
    })
  }

  get currentCarouselRecord() {
    return this.records[0]
  }

  render() {
    if (!this.records.length > 0) return <div>Loading...</div>

    console.log('in render, records: ', this.records)
    return (
      <div>
        {/* {this.currentCarouselRecord} */}
        {this.records.map(record => (
          <span>record ${record.id}</span>
        ))}
      </div>
    )
  }
}

CarouselCover.propTypes = {
  collectionId: PropTypes.number.isRequired,
}

export default CarouselCover
