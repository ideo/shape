import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

class TextItem extends React.Component {
  render() {
    return (
      <div>{this.props.item.content}</div>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TextItem
