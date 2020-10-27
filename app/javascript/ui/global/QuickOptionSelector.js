import PropTypes from 'prop-types'
import styled from 'styled-components'

import Tooltip from '~/ui/global/Tooltip'
import v from '~/utils/variables'

const Option = styled.span`
  background-color: ${props => props.color || 'transparent'};
  background-image: ${props => (props.image ? `url(${props.image})` : 'none')};
  background-size: cover;
  display: inline-block;
  margin: 0;
  height: 32px;
  width: 32px;
  ${props =>
    props.active &&
    `
    outline: 2px solid ${v.colors.highlightActive};
    margin: 0 2px;
  `}
`
Option.displayName = 'QuickOption'

class QuickOptionSelector extends React.Component {
  handleClick = option => {
    const { onSelect } = this.props
    onSelect(option)
  }

  render() {
    const { options } = this.props
    return (
      <div style={{ fontSize: 0 }}>
        {options.map(option => (
          <Tooltip
            classes={{ tooltip: 'Tooltip' }}
            placement="top"
            title={option.title}
            key={`${option.title} ${option.cardId || option.imageUrl}`}
            PopperProps={{ style: { pointerEvents: 'none' } }}
          >
            <button
              onClick={e => this.handleClick(option, e)}
              data-cy={`QuickOption-${option.title}`}
            >
              {option.icon ? (
                <Option color={'white'}>{option.icon}</Option>
              ) : (
                <Option
                  active={option.active}
                  image={option.imageUrl}
                  color={option.color}
                />
              )}
            </button>
          </Tooltip>
        ))}
      </div>
    )
  }
}

QuickOptionSelector.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      cardId: PropTypes.string,
      title: PropTypes.string,
      imageUrl: PropTypes.string,
      icon: PropTypes.node,
      color: PropTypes.string,
      active: PropTypes.bool,
    })
  ),
  onSelect: PropTypes.func.isRequired,
}
QuickOptionSelector.defaultProps = {
  options: [],
}

export default QuickOptionSelector
