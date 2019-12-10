import React from 'react'
import { configure, addDecorator, load, addParameters } from '@storybook/react'

import defaultNotes from './instructions.md'
addParameters({ notes: defaultNotes })

// https://storybook.js.org/docs/basics/writing-stories/#decorators
// Example global decorator to center all stories
addDecorator(storyFn => <div style={{ textAlign: 'center' }}>{storyFn()}</div>)

configure(
  require.context('../app/javascript/stories', true, /\.stories\.(js|ts)$/),
  module
)
