import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'

const SelectedAreaSquare = styled.div.attrs(({ coords }) => ({
  style: {
    left: `${coords.left}px`,
    top: `${coords.top}px`,
    height: `${coords.height}px`,
    width: `${coords.width}px`,
  },
}))`
  background-color: rgba(192, 219, 222, 0.4);
  position: absolute;
  z-index: ${v.zIndex.clickWrapper};
`

@inject('uiStore')
@observer
class SelectedArea extends React.Component {
  // Props for the div that shows area selected
  get selectedAreaStyleProps() {
    const {
      selectedArea: { minX, maxX, minY, maxY },
    } = this.props.uiStore
    return {
      top: minY,
      left: minX,
      height: maxY - minY,
      width: maxX - minX,
    }
  }

  render() {
    return <SelectedAreaSquare coords={this.selectedAreaStyleProps} />
  }
}

SelectedArea.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SelectedArea
