import PropTypes from 'prop-types'
import ReactDOM from 'react-dom'
import {
  computed
} from 'mobx'
import {
  observer,
  PropTypes as MobxPropTypes
} from 'mobx-react'
import PaddedCardCover from './PaddedCardCover'

class LegendItemCover extends React.Component {
  constructor(props) {
    super(props)
  }

  componentDidMount() {
    const { height, item } = this.props
    this.checkTextAreaHeight(height)
    this.setState({ item })
  }

  render() {
    console.log(this.props.item)
    return (<PaddedCardCover>
      Legend Item here
    </PaddedCardCover>)
  }
}

LegendItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
  height: PropTypes.number,
}

// defaultProps

export default LegendItemCover
