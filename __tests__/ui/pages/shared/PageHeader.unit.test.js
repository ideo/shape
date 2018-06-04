import PageHeader from '~/ui/pages/shared/PageHeader'
import fakeUiStore from '#/mocks/fakeUiStore'
import {


  fakeTextItem,
  fakeCollection,
} from '#/mocks/data'

describe('PageHeader', () => {
  let wrapper, component, props

  beforeEach(() => {
    const uiStore = fakeUiStore
    fakeCollection.isNormalCollection = true
    fakeCollection.breadcrumb = [{ id: 12 }]
    props = { record: fakeCollection, uiStore }

    wrapper = shallow(
      <PageHeader.wrappedComponent {...props} />
    )
    component = wrapper.instance()
  })

  describe('render', () => {
    describe('on the homepage', () => {
      beforeEach(() => {
        props.isHomepage = true
        wrapper.setProps(props)
      })

      it('should not render the breadcrumb', () => {
        expect(wrapper.find('Breadcrumb').prop('items').length).toEqual(0)
      })

      it('should render an EditableName with the record.name', () => {
        expect(wrapper.find('EditableName').props().name).toEqual(props.record.name)
      })
    })

    describe('for an editable item', () => {
      beforeEach(() => {
        fakeTextItem.can_edit = true
        props.record = fakeTextItem
        wrapper.setProps(props)
      })

      it('should render the breadcrumb', () => {
        expect(wrapper.find('Breadcrumb').prop('items').length).toBeGreaterThan(0)
      })

      it('should not render the roles', () => {
        expect(wrapper.find('RolesSummary').exists()).toBeTruthy()
      })

      it('should render the activity log icon', () => {
        expect(wrapper.find('ActivityLogButton').exists()).toBeTruthy()
      })

      it('should render the page menu', () => {
        expect(wrapper.find('PageMenu').exists()).toBeTruthy()
      })
    })

    describe('for a normal collection', () => {
      it('should render the breadcrumb', () => {
        expect(wrapper.find('Breadcrumb').prop('items').length).toBeGreaterThan(0)
      })

      it('passes canEdit through to EditableName', () => {
        expect(wrapper.find('EditableName').props().canEdit).toEqual(props.record.can_edit)
      })

      it('passes canEdit through to RolesSummary', () => {
        expect(wrapper.find('RolesSummary').props().canEdit).toEqual(props.record.can_edit)
      })
    })

    describe('for a user collection', () => {
      beforeEach(() => {
        props.record.isNormalCollection = false
        props.record.isUserCollection = true
        wrapper = shallow(
          <PageHeader.wrappedComponent {...props} />
        )
      })

      it('should not render roles', () => {
        expect(wrapper.find('RolesSummary').exists()).toBeFalsy()
      })

      it('should not render the page menu', () => {
        expect(wrapper.find('PageMenu').exists()).toBeFalsy()
      })
    })
  })

  describe('updateRecordName', () => {
    beforeEach(() => {
      component.updateRecordName('hello')
    })

    it('should set the record name to the value passed in', () => {
      expect(props.record.name).toEqual('hello')
    })

    it('should save the record', () => {
      expect(props.record.save).toHaveBeenCalled()
    })
  })

  describe('showObjectRoleDialog', () => {
    beforeEach(() => {
      props.uiStore.update.mockClear()
      props.uiStore.rolesMenuOpen = false
      component.showObjectRoleDialog()
    })

    it('should open the roles menu in the ui store', () => {
      expect(props.uiStore.update).toHaveBeenCalledWith(
        'rolesMenuOpen', true
      )
    })
  })
})
