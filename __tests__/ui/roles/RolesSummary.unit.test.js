import _ from 'lodash'

import RolesSummary from '~/ui/roles/RolesSummary'

import { fakeRole, fakeUser } from '#/mocks/data'

const emptyProps = {
  roles: [],
  handleClick: jest.fn(),
}

const editorRole = { ...fakeRole }
const viewerRole = { ...fakeRole }
viewerRole.name = 'viewer'

const editorsAndViewersProps = {
  roles: [editorRole, viewerRole],
  handleClick: jest.fn(),
}

const canEditProps = {
  ...editorsAndViewersProps,
  canEdit: true,
}

let wrapper
describe('RolesSummary', () => {
  describe('with editors and viewers', () => {
    beforeEach(() => {
      wrapper = shallow(<RolesSummary {...editorsAndViewersProps} />)
    })

    it('renders editors', () => {
      expect(
        wrapper
          .find('StyledRoleTitle')
          .at(0)
          .render()
          .text()
      ).toMatch(/editors/i)
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
    })

    it('renders viewers', () => {
      expect(
        wrapper
          .find('StyledRoleTitle')
          .at(1)
          .render()
          .text()
      ).toMatch(/viewers/i)
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
    })

    it('does not render StyledAddUserBtn by default', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(false)
    })
  })

  describe('with custom label', () => {
    beforeEach(() => {
      const newProps = {
        roles: [editorRole, { ...viewerRole, label: 'participant' }],
        handleClick: jest.fn(),
      }
      wrapper = shallow(<RolesSummary {...newProps} />)
    })

    it('renders viewers with custom label', () => {
      expect(
        wrapper
          .find('StyledRoleTitle')
          .at(1)
          .render()
          .text()
      ).toMatch(/participants/i)
    })
  })

  describe('with only viewers', () => {
    beforeEach(() => {
      const onlyViewersProps = _.merge({}, emptyProps, { roles: [viewerRole] })
      wrapper = shallow(<RolesSummary {...onlyViewersProps} />)
    })

    it('renders 2 viewers and label', () => {
      expect(wrapper.find('[className="viewer"]').length).toEqual(2)
      expect(wrapper.render().text()).toMatch(/viewers/i)
    })

    it('does not render editors label', () => {
      expect(wrapper.render().text()).not.toMatch(/editors/i)
    })
  })

  describe('with only editors', () => {
    beforeEach(() => {
      const props = _.merge({}, emptyProps, { roles: [editorRole] })
      wrapper = shallow(<RolesSummary {...props} />)
    })

    it('renders 2 editors and label', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(2)
      expect(wrapper.render().text()).toMatch(/editors/i)
    })

    it('does not render viewers', () => {
      expect(wrapper.render().text()).not.toMatch(/viewers/i)
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })
  })

  describe('with more editors than should show', () => {
    beforeEach(() => {
      editorRole.users = [
        fakeUser,
        fakeUser,
        fakeUser,
        fakeUser,
        fakeUser,
        fakeUser,
      ]
      const props = _.merge({}, editorsAndViewersProps, { roles: [editorRole] })
      wrapper = shallow(<RolesSummary {...props} />)
    })

    it('renders only 5 editors', () => {
      expect(wrapper.find('[className="editor"]').length).toEqual(5)
    })

    it('does not render any viewers or viewer label', () => {
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
      expect(wrapper.render().text()).not.toMatch(/viewer/i)
    })
  })

  describe('with no viewers or editors and canEdit', () => {
    beforeEach(() => {
      wrapper = shallow(<RolesSummary {...emptyProps} canEdit />)
    })

    it('does not render editor label', () => {
      expect(wrapper.render().text()).not.toMatch(/editors/i)
    })

    it('does not render viewer label', () => {
      expect(wrapper.render().text()).not.toMatch(/viewers/i)
    })

    it('does not render editors or viewers', () => {
      expect(wrapper.find('[className="editor"]').exists()).toBe(false)
      expect(wrapper.find('[className="viewer"]').exists()).toBe(false)
    })
  })

  describe('when user canEdit', () => {
    beforeEach(() => {
      wrapper = shallow(<RolesSummary {...canEditProps} />)
    })

    it('renders manage roles button with onClick', () => {
      expect(wrapper.find('StyledAddUserBtn').exists()).toBe(true)
      expect(wrapper.find('StyledAddUserBtn').props().onClick).toEqual(
        canEditProps.handleClick
      )
    })
  })
})
