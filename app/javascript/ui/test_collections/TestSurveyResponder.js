import { PropTypes as MobxPropTypes } from 'mobx-react'
import TestDesigner from '~/ui/test_collections/TestDesigner'

class TestSurveyResponder extends React.Component {
  render() {
    const { collection } = this.props
    return <TestDesigner collection={collection} editing={false} />
  }
}

TestSurveyResponder.propTypes = {
  collection: MobxPropTypes.objectOrObservableObject.isRequired,
}

export default TestSurveyResponder
