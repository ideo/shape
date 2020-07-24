import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Collapse } from '@material-ui/core'

import DropdownIcon from '~/ui/icons/DropdownIcon'
import v from '~/utils/variables'
import { DisplayText } from '~/ui/global/styled/typography'
import { Row, RowItemLeft } from '~/ui/global/styled/layout'

const PanelHeader = styled.div`
  background-color: ${v.colors.white};
  cursor: pointer;
  margin-bottom: 15px;
  position: sticky;
  top: 0;
  z-index: 2;
  ${props =>
    props.open &&
    `&:after {
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.1) 4%, rgba(0, 0, 0, 0));
      content: "";
      display: block;
      position: absolute;
      height: 5px;
      width: 100%;
    }`};
`
const StyledRow = styled(Row)`
  margin-left: 0;
  margin-bottom: 0;
`

const StyledCollapseToggle = styled.button`
  .icon {
    width: 24px;
    transform: translateY(4px);
  }
`
const StyledExpandToggle = styled.button`
  .icon {
    width: 24px;
    transform: translateY(2px) rotate(-90deg);
  }
`

class Panel extends React.Component {
  state = {
    open: false,
  }

  componentDidMount() {
    this.setState({ open: this.props.open })
  }

  toggle() {
    this.setState({ open: !this.state.open })
  }

  render() {
    const { title, children } = this.props

    return (
      <React.Fragment>
        <PanelHeader
          onClick={() => this.toggle()}
          open={this.state.open}
          data-cy={this.props['data-cy']}
        >
          <StyledRow align="center">
            <DisplayText>{title}</DisplayText>
            <RowItemLeft style={{ marginLeft: '0px' }}>
              {this.state.open ? (
                <StyledCollapseToggle aria-label="Collapse">
                  <DropdownIcon />
                </StyledCollapseToggle>
              ) : (
                <StyledExpandToggle aria-label="Expand">
                  <DropdownIcon />
                </StyledExpandToggle>
              )}
            </RowItemLeft>
          </StyledRow>
        </PanelHeader>
        <Collapse in={this.state.open} timeout="auto" unmountOnExit>
          {children}
        </Collapse>
      </React.Fragment>
    )
  }
}

Panel.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
  open: PropTypes.bool.isRequired,
  'data-cy': PropTypes.string,
}
Panel.defaultProps = {
  'data-cy': '',
}

export default Panel
