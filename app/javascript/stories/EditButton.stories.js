// eslint-disable-next-line no-unused-vars
import React from 'react'
import { action } from '@storybook/addon-actions'
import EditButton from '~/ui/reporting/EditButton'

export default {
  title: 'UI|Reporting/EditButton',
}

export const ShapeEditButton = () => <EditButton onClick={action('clicked')} />
