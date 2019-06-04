import { clone } from 'lodash'

import fakeApiStore from '#/mocks/fakeApiStore'
import AdminUsersSummary from '~/ui/admin/AdminUsersSummary'
import { fakeUser } from '#/mocks/data'

const apiStore = fakeApiStore()
const props = {
  handleClick: jest.fn(),
  apiStore,
}

let wrapper
describe('AdminUsersSummary', () => {
  describe('with one Shape admin user', () => {
    beforeEach(() => {
      apiStore.shapeAdminUsers = [fakeUser]
      wrapper = shallow(<AdminUsersSummary.wrappedComponent {...props} />)
    })

    it('renders an avatar for the Shape admin user', () => {
      expect(wrapper.find('Avatar').length).toEqual(1)
    })

    it('renders an AddButton', () => {
      expect(wrapper.find('AddButton').exists()).toBe(true)
    })
  })

  describe('with five Shape admin users', () => {
    beforeEach(async () => {
      const fakeUser2 = clone(fakeUser)
      fakeUser2.id = '2'
      fakeUser2.first_name = 'Ana'
      fakeUser2.last_name = 'Gilardi'
      fakeUser2.name = 'Ana Gilardi'

      const fakeUser3 = clone(fakeUser)
      fakeUser3.id = '3'
      fakeUser3.first_name = 'Ulises'
      fakeUser3.last_name = 'Hanway'
      fakeUser3.name = 'Ulises Hanway'

      const fakeUser4 = clone(fakeUser)
      fakeUser4.id = '4'
      fakeUser4.first_name = 'Ham'
      fakeUser4.last_name = 'Shatford'
      fakeUser4.name = 'Ham Shatford'

      const fakeUser5 = clone(fakeUser)
      fakeUser5.id = '5'
      fakeUser5.first_name = 'Chance'
      fakeUser5.last_name = 'Schollar'
      fakeUser5.name = 'Chance Schollar'
      apiStore.shapeAdminUsers = [
        fakeUser,
        fakeUser2,
        fakeUser3,
        fakeUser4,
        fakeUser5,
      ]
      wrapper = shallow(<AdminUsersSummary.wrappedComponent {...props} />)
    })

    it('renders avatars for four of the Shape admin users', () => {
      expect(wrapper.find('.admin').length).toEqual(4)
    })
  })
})
