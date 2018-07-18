import { observer, PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'
import v from '~/utils/variables'
import { uiStore } from '~/stores'

export const StyledPdfCover = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  background: ${v.colors.gray};

  .filename {
    font-family: ${v.fonts.sans};
    color: ${v.colors.gray};
    position: absolute;
    bottom: 10px;
    background: white;
  }
`
StyledPdfCover.displayName = 'StyledPdfCover'

export const StyledCoverImg = styled.img`
  transform: rotate(-8deg) translateX(${props => props.x}) translateY(${props => props.y}) translateZ(0);
  transform-origin: 0 0;
  width: ${props => (props.orientation === 'portrait' ? 85 : 95)}%;
`
StyledCoverImg.displayName = 'StyledCoverImg'

@observer
class PdfFileItemCover extends React.Component {
  calculateCoverTranslation = () => {
    const { item } = this.props
    console.log(item, item.filestack_file.docinfo)
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
    console.log({ gridW, coverX, coverY, orientation })
    return { coverX, coverY, orientation }
  }

  render() {
    const { item } = this.props
    const { filestack_file, pdfCoverUrl } = item
    const { coverX, coverY, orientation } = this.calculateCoverTranslation()
    return (
      <StyledPdfCover>
        <StyledCoverImg
          src={pdfCoverUrl}
          x={`${coverX}px`}
          y={`${coverY}px`}
          orientation={orientation}
        />
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
