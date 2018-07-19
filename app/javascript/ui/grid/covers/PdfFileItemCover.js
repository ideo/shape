import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import CornerIcon from '~/ui/icons/CornerIcon'
import { uiStore } from '~/stores'

export const StyledPdfCover = styled.div`
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
    position: absolute;
  }

  .card-menu {
    border-color: ${v.colors.blackLava};
    color: ${v.colors.blackLava};
  }
`
StyledPdfCover.displayName = 'StyledPdfCover'

export const ImageContainer = styled.div`
  border-radius: 12px;
  clip-path: ${props => (props.orientation === 'landscape' ?
    'polygon(0 0,0 100%,100% 100%,100% 23.5%,83% 0)' :
    'polygon(0 0,0 100%,100% 100%,100% 14.35%,81.5% 0)')};
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
  height: 50px;
  position: absolute;
  right: 0;
  top: -1px;
  width: 50px;
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
    console.log('orient', orientation)
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
          <img src={pdfCoverUrl} />
        </ImageContainer>
        <div className="filename">
          { filestack_file.filename }
        </div>
      </StyledPdfCover>
    )
  }
}

PdfFileItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PdfFileItemCover
