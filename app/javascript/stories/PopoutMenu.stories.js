// eslint-disable-next-line no-unused-vars
import React from 'react'
import { action } from '@storybook/addon-actions'
import styled from 'styled-components'

import '!style-loader!css-loader!sass-loader!~/../../app/assets/stylesheets/global.scss'

import v from '~/utils/variables'
import PopoutMenu from '~/ui/global/PopoutMenu'

const Holder = styled.div`
  padding-top: 20px;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  width: 500px;
`

export default {
  title: 'UI|Global/PopoutMenu',
}

const menuItems = [
  {
    name: 'Banana',
  },
  {
    name: 'Apple',
  },
  {
    name: 'Pear',
  },
]

const props = {
  onClick: action('clicked'),
  menuItems,
  menuOpen: true,
  hideDotMenu: true,
}

const dotProps = {
  ...props,
  hideDotMenu: false,
}

export const DefaultPopoutMenu = () => (
  <Holder>
    <PopoutMenu {...props} />
  </Holder>
)

export const DotPopoutMenu = () => (
  <Holder>
    <PopoutMenu {...dotProps} />
  </Holder>
)

const filterProps = {
  ...props,
  menuItems: [
    {
      name: 'Filter by Tag',
      onClick: action('clicked'),
    },
    {
      name: 'Filter by Search Term',
      onClick: action('clicked'),
    },
  ],
  offsetPosition: { x: -160, y: -38 },
}

export const FilterMenu = () => (
  <Holder>
    <PopoutMenu {...filterProps} />
  </Holder>
)

import GlobeIcon from '~/ui/icons/GlobeIcon'
import InfoIcon from '~/ui/icons/InfoIcon'

const audienceSettingsProps = {
  ...props,
  menuItems: [
    {
      name: 'Baby Boomers',
      iconLeft: <GlobeIcon />,
      iconRight: <InfoIcon />,
    },
    {
      name: 'Millenials that like cheese',
      iconRight: <InfoIcon />,
    },
  ],
  width: 280,
  wrapperClassName: 'add-audience-menu',
}

export const AudienceSettingsWidgetMenu = () => (
  <Holder>
    <PopoutMenu {...audienceSettingsProps} />
  </Holder>
)

import CommentIcon from '~/ui/icons/CommentIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import SelectAllIcon from '~/ui/icons/SelectAllIcon'

const icons = [<CommentIcon />, <DuplicateIcon />, <SelectAllIcon />]

const menuItemsWithIcons = menuItems.map((menuItem, idx) => ({
  name: menuItem.name,
  iconRight: icons[idx],
}))

const actionMenuProps = {
  ...props,
  buttonStyle: 'card',
  location: 'GridCard',
  hideDotMenu: false,
  menuItems: menuItemsWithIcons,
  width: 250,
  wrapperClassName: 'card-menu',
}

export const ActionMenu = () => (
  <Holder>
    <PopoutMenu {...actionMenuProps} />
  </Holder>
)
