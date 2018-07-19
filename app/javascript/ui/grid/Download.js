import PropTypes from 'prop-types'
import styled from 'styled-components'

import DownloadIcon from '~/ui/icons/DownloadIcon'
import Tooltip from '~/ui/global/Tooltip'

const IconHolder = styled.button`
  display: inline-block;
  margin-right: 5px;
  margin-top: 5px;
  vertical-align: top;
  width: 16px;
  height: 16px;
`

class Download extends React.Component {
  download = (ev) => {
    ev.preventDefault()
    const { file } = this.props
    if (file.url) {
      window.open(file.url, '_blank')
    }
  }

  render() {
    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title='Download'
        placement="bottom"
      >
        <IconHolder className="show-on-hover" onClick={this.download}>
          <DownloadIcon />
        </IconHolder>
      </Tooltip>
    )
  }
}
Download.propTypes = {
  file: PropTypes.shape({
    url: PropTypes.string
  }).isRequired,
}

export default Download
