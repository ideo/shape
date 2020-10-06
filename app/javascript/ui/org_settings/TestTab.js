import businessUnitsStore from './creativeDifferenceApis/BusinessUnitsCollection'
import { action, computed, observable, runInAction } from 'mobx'
import { observer } from 'mobx-react'
import Loader from '../layout/Loader'
import TestComponent from './TestComponent'

@observer
class TestTab extends React.Component {
  @observable
  loading = true

  async componentDidMount() {
    try {
      console.log('prefetch')
      const promise = businessUnitsStore.fetch()
      console.log(businessUnitsStore.isRequest('fetching'))
      await promise

      runInAction(() => {
        this.loading = false
      })
    } catch (error) {
      console.log(error)
    }
  }

  render() {
    console.log('BU STORE: ', businessUnitsStore)
    console.log(businessUnitsStore.request)

    if (this.loading) {
      return <Loader />
    }

    return (
      <div>
        <span>
          {businessUnitsStore.length}
          tasks
        </span>
        <ul>
          {businessUnitsStore.models.map(businessUnit => (
            <TestComponent key={businessUnit.id} businessUnit={businessUnit} />
          ))}
        </ul>
      </div>
    )
  }
}

export default TestTab
