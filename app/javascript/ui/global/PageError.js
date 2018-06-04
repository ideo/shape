import PropTypes from 'prop-types'

import { Heading1, DisplayText } from '~/ui/global/styled/typography'
import PageContainer from '~/ui/layout/PageContainer'

class PageError extends React.PureComponent {
  render() {
    const { error } = this.props
    let content
    if (error.status === 404) {
      content = 'This content does not exist!'
    } else if (error.status === 401) {
      content = 'You do not have access to this content. To get access, please ask the person who shared this link with you to add you as a viewer or editor.'
    }
    return (
      <div>
        <PageContainer>
          <div style={{ textAlign: 'center' }}>
            <Heading1>Oh no!</Heading1>
            <DisplayText>
              {content}
            </DisplayText>
          </div>
        </PageContainer>
      </div>
    )
  }
}
PageError.propTypes = {
  error: PropTypes.shape({
    status: PropTypes.number,
  }).isRequired
}

export default PageError
