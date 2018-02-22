import { PropTypes as MobxPropTypes } from 'mobx-react'

class TextItem extends React.Component {
  render() {
    const { item } = this.props
    return (
      <div>
        <span dangerouslySetInnerHTML={{ __html: item.content }} />
      </div>
    )
  }
}

TextItem.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TextItem
