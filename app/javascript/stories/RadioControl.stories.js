// eslint-disable-next-line no-unused-vars
import React from 'react'
import RadioControl from '~/ui/global/RadioControl'

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
  onChange: () => console.log('Selected a radio option'),
  selectedValue: 'A',
  name: 'MyRadioControl',
}

export const Selected = () => <RadioControl {...props} />
