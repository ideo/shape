import GroupTitle from '~/ui/groups/GroupTitle'
import FilestackUpload from '~/utils/FilestackUpload'

import { fakeGroup } from '#/mocks/data'

jest.mock('../../../app/javascript/utils/FilestackUpload')

let props
let wrapper
let component

const fakeEvent = {
  preventDefault: jest.fn(),
}

describe('GroupTitle', () => {
  beforeEach(() => {
    props = {
      onSave: jest.fn(),
      group: fakeGroup,
      canEdit: true,
    }
    FilestackUpload.pickImage = jest
      .fn()
      .mockReturnValue(Promise.resolve({ filesUploaded: [] }))
    wrapper = shallow(<GroupTitle {...props} />)
    component = wrapper.instance()
  })

  describe('handleSave', () => {
    beforeEach(() => {
      component.editing = true
      component.handleSave(fakeEvent)
    })

    it('should save the group', () => {
      expect(props.group.save).toHaveBeenCalled()
    })

    it('should toggle editing', () => {
      expect(component.editing).toBeFalsy()
    })

    it('should call the onSave prop', () => {
      expect(props.onSave).toHaveBeenCalled()
    })
  })

  describe('handleEdit', () => {
    it('should toggle editing', () => {
      expect(component.editing).toBeFalsy()
      component.handleEdit(fakeEvent)
      expect(component.editing).toBeTruthy()
      component.handleEdit(fakeEvent)
      expect(component.editing).toBeFalsy()
    })
  })

  describe('handleAvatarEdit', () => {
    it('should call filestack picker', () => {
      component.handleAvatarEdit(fakeEvent)
      expect(FilestackUpload.pickImage).toHaveBeenCalled()
    })
  })

  describe('updateGroupAvatar', () => {
    it('should assign filestack file attributes to passed in data', () => {
      const data = { url: 'hello.jpg' }
      component.updateGroupAvatar(data)
      expect(props.group.assign).toHaveBeenCalledWith(
        'filestack_file_attributes',
        data
      )
    })
  })

  describe('renderControls', () => {
    describe('if user cannot edit', () => {
      it('should not render an edit icon', () => {
        props.canEdit = false
        wrapper.setProps(props)
        expect(wrapper.find('EditIconHolder').exists()).toBeFalsy()
        expect(wrapper.find('FormButton').exists()).toBeFalsy()
      })
    })

    describe('if currently editing', () => {
      it('should render the form button and not the edit icon', () => {
        component.editing = true
        wrapper.update()
        expect(wrapper.find('StyledFormButton').exists()).toBeTruthy()
        expect(wrapper.find('EditIconHolder').exists()).toBeFalsy()
      })
    })

    describe('if not currently editing', () => {
      it('should render the edit icon', () => {
        component.editing = false
        wrapper.update()
        expect(wrapper.find('EditIconHolder').exists()).toBeTruthy()
      })
    })
  })

  describe('render', () => {
    describe('on editing', () => {
      beforeEach(() => {
        component.editing = true
        wrapper.update()
      })

      it('should render autosize for the 2 inputs', () => {
        expect(wrapper.find('StyledAutosizeInput').length).toEqual(2)
      })
    })

    describe('on not editing', () => {
      beforeEach(() => {
        component.editing = false
        wrapper.update()
      })

      it('should render the inputs', () => {
        expect(wrapper.find('StyledHeading2').exists()).toBeTruthy()
        expect(wrapper.find('StyledSubduedTitled').exists()).toBeTruthy()
      })
    })
  })
})
