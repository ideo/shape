import PropTypes from 'prop-types'
import { Heading1 } from '~/ui/global/styled/typography'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import OverdueBanner from '~/ui/layout/OverdueBanner'

class SettingsPage extends React.PureComponent {
  render() {
    return (
      <div>
        <Header />
        <PageContainer>
          <Heading1>Settings</Heading1>
          <OverdueBanner />
          {this.props.children}
        </PageContainer>
      </div>
    )
  }
}

SettingsPage.propTypes = {
  children: PropTypes.node,
}
SettingsPage.defaultProps = {
  children: null,
}

export default SettingsPage
