The button element is the main button style on the site; a rounded corner
different colored background button with a white text style. There are ways
to configure the color style, width and text size, and whether the button
should be an outline type.

### Add to my collection button

```jsx
import Button from '../../ui/global/Button'
;<Button minWidth={250} size="sm">
  Add to my collection
</Button>
```

### Add template button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button size="sm" colorScheme={v.colors.black} outline>
  Let me place it
</Button>
```

### Replace card button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button colorScheme={v.colors.alert}>Replace</Button>
```

### Get test link button

```jsx
import styled from 'styled-components'
import Button from '../../ui/global/Button'
import LinkIconSm from '../..//ui/icons/LinkIconSm'
import v from '../../utils/variables'

const StyledButtonIconWrapper = styled.span`
  display: inline-block;
  vertical-align: middle;
  height: ${props => (props.height ? props.height : 24)}px;
  width: ${props => (props.width ? props.width : 27)}px;
  padding: 4px;
  ${props =>
    props.float &&
    `
      float: ${props.float}
    `}
`

StyledButtonIconWrapper.displayName = 'StyledButtonIconWrapper'
const StyledButtonNameWrapper = styled.span`
  display: inline-block;
  vertical-align: middle;
  ${props =>
    props.large &&
    `
      text-transform: none;
      font-weight: normal;
      font-size: 24px;
      float: left;
    `}

  ${props =>
    props.fixedWidth &&
    `
      max-width: 130px;
    `};
`

StyledButtonNameWrapper.displayName = 'StyledButtonNameWrapper'
;<Button
  minWidth={v.buttonSizes.header.width}
  size="sm"
  colorScheme={v.colors.black}
  outline
>
  <StyledButtonIconWrapper>
    <LinkIconSm />
  </StyledButtonIconWrapper>
  <StyledButtonNameWrapper>Get Link</StyledButtonNameWrapper>
</Button>
```

### Repoen test button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button minWidth={200} size="sm" colorScheme={v.colors.black} outline>
  Re-open Feedback
</Button>
```

### Submission submit button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button colorScheme={v.colors.alert} size="sm">
  Submit
</Button>
```

### Join collection button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button
  style={{ marginLeft: '1rem' }}
  colorScheme={v.colors.primaryDarkest}
  size="sm"
>
  Join
</Button>
```

### Restore button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button
  style={{ marginLeft: '1rem' }}
  colorScheme={v.colors.primaryDarkest}
  size="sm"
>
  Restore
</Button>
```

### Template button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button
  minWidth={v.buttonSizes.header.width}
  colorScheme={v.colors.primaryDark}
  size="sm"
>
  Use Template
</Button>
```

### Stop feedback button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button minWidth="170" size="sm" colorScheme={v.colors.black} outline>
  Stop Feedback
</Button>
```

### Admin audience modal

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button minWidth={200} className="adminAudienceModalButton">
  Add Audience
</Button>
```

### Restore Activity button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button colorScheme={v.colors.secondaryDark}>Restore</Button>
```

### Organization settings save button

```jsx
import Button from '../../ui/global/Button'
;<Button style={{ marginTop: '24px' }}>Save</Button>
```

### Use Template button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
import { StyleguideHolder } from '../../ui/global/styled/layout'
;<StyleguideHolder height={'auto'} backgroundColor={v.colors.black}>
  <Button colorScheme={v.colors.white} outline>
    Use Template
  </Button>
</StyleguideHolder>
```

### Go To Master Template button

```jsx
import Button from '../../ui/global/Button'
import v from '../../utils/variables'
;<Button colorScheme={v.colors.commonDark} outline>
  Go to Master Template
</Button>
```

### Disabled button

The disabled button has its own style and shouldn't allow any sort of hover
or clicking interaction.

```jsx
import Button from '../../ui/global/Button'
;<Button disabled>Not working</Button>
```
