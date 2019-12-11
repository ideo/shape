// eslint-disable-next-line no-unused-vars
import React from 'react'
import RadioControl from '~/ui/global/RadioControl'
import { action } from '@storybook/addon-actions'

export default {
  title: 'UI|Global/RadioControl',
}

const props = {
  options: [
    {
      label: <span>Option A</span>,
      value: 'A',
      disabled: false,
    },
    {
      label: <span>Option B</span>,
      value: 'B',
      disabled: false,
    },
  ],
  onChange: action('clicked'),
  selectedValue: '',
  name: 'MyRadioControl',
}

const selectedProps = Object.assign({}, props, { selectedValue: 'A' })

export const NoneSelected = () => <RadioControl {...props} />
export const OneSelected = () => <RadioControl {...selectedProps} />
