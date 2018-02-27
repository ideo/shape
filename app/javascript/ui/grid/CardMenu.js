import PropTypes from 'prop-types'
import styled from 'styled-components'

import ArchiveIcon from '~/ui/icons/ArchiveIcon'
import DuplicateIcon from '~/ui/icons/DuplicateIcon'
import MenuIcon from '~/ui/icons/MenuIcon'
import OrganizeIcon from '~/ui/icons/OrganizeIcon'
import LinkIcon from '~/ui/icons/LinkIcon'
import v from '~/utils/variables'

export const StyledMenu = styled.div`
  position: relative;
  ul {
    position: absolute;
    top: 20px;
    left: 0;
    display: none;
    background-color: #FFFFFF;
    width: 200px;
  }
  &.open ul {
    display: block;
  }
`

export const StyledMenuToggle = styled.button`
  .icon {
    -webkit-transform: rotate(90deg);
    -moz-transform: rotate(90deg);
    -o-transform: rotate(90deg);
    -ms-transform: rotate(90deg);
    transform: rotate(90deg);
    width: 20px;
    height: 20px;
  }
`

export const StyledMenuItem = styled.li`
  button {
    width: 100%;
    padding-left: 1rem;
    line-height: 2.5rem;
    text-transform: uppercase;
    position: relative;
    border-left: 3px solid transparent;
    font-family: 'Gotham';
    font-weight: 300;
    font-size: 0.8rem;
    text-align: left;
    border-bottom: 1px solid ${v.colors.cyanLight};
    .icon {
      top: 50%;
      transform: translateY(-50%);
      color: ${v.colors.dark};
      position: absolute;
      right: 1.5rem;
      width: 16px;
      height: 16px;
    }
  }
  &:hover,
  &:active {
    button {
      border-left: 3px solid ${v.colors.teal};
    }
    button,
    button .icon {
      color: ${v.colors.teal};
    }
  }
`

class CardMenu extends React.PureComponent {
  state = {
    open: false
  }

  toggleMenuVisibility = () => {
    this.setState({
      open: !this.state.open
    })
  }

  render() {
    const { className } = this.props
    let css = className || ''
    if (this.state.open) {
      css += ' open'
    }
    return (
      <StyledMenu
        className={css}
        role="presentation"
      >
        <StyledMenuToggle onClick={this.toggleMenuVisibility}>
          <MenuIcon />
        </StyledMenuToggle>
        <ul>
          <StyledMenuItem>
            <button onClick={this.props.handleDuplicate}>
              Duplicate
              <DuplicateIcon />
            </button>
          </StyledMenuItem>
          <StyledMenuItem>
            <button onClick={this.props.handleLink}>
              Link
              <LinkIcon />
            </button>
          </StyledMenuItem>
          <StyledMenuItem>
            <button onClick={this.props.handleOrganize}>
              Organize
              <OrganizeIcon />
            </button>
          </StyledMenuItem>
          <StyledMenuItem>
            <button onClick={this.props.handleArchive}>
              Archive
              <ArchiveIcon />
            </button>
          </StyledMenuItem>
        </ul>
      </StyledMenu>
    )
  }
}

CardMenu.propTypes = {
  className: PropTypes.string,
  handleDuplicate: PropTypes.func.isRequired,
  handleLink: PropTypes.func.isRequired,
  handleOrganize: PropTypes.func.isRequired,
  handleArchive: PropTypes.func.isRequired,
}

CardMenu.defaultProps = {
  className: 'card-menu'
}

export default CardMenu
