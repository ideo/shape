import ReactMarkdown from 'react-markdown'

import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'
import termsMarkdown from '~/markdown/TermsOfUse'

class TermsPage extends React.PureComponent {
  render() {
    return (
      <div>
        <Header />
        <PageContainer>
          <ReactMarkdown source={termsMarkdown} />
        </PageContainer>
      </div>
    )
  }
}

export default TermsPage
