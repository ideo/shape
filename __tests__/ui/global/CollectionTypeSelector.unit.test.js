import _ from 'lodash'
import CollectionTypeSelector from '~/ui/global/CollectionTypeSelector'
import CollectionIcon from '~/ui/icons/CollectionIcon'

import { fakeCollection } from '#/mocks/data'

const props = {
  children: <CollectionIcon />,
  collection: fakeCollection,
  location: 'CollectionCover',
}
let wrapper, rerender
const types = [
  'collection',
  'project',
  'method',
  'phase',
  'prototype',
  'profile',
  'challenge',
]

describe('CollectionTypeSelector', () => {
  beforeEach(() => {
    rerender = () => {
      wrapper = shallow(<CollectionTypeSelector {...props} />)
    }
    rerender()
  })

  it('renders the collection type options and selects one', () => {
    const collectionSelectorButton = wrapper
      .find('[data-cy="CollectionTypeSelector"]')
      .at(0)
    expect(collectionSelectorButton.exists()).toBeTruthy()

    collectionSelectorButton.simulate('click')

    expect(wrapper.instance().showPopoutMenu).toEqual(true)

    expect(wrapper.find('PopoutMenu')).toHaveLength(1)

    const popout = wrapper.find('PopoutMenu').at(0)

    expect(popout.props().menuItems.length).toEqual(types.length)
    expect(_.map(popout.props().menuItems, i => i.name)).toEqual(types)
  })

  describe('with 16-wide board collection', () => {
    beforeEach(() => {
      props.collection.isBigBoard = true
      rerender()
    })
    afterEach(() => {
      props.collection.isBigBoard = false
    })

    it('renders foamcore as the base collection type', () => {
      const foamcoreTypes = ['foamcore', ...types.slice(1)]
      const popout = wrapper.find('PopoutMenu').at(0)
      expect(_.map(popout.props().menuItems, i => i.name)).toEqual(
        foamcoreTypes
      )
    })
  })
})
