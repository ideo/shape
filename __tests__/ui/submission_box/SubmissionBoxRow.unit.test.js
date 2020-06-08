import {
  SubmissionBoxRowForItem,
  SubmissionBoxRowForTemplate,
} from '~/ui/submission_box/SubmissionBoxRow'
import AddTextIcon from '~/ui/icons/AddTextIcon'
import TextButton from '~/ui/global/TextButton'

import { fakeCollection } from '#/mocks/data'

let props, wrapper
describe('SubmissionBoxRowForItem', () => {
  beforeEach(() => {
    props = {
      type: {
        name: 'text',
        Icon: AddTextIcon,
      },
      onSelect: jest.fn(),
      rightSideComponent: <TextButton />,
    }
    wrapper = shallow(<SubmissionBoxRowForItem {...props} />)
  })

  it('renders item name with icon', () => {
    expect(wrapper.text()).toEqual('<AddTextIcon />Text Item')
  })

  it('calls onSelect when clicked', () => {
    wrapper.find('SubmissionBoxRow').simulate('click')
    expect(props.onSelect).toHaveBeenCalled()
  })

  it('renders rightSideComponent', () => {
    expect(wrapper.find('TextButton').exists()).toBe(true)
  })
})

describe('SubmissionBoxRowForTemplate', () => {
  beforeEach(() => {
    props = {
      template: fakeCollection,
      onSelect: jest.fn(),
      rightSideComponent: <TextButton />,
    }
    wrapper = shallow(<SubmissionBoxRowForTemplate {...props} />)
  })

  it('renders collection name', () => {
    expect(wrapper.find('SubmissionBoxRowText').text()).toEqual(
      props.template.name
    )
  })

  it('renders collection image', () => {
    expect(wrapper.find('ThumbnailHolder img').props().src).toEqual(
      props.template.cover.image_url
    )
  })

  it('calls onSelect when clicked', () => {
    wrapper.find('SubmissionBoxRow').simulate('click')
    expect(props.onSelect).toHaveBeenCalled()
  })

  it('renders rightSideComponent', () => {
    expect(wrapper.find('TextButton').exists()).toBe(true)
  })
})
