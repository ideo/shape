import Enzyme, { shallow, render, mount } from 'enzyme'
import React from 'react'
import Adapter from 'enzyme-adapter-react-16'
import 'jest-styled-components'
import dotenv from 'dotenv'
import { transformRelativeToRootPath } from 'babel-plugin-root-import/build/helper'

// provide React globally in tests without having to "import"
global.React = React
// mocked version of fetch for all API requests
global.fetch = require('jest-fetch-mock')
// Make Enzyme functions available in all test files without importing
global.shallow = shallow
global.render = render
global.mount = mount
// https://github.com/entwicklerstube/babel-plugin-root-import/issues/41
global.relPath = (path) => (
  transformRelativeToRootPath(path, '/app/javascript', '~')
)

// don't use real .env values, just filler ones should do
dotenv.config({ path: '.env.example' })

Enzyme.configure({ adapter: new Adapter() })
