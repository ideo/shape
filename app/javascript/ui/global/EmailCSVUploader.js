import PropTypes from 'prop-types'
import _ from 'lodash'

import CSVUploader from '~/ui/global/CSVUploader'
import isEmail from '~/utils/isEmail'

class EmailCSVUploader extends React.Component {
  parseEmails = (csvData, filename) => {
    const { onComplete } = this.props
    const emails = _.uniq(_.filter(_.flattenDeep(csvData), d => (
      d && _.isString(d) && isEmail(d)
    )))
    console.log(emails)
    onComplete(emails)
  }

  render() {
    return (
      <CSVUploader
        onFileLoaded={this.parseEmails}
      />
    )
  }
}

EmailCSVUploader.propTypes = {
  onComplete: PropTypes.func.isRequired,
}

export default EmailCSVUploader
