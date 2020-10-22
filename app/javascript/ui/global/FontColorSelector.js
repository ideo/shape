import { useState, Fragment } from 'react'
import PropTypes from 'prop-types'

import CheckboxWithLabel from '~/ui/global/CheckboxWithLabel'
import ClickWrapper from '~/ui/layout/ClickWrapper'
import ColorPicker from '~/ui/global/ColorPicker'
import ColorPickerIcon from '~/ui/icons/ColorPickerIcon'
import QuickOptionSelector from '~/ui/global/QuickOptionSelector'
import XIcon from '~/ui/icons/XIcon'
import { MediumBreak } from '~/ui/grid/CardCoverEditor'

const removeOption = {
  type: 'remove',
  title: 'remove image',
  icon: <XIcon />,
}

const pickColorOption = {
  type: 'color',
  title: 'font color',
  icon: <ColorPickerIcon />,
}

const FontColorSelector = ({
  fontColor,
  defaultFontColor,
  onSelect,
  propagate,
  onTogglePropagate,
}) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false)

  // init fontOptions
  const fontOptions = [{ ...removeOption, title: 'reset font color' }]
  if (fontColor) {
    fontOptions.push({
      // clicking this will also open the picker
      type: 'color',
      title: 'current color',
      color: fontColor,
    })
  }
  fontOptions.push(pickColorOption)
  // ---------

  const onFontOptionSelect = opt => {
    if (opt.type === 'color') {
      // toggle picker
      setColorPickerOpen(!colorPickerOpen)
    } else if (opt.type === 'remove') {
      setColorPickerOpen(false)
      onSelectColor({ hex: null })
    }
  }

  const onSelectColor = ({ hex }) => {
    onSelect({ hex })
  }

  return (
    <Fragment>
      <QuickOptionSelector
        options={fontOptions}
        onSelect={onFontOptionSelect}
      />
      {colorPickerOpen && (
        <Fragment>
          <ClickWrapper clickHandlers={[() => setColorPickerOpen(false)]} />
          <ColorPicker
            color={fontColor || defaultFontColor}
            onChangeComplete={onSelectColor}
          />
          <MediumBreak />
        </Fragment>
      )}
      {onTogglePropagate && (
        <CheckboxWithLabel
          onChange={onTogglePropagate}
          checked={propagate}
          label="Apply to all nested collections"
        />
      )}
    </Fragment>
  )
}

FontColorSelector.propTypes = {
  fontColor: PropTypes.string,
  defaultFontColor: PropTypes.string.isRequired,
  onSelect: PropTypes.func.isRequired,
  propagate: PropTypes.bool,
  onTogglePropagate: PropTypes.func,
}
FontColorSelector.defaultProps = {
  fontColor: null,
  propagate: false,
  onTogglePropagate: null,
}

export default FontColorSelector
