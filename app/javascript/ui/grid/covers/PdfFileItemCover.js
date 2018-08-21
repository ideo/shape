import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import CornerIcon from '~/ui/icons/CornerIcon'
import { GridCardIconWithName } from '~/ui/grid/shared'
import FileIcon from '~/ui/grid/covers/FileIcon'
import { uiStore } from '~/stores'

export const StyledPdfCover = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${v.colors.gray};

  .fileInfo {
    align-items: center;
    bottom: 0;
    color: ${v.colors.gray};
    display: flex;
    font-family: ${v.fonts.sans};
    font-size: 1rem;
    font-weight: 500;
    left: 0;
    max-height: 32px;
    position: absolute;
    width: 95%;
  }

  .fileName {
    display: inline-block;
    width: 75%;
    white-space: nowrap;
  }

  .card-menu {
    border-color: ${v.colors.blackLava};
    color: ${v.colors.blackLava};
  }
`
StyledPdfCover.displayName = 'StyledPdfCover'

export const ImageContainer = styled.div`
  border-radius: 12px;
  clip-path: ${props => (props.orientation === 'landscape'
    ? 'polygon(0 0,0 100%,100% 100%,100% 52px,245px 0)'
    : 'polygon(0 0,0 100%,100% 100%,100% 53px,214px 0)')};
  overflow: hidden;
  position: relative;
  transform: rotate(-8deg) translateX(${props => props.x}) translateY(${props => props.y}) translateZ(0);
  transform-origin: 0 0;
  width: ${props => (props.orientation === 'portrait' ? 85 : 95)}%;
  img {
    width: 100%;
  }
`
ImageContainer.displayName = 'StyledImageContainer'

const CornerContainer = styled.div`
  color: gray;
  height: 54px;
  position: absolute;
  right: 0;
  top: -3px;
  width: 54px;
`

@observer
class PdfFileItemCover extends React.Component {
  calculateCoverTranslation = () => {
    const { item } = this.props
    const { dimensions } = item.filestack_file.docinfo
    const { gridW, gridH } = uiStore.gridSettings
    let coverX = gridW * 0.01
    let coverY = gridH * 0.2
    let orientation = 'portrait'
    const ratio = dimensions.width / dimensions.height
    // if the image is more square/wide...
    if (ratio > 0.8) {
      const shrinkRatio = dimensions.width / (gridW * 0.95)
      const height = dimensions.height / shrinkRatio
      orientation = 'landscape'
      coverX = gridW * -0.05
      coverY = (gridH * 1.1) - height
    }
    return { coverX, coverY, orientation }
  }

  render() {
    const { item } = this.props
    const { filestack_file, pdfCoverUrl } = item
    const { coverX, coverY, orientation } = this.calculateCoverTranslation()
    return (
      <StyledPdfCover>
        <ImageContainer
          x={`${coverX}px`}
          y={`${coverY}px`}
          orientation={orientation}
        >
          <CornerContainer>
            <CornerIcon />
          </CornerContainer>
          <img src={pdfCoverUrl} alt="Pdf cover" />
        </ImageContainer>
        <div className="fileInfo">
          <GridCardIconWithName
            text={filestack_file.filename}
            icon={<FileIcon mimeType={item.filestack_file.mimetype} />}
          />
        </div>
      </StyledPdfCover>
    )
  }
}

PdfFileItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PdfFileItemCover
