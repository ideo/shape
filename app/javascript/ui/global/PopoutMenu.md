The Popout Menu is the primary way to render a dropdown in the UI and is used
in multiple places. One use of it is the action menu that's rendered for
grid cards which includes the 3 dots to open the menu. The menu can also
be rendered without the 3 dots and have another handler to open it by using
the `menuOpen` prop.


### Default Popout Menu

```jsx padded
import { StyleguideHolder } from '../../ui/global/styled/layout'
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
  onClick: () => {},
  menuItems,
  menuOpen: true,
  hideDotMenu: true,
}
;<StyleguideHolder><PopoutMenu {...props} /></StyleguideHolder>
```

### Action menu

The action menu displays on the grid card top right actions as well as when
you right click a grid card. It has icons that display to the right of each item
and has some specific styling around it's dot dot menu.

```jsx padded
import CommentIcon from '../../ui/icons/CommentIcon'
import DuplicateIcon from '../../ui/icons/DuplicateIcon'
import SelectAllIcon from '../../ui/icons/SelectAllIcon'
import { StyleguideHolder } from '../../ui/global/styled/layout'
const icons = [<CommentIcon />, <DuplicateIcon />, <SelectAllIcon />]
const menuItems = [
  {
    name: 'Comment',
  },
  {
    name: 'Duplicate',
  },
  {
    name: 'Select',
  },
]
const menuItemsWithIcons = menuItems.map((menuItem, idx) => ({
  name: menuItem.name,
  iconRight: icons[idx],
}))
const actionMenuProps = {
  onClick: () => {},
  menuOpen: true,
  hideDotMenu: true,
  buttonStyle: 'card',
  location: 'GridCard',
  hideDotMenu: false,
  offsetPosition: {
    x: 20,
  },
  menuItems: menuItemsWithIcons,
  width: 250,
  wrapperClassName: 'card-menu',
}
;<StyleguideHolder><PopoutMenu {...actionMenuProps} /></StyleguideHolder>
```

### Audience settings widget menu

This appears in the audience admin section of the site to offer more options
for manipulating audiences.


```jsx padded
import { StyleguideHolder } from '../../ui/global/styled/layout'
import GlobeIcon from '../../ui/icons/GlobeIcon'
import InfoIcon from '../..//ui/icons/InfoIcon'
const audienceSettingsProps = {
  onClick: () => {},
  menuOpen: true,
  hideDotMenu: true,
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
;<StyleguideHolder><PopoutMenu {...audienceSettingsProps} /></StyleguideHolder>
```
