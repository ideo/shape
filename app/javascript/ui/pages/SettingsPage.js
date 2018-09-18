import PropTypes from 'prop-types'
import { Heading1 } from '~/ui/global/styled/typography'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import v from '~/utils/variables'

class SettingsPage extends React.PureComponent {
  render() {
    return (
      <div>
        <Header />
        <PageContainer marginTop={v.headerHeightCompact}>
          <Heading1>Settings</Heading1>
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
