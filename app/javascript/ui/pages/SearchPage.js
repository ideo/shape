import { Fragment } from 'react'
import ReactRouterPropTypes from 'react-router-prop-types'
import { inject, observer, PropTypes as MobxPropTypes } from 'mobx-react'

import PageWithApi from '~/ui/pages/PageWithApi'
import Header from '~/ui/layout/Header'
import PageContainer from '~/ui/layout/PageContainer'

@inject('apiStore')
@observer
class SearchPage extends PageWithApi {
  requestPath = (props) => {
    const { match } = props
    return `search?query=${match.params.query}`
  }

  render() {
    return (
      <Fragment>
        <Header />
        <PageContainer>
          <div>
            You are searching now.
            {JSON.stringify(this.props.match)}
          </div>
        </PageContainer>
      </Fragment>
    )
  }
}

SearchPage.propTypes = {
  match: ReactRouterPropTypes.match.isRequired,
}
SearchPage.wrappedComponent.propTypes = {
  apiStore: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default SearchPage
