import { PropTypes as MobxPropTypes } from 'mobx-react'

import Activity from '~/stores/jsonApi/Activity'
import CardActionHolder from '~/ui/icons/CardActionHolder'
import DownloadIcon from '~/ui/icons/DownloadIcon'

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
      <a
        className="show-on-hover"
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={this.trackDownload}
        download
      >
        <CardActionHolder className="show-on-hover" tooltipText="Download">
          <DownloadIcon />
        </CardActionHolder>
      </a>
    )
  }
}
Download.propTypes = {
  record: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default Download
