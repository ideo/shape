import PropTypes from 'prop-types'

class CollectionCoverItem extends React.PureComponent {
  render() {
    const { itemComponent } = this.props
    return (
      <div>
        <div>This will render a data item cover</div>
        {itemComponent}
      </div>
    )
  }
}

CollectionCoverItem.propTypes = {
  itemComponent: PropTypes.element.isRequired,
}

export default CollectionCoverItem
