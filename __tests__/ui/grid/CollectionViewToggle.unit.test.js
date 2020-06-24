import CollectionViewToggle from '~/ui/grid/CollectionViewToggle'

import { fakeCollection } from '#/mocks/data'

let rerender, props, wrapper, holder

describe('CollectionViewToggle', () => {
  beforeEach(() => {
    props = {
      collection: fakeCollection,
    }
    rerender = () => {
      wrapper = shallow(<CollectionViewToggle {...props} />)
    }
    rerender()
  })

  describe('with collection in list mode', () => {
    beforeEach(() => {
      props.collection.viewMode = 'list'
      wrapper.setProps({ collection: props.collection })
      holder = wrapper.find('IconHolder').at(0)
    })

    it('should render a GridIcon', () => {
      expect(holder.props().show).toBe(true)
      expect(holder.find('GridIcon').exists()).toBe(true)
    })

    it('should call setViewMode = grid on click', () => {
      holder.simulate('click')
      expect(props.collection.setViewMode).toHaveBeenCalledWith('grid')
    })
  })

  describe('with collection in grid mode', () => {
    beforeEach(() => {
      props.collection.viewMode = 'grid'
      wrapper.setProps({ collection: props.collection })
      holder = wrapper.find('IconHolder').at(1)
    })

    it('should render a ListIcon', () => {
      expect(holder.props().show).toBe(true)
      expect(holder.find('ListIcon').exists()).toBe(true)
    })

    it('should call setViewMode = list on click', () => {
      holder.simulate('click')
      expect(props.collection.setViewMode).toHaveBeenCalledWith('list')
    })
  })
})
