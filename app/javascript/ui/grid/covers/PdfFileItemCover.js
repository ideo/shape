import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

export const StyledImageCover = styled.div`
  background-image: url(${props => props.url});
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  width: 100%;
  height: 100%;
`
StyledImageCover.displayName = 'StyledImageCover'

class PdfFileItemCover extends React.PureComponent {
  render() {
    const { item } = this.props
    const { pdfCoverUrl } = item
    return (
      <StyledImageCover url={pdfCoverUrl} />
    )
  }
}

PdfFileItemCover.propTypes = {
  item: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default PdfFileItemCover
