import PropTypes from 'prop-types'
import styled from 'styled-components'
import v from '~/utils/variables'

import FilestackUpload from '~/utils/FilestackUpload'

const PreviewContainer = styled.div`
  height: ${props => props.height}px;
  width: ${props => props.width}px;
`

class FilePreview extends React.Component {
  componentDidMount() {
    const { file } = this.props
    return FilestackUpload.preview(file.handle, 'filePreview')
  }

  render() {
    return (
      <PreviewContainer width={1000} height={600} id="filePreview">
      </PreviewContainer>
    )
  }
}

FilePreview.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string,
  }).isRequired,
}

export default FilePreview
