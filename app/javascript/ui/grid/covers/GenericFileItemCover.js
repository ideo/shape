import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import CornerIcon from '~/ui/icons/CornerIcon'
import { GridCardIconWithName, StyledFileCover } from '~/ui/grid/shared'
import FileIcon from '~/ui/grid/covers/FileIcon'

export const FileContainer = styled.div`
  background-color: ${v.colors.black};
  border-radius: 12px;
  height: 100%;
  overflow: hidden;
  position: relative;
  transform: rotate(8deg) translateX(30px) translateZ(0);
  transform-origin: 0 0;
  width: 90%;
  clip-path: polygon(0 0, 0 100%, 100% 100%, 100% 32%, 72% 0);
  img {
    width: 100%;
  }
`
FileContainer.displayName = 'StyledImageContainer'

const CornerContainer = styled.div`
  color: gray;
  height: 80px;
  position: absolute;
  right: 0;
  top: -1px;
  width: 80px;
`

@observer
class GenericFileItemCover extends React.Component {
  render() {
    const { item } = this.props
    const { filestack_file } = item
    return (
      <StyledFileCover>
        <FileContainer>
          <CornerContainer>
            <CornerIcon />
          </CornerContainer>
        </FileContainer>
        <GridCardIconWithName
          text={filestack_file.filename}
          icon={<FileIcon mimeType={item.filestack_file.mimetype} />}
        />
      </StyledFileCover>
    )
  }
}

GenericFileItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GenericFileItemCover
