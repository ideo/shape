import AdminFeedback from '~/ui/admin/AdminFeedback'
import PageContainer from '~/ui/layout/PageContainer'

class AdminPage extends React.PureComponent {
  render() {
    return (
      <div>
        <PageContainer>
          <AdminFeedback />
        </PageContainer>
      </div>
    )
  }
}

export default AdminPage
