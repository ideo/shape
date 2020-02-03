// eslint-disable-next-line no-unused-vars
import React from 'react'
import { action } from '@storybook/addon-actions'

import v from '~/utils/variables'
import TextButton from '~/ui/global/TextButton'

export default {
  title: 'UI|Global/ShapeTextButton',
}

export const DefaultTextButton = () => (
  <TextButton onClick={action('clicked')}>Action</TextButton>
)

export const ColoredTextButton = () => (
  <TextButton color={v.colors.primaryDark} onClick={action('clicked')}>
    Action
  </TextButton>
)

export const DifferentFontSizeTextButton = () => (
  <TextButton fontSizeEm={0.75} onClick={action('clicked')}>
    Action
  </TextButton>
)
