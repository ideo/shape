import _ from 'lodash'

import RolesSummary from '~/ui/layout/RolesSummary'

import {
  fakeUser,
} from '#/mocks/data'

const props = {
  editors: [fakeUser, fakeUser],
  viewers: [fakeUser, fakeUser],
  handleClick: jest.fn()
}

const tooManyEditorsProps = {
  editors: [fakeUser, fakeUser, fakeUser, fakeUser, fakeUser, fakeUser],
  viewers: [fakeUser],
  handleClick: jest.fn()
}

const onlyViewersProps = _.omit(props, ['editors'])

const onlyEditorsProps = _.omit(props, ['viewers'])

const emptyProps = {
  editors: [],
  viewers: []
}

let wrapper

describe('RolesSummary', () => {
  describe('with editors and viewers', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...props} />
      )
    })

    it('renders editors', () => {
      expect(wrapper.find('StyledBreadcrumb > Link')).toHaveLength(4)
    })

    it('renders viewers', () => {

    })

    it('renders manage roles button', () => {

    })
  })

  describe('with more editors than should show', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...tooManyEditorsProps} />
      )
    })

    it('renders only 5 editors', () => {

    })

    it('does not render any viewers', () => {

    })
  })

  describe('with only viewers', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...onlyViewersProps} />
      )
    })

    it('does not render editor label', () => {

    })

    it('renders manage roles button', () => {

    })
  })

  describe('with only editors', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...onlyEditorsProps} />
      )
    })

    it('does not render viewer label', () => {

    })

    it('renders manage roles button', () => {

    })
  })

  describe('with no viewers or editors', () => {
    beforeEach(() => {
      wrapper = shallow(
        <RolesSummary {...emptyProps} />
      )
    })

    it('renders manage roles button', () => {

    })

    it('does not render viewer or editor labels', () => {

    })
  })
})
