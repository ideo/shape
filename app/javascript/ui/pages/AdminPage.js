import PageContainer from '~/ui/layout/PageContainer'
import { Heading1 } from '~/ui/global/styled/typography'

class AdminPage extends React.PureComponent {
  render() {
    return (
      <div>
        <PageContainer>
          <Heading1>Feedback</Heading1>
        </PageContainer>
      </div>
    )
  }
}

export default AdminPage
