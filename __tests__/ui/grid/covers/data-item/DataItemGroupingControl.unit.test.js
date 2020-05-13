import DataItemGroupingControl from '~/ui/grid/covers/data-item/DataItemGroupingControl'
import { fakeGroup } from '#/mocks/data'

const props = {
  group: fakeGroup,
  canEdit: true,
  editing: false,
}

let wrapper, component

const render = (overrides = {}) => {
  wrapper = shallow(<DataItemGroupingControl {...props} {...overrides} />)
  component = wrapper.instance()
}

describe('DataItemGroupingControl', () => {
  beforeEach(() => {
    props.onEditClick = jest.fn()
    props.saveSettings = jest.fn()
    render()
  })

  describe('componentDidUpdate', () => {
    it('should set editingGroup to false if props.editing became false', () => {
      render({ editing: true })
      component.toggleEditingGroup(true)
      expect(component.editingGroup).toEqual(true)
      wrapper.setProps({ editing: false })
      expect(component.editingGroup).toEqual(false)
    })
  })

  describe('with a group prop', () => {
    it('should render the group control', () => {
      expect(wrapper.find('StyledFilterIcon').exists()).toBeFalsy()
      expect(wrapper.find('StyledTrashIcon').exists()).toBeTruthy()
      expect(wrapper.find('StyledGroupControl').exists()).toBeTruthy()
    })

    it('should delete the group when clicking the trash', () => {
      const trash = wrapper.find('StyledTrashIcon')
      trash.simulate('click')
      // this should turn off
      expect(component.editingGroup).toEqual(false)
      expect(props.saveSettings).toHaveBeenCalledWith({
        // this will delete the grouping
        groupings: [],
      })
    })

    describe('onSelectGrouping', () => {
      it('should set the grouping', () => {
        component.onSelectGrouping({ id: '99', name: 'Xyz' })
        expect(props.saveSettings).toHaveBeenCalledWith({
          // this will save the grouping
          groupings: [{ id: '99', type: 'Group' }],
        })
      })
    })
  })

  describe('with no group prop', () => {
    beforeEach(() => {
      render({ group: null })
    })

    it('should just render the filter', () => {
      expect(wrapper.find('StyledFilterIcon').exists()).toBeTruthy()
      expect(wrapper.find('StyledTrashIcon').exists()).toBeFalsy()
      expect(wrapper.find('StyledGroupControl').exists()).toBeFalsy()
    })

    describe('clicking the filter icon', () => {
      it('should set editingGroup to true', () => {
        expect(component.editingGroup).toEqual(false)
        const filter = wrapper.find('StyledFilterIcon')
        filter.simulate('click')
        expect(component.editingGroup).toEqual(true)
        // editing prop would come through externally
        wrapper.setProps({ editing: true })
        // group control should now be visible
        expect(wrapper.find('StyledGroupControl').exists()).toBeTruthy()
      })
    })
  })

  describe('without edit access', () => {
    beforeEach(() => {
      render({ canEdit: false })
    })

    it('should not render trashIcon or filterIcon', () => {
      expect(wrapper.find('StyledTrashIcon').exists()).toBeFalsy()
      expect(wrapper.find('StyledFilterIcon').exists()).toBeFalsy()
    })
  })
})
