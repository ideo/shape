The Truncatable Text is a text component that displays or truncates text. When a text exceeds a max length, then it needs to be truncated.
When it's truncated it will be rendered with a wrapped `<Tooltip/>` component to display the full text on hover.

### Template Instance Navigation Button

In the template instance page header, Truncatable Text is used to truncate a master template's name used as a label since the button has a fixed width.

```jsx padded
import { StyleguideHolder } from '../../ui/global/styled/layout'
import Button from '../../ui/global/Button'
;<StyleguideHolder>
  <Button>
    <TruncatableText text={'Business Model Canvas'} maxLength={10} />
  </Button>
</StyleguideHolder>
```

### Select options for Data Measures

In data cards, Truncatable Text is used to truncate measure select options since the select option has a fixed width.

```jsx padded
import { StyleguideHolder } from '../../ui/global/styled/layout'
import { Select, SelectOption } from '../../ui/global/styled/forms'
;<StyleguideHolder>
  <Select>
    <SelectOption>
      <TruncatableText text={'Collections and Items'} maxLength={10} />
    </SelectOption>
  </Select>
</StyleguideHolder>
```
