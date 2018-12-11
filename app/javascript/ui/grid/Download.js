import { PropTypes as MobxPropTypes } from 'mobx-react'
import styled from 'styled-components'

import Activity from '~/stores/jsonApi/Activity'
import DownloadIcon from '~/ui/icons/DownloadIcon'
import Tooltip from '~/ui/global/Tooltip'

const IconHolder = styled.a`
  display: inline-block;
  margin-right: 5px;
  margin-top: 5px;
  vertical-align: top;
  width: 16px;
  height: 16px;
`

class Download extends React.Component {
  trackDownload = ev => {
    const { record } = this.props
    const file = record.filestack_file
    if (file.url) {
      Activity.trackActivity('downloaded', record)
    }
  }

  render() {
    const { record } = this.props
    const file = record.filestack_file
    return (
      <Tooltip
        classes={{ tooltip: 'Tooltip' }}
        title="Download"
        placement="top"
      >
        <IconHolder
          className="show-on-hover"
          href={file.url}
          target="_blank"
          onClick={this.trackDownload}
          download
        >
          <DownloadIcon />
        </IconHolder>
      </Tooltip>
    )
  }
}
Download.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Download
