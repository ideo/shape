import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

// TODO styled cover shared with pdf cover
export const StyledCover = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${v.colors.gray};

  .filename {
    bottom: 10px;
    color: ${v.colors.gray};
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    font-weight: 500;
    left: 15px;
    position: absolute;
  }

  .card-menu {
    color: ${v.colors.blackLava};
  }
`
StyledCover.displayName = 'StyledCover'

export const FileContainer = styled.div`
  background-color: ${v.colors.blackLava};
  border-radius: 12px;
  height: 100%;
  transform: rotate(8deg) translateX(30px) translateZ(0);
  transform-origin: 0 0;
  width: 90%;
  img {
    width: 100%;
  }
`
FileContainer.displayName = 'StyledImageContainer'

@observer
class PdfFileItemCover extends React.Component {
  render() {
    const { item } = this.props
    const { filestack_file } = item
    return (
      <StyledCover>
        <FileContainer />
        <div className="filename">
          { filestack_file.filename }
        </div>
      </StyledCover>
    )
  }
}

PdfFileItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PdfFileItemCover
