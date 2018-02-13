import Enzyme, { shallow, render, mount } from 'enzyme'
import React from 'react'
import Adapter from 'enzyme-adapter-react-16'

// provide React globally in tests without having to "import"
global.React = React
// mocked version of fetch for all API requests
global.fetch = require('jest-fetch-mock')
// Make Enzyme functions available in all test files without importing
global.shallow = shallow
global.render = render
global.mount = mount

Enzyme.configure({ adapter: new Adapter() })
