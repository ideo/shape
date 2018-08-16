import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import CornerIcon from '~/ui/icons/CornerIcon'
import GridCardIconWithName from '~/ui/grid/shared'
import FileIcon from '~/ui/grid/covers/FileIcon'

// TODO styled cover shared with pdf cover
export const StyledCover = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${v.colors.gray};
  .card-menu {
    color: ${v.colors.blackLava};
  }
`
StyledCover.displayName = 'StyledCover'

export const FileContainer = styled.div`
  background-color: ${v.colors.blackLava};
  border-radius: 12px;
  height: 100%;
  overflow: hidden;
  position: relative;
  transform: rotate(8deg) translateX(30px) translateZ(0);
  transform-origin: 0 0;
  width: 90%;
  clip-path: polygon(0 0,0 100%,100% 100%,100% 32%,72% 0);
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
      <StyledCover>
        <FileContainer>
          <CornerContainer>
            <CornerIcon />
          </CornerContainer>
        </FileContainer>
        <GridCardIconWithName
          text={filestack_file.filename}
          icon={<FileIcon mimeType={item.filestack_file.mimetype} />}
        />
      </StyledCover>
    )
  }
}

GenericFileItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default GenericFileItemCover
