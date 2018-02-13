import { Link } from 'react-router-dom'
import { inject, observer } from 'mobx-react'

import { apiStore } from '~/stores/index'
import withAuth from '~/utils/withAuth'

const CollectionList = ({ collections }) => (
  collections.map(c => (
    <div key={c.id}>
      <Link to={`/collections/${c.id}`}>
        {c.name}
      </Link>
      <hr />
    </div>
  ))
)

// Homepage component
@withAuth({
  onSuccess: () => apiStore.request('collections/1').then((data) => {
    apiStore.sync(data)
  })
})
@inject('apiStore')
@observer
class HomePage extends React.Component {
  render () {
    const { collections } = apiStore
    return (
      <div>
        <h1>Collection List</h1>

        <div>
          {collections.length === 0 ? 'loading' : 'not loading'}
        </div>
        <CollectionList collections={collections} />

      </div>
    )
  }
}

export default HomePage
