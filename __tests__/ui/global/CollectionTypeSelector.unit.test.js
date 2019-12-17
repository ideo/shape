import _ from 'lodash'
import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'
import CollectionIcon from '~/ui/icons/CollectionIcon'

import { fakeCollection } from '#/mocks/data'

const props = {
  collection: fakeCollection,
  position: 'relative',
  children: <CollectionIcon />,
}
let wrapper, component
const types = ['collection', 'project', 'method', 'prototype', 'profile']

describe('CollectionTypeSelector', () => {
  beforeEach(() => {
    wrapper = shallow(<CollectionTypeSelector {...props} />)
    component = wrapper.instance()
  })

  it('renders the collection type options and selects one', () => {
    const collectionSelectorButton = wrapper
      .find('[data-cy="CollectionTypeSelector"]')
      .at(0)
    collectionSelectorButton.simulate('click')
    const popout = wrapper.find('PopoutMenu').at(0)

    expect(popout.props().menuItems.length).toEqual(types.length)
    expect(_.map(popout.props().menuItems, i => i.name)).toEqual(types)

    component.openPopoutMenu()

    expect(component.showPopoutMenu).toEqual(true)

    component.updateCollectionType('prototype')

    expect(
      component.props.collection.API_selectCollectionType
    ).toHaveBeenCalled()
  })
})
