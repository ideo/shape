import _ from 'lodash'
import PropTypes from 'prop-types'
import { action, observable } from 'mobx'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import PositionedBlankCard from '~/ui/grid/dragLayer/PositionedBlankCard'
import { isFile } from '~/utils/FilestackUpload'
import { FOAMCORE_CLICK_LAYER } from '~/utils/variables'
import GridCardBlank from '~/ui/grid/blankContentTool/GridCardBlank'

const ClickLayerWrapper = styled.div`
  height: 100%;
  width: 100%;
`

@inject('uiStore')
@observer
class FoamcoreDragLayer extends React.Component {
  constructor(props) {
    super(props)
  }

  get renderBct() {
    return null
    return <div>bct</div>
  }

  render() {
    const { uiStore } = this.props
    const { blankContentTool, blankContentToolIsOpen } = uiStore

    return (
      <ClickLayerWrapper
        data-empty-space-click
        className={FOAMCORE_CLICK_LAYER}
      >
        {this.renderBct}
      </ClickLayerWrapper>
    )
  }
}

FoamcoreDragLayer.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
  coordinatesForPosition: PropTypes.func.isRequired,
  hoveringOverCollection: PropTypes.bool.isRequired,
}

FoamcoreDragLayer.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default FoamcoreDragLayer
