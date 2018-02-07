import { shallow } from 'enzyme'
import React from 'react'
import CollectionPage from '~/ui/pages/CollectionPage'

// don't use arrow function, preserve value of `this`
describe('CollectionPage', function() {
  beforeEach(() => {
    this.apiStore = {
      request: () => ({ then: () => {} }),
      find: () => this.apiStore.collections[0],
      collections: [
        { id: 1, name: 'xyz' }
      ]
    }
    this.fakeParams = { params: { id: 1 } }
  })

  it('renders the collection name', () => {
    const wrapper = shallow(<CollectionPage.wrappedComponent
      apiStore={this.apiStore}
      match={this.fakeParams}
    />)

    expect(wrapper.find('h1').at(0).text()).toBe('Collection: xyz')
  })
})
