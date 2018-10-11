import PropTypes from 'prop-types'
import styled from 'styled-components'

import v from '~/utils/variables'

const StyledHr = styled.div`
  background-color: ${v.colors.black};
  display: block;
  flex-grow: 1;
  height: 1px;
  line-height: 0;
  width: 100%;
`

const TitleHolder = styled.div`
  background: ${v.colors.commonLight};
  flex-grow: 1;
  flex-shrink: 0;

  > * {
    margin: 0;
  }
`

const Holder = styled.div`
  align-items: center;
  display: flex;
  justify-content: center;
  flex-basis: 100%;
  margin-bottom: 20px;
  margin-top: 20px;
  text-align: center;

  .hrFirst {
    margin-right: 20px;
  }

  .hrLast {
    margin-left: 20px;
  }
`

class PageSeparator extends React.PureComponent {
  render() {
    const { title } = this.props
    return (
      <Holder>
        <StyledHr className="hrFirst" />
        <TitleHolder>{title}</TitleHolder>
        <StyledHr className="hrLast" />
      </Holder>
    )
  }
}

PageSeparator.propTypes = {
  title: PropTypes.node,
}

PageSeparator.defaultProps = {
  title: null,
}

export default PageSeparator
