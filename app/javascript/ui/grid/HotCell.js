import PropTypes from 'prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'
import { observable, runInAction } from 'mobx'
import styled from 'styled-components'

import CollectionIcon from '~/ui/icons/htc/CollectionIcon'
import FileIcon from '~/ui/icons/htc/FileIcon'
import TemplateIcon from '~/ui/icons/htc/TemplateIcon'
import TextIcon from '~/ui/icons/htc/TextIcon'
import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const Quadrant = styled.div`
  background-color: ${v.colors.primaryLight};
  box-sizing: border-box;
  float: left;
  height: calc(50% - 1px);
  padding-bottom: 14%;
  padding-left: 20%;
  padding-right: 20%;
  padding-top: 14%;
  width: calc(50% - 1px);
`

const Container = styled.div`
  height: 100%;
  width: 100%;

  ${Quadrant}:nth-child(even) {
    margin-left: 1px;
  }

  ${Quadrant}:nth-child(3),
  ${Quadrant}:nth-child(4) {
    margin-top: 1px;
  }
`

@inject('uiStore')
@observer
class HotCell extends React.Component {
  @observable
  isDraggedOver = false

  render() {
    return (
      <Container>
        <Quadrant>
          <TextIcon />
        </Quadrant>
        <Quadrant>
          <FileIcon />
        </Quadrant>
        <Quadrant>
          <CollectionIcon />
        </Quadrant>
        <Quadrant>
          <TemplateIcon />
        </Quadrant>
      </Container>
    )
  }
}

HotCell.propTypes = {
  visible: PropTypes.bool,
  card: MobxPropTypes.objectOrObservableObject,
  uploading: PropTypes.bool,
  interactionType: PropTypes.string,
  numColumns: PropTypes.number,
  emptyRow: PropTypes.bool,
  handleRemoveRowClick: PropTypes.func,
  handleInsertRowClick: PropTypes.func,
  row: PropTypes.number,
}
HotCell.defaultProps = {
  card: null,
  visible: false,
  uploading: false,
  interactionType: 'drag',
  numColumns: 4,
  emptyRow: false,
  handleRemoveRowClick: null,
  handleInsertRowClick: null,
  row: 0,
}
HotCell.wrappedComponent.propTypes = {
  uiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

HotCell.displayName = 'HotCell'

export default HotCell
