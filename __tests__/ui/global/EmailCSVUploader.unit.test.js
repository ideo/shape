import EmailCSVUploader from '~/ui/global/EmailCSVUploader'

const props = {
  onComplete: jest.fn(),
}

let wrapper, component
describe('EmailCSVUploader', () => {
  beforeEach(() => {
    wrapper = shallow(
      <EmailCSVUploader {...props} />
    )
    component = wrapper.instance()
  })

  it('renders a CSVUploader', () => {
    expect(wrapper.find('CSVUploader').exists()).toBe(true)
  })

  it('can parse a matrix of emails (from a CSV)', () => {
    const csvData = [
      ['', '', 'a', 'b', 'jane@doe.com'],
      ['', '', 'v@b.net', 'v@b.net', ''],
      ['v@b.net', 'www.web.com', '123-xyz', 'a@bb.com', ''],
      ['other.format+email@myspace.org', '', 'Jane', 'Doe', 'jane@doe.com'],
    ]
    component.parseEmails(csvData)
    expect(props.onComplete).toHaveBeenCalledWith([
      // should find the unique 3 email values in order
      'jane@doe.com',
      'v@b.net',
      'a@bb.com',
      'other.format+email@myspace.org',
    ])
  })
})
