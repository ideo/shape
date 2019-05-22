import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Grid } from '@material-ui/core'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'

class Banner extends React.Component {
  render() {
    return (
      <StyledBanner {...this.props}>
        <MaxWidthContainer>
          <Grid container justify="space-between" alignItems="center">
            <Grid
              item
              xs={12}
              md={9}
              container
              spacing={16}
              alignItems="flex-end"
            >
              {this.props.leftComponent}
            </Grid>
            <Grid item xs={12} md={3}>
              {this.props.rightComponent}
            </Grid>
          </Grid>
        </MaxWidthContainer>
      </StyledBanner>
    )
  }
}

Banner.propTypes = {
  leftComponent: PropTypes.object.isRequired,
  rightComponent: PropTypes.object.isRequired,
  backgroundColor: PropTypes.string.isRequired,
}

Banner.defaultProps = {
  leftComponent: () => null,
  rightComponent: () => null,
  backgroundColor: v.colors.alert,
}

const StyledBanner = styled.div`
  background-color: ${props => props.backgroundColor};
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 1.33rem;
  margin-top: 20px;
  margin-bottom: 20px;
  margin-left: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);
  margin-right: calc(-100vw / 2 + ${v.maxWidth - 2 * v.fonts.baseSize}px / 2);

  @media only screen and (max-width: ${v.maxWidth +
      v.containerPadding.horizontal * v.fonts.baseSize}px) {
    margin-left: -${v.containerPadding.horizontal}rem;
    margin-right: -${v.containerPadding.horizontal}rem;
    padding: 20px ${v.containerPadding.horizontal}rem;
  }

  padding: 20px;

  a {
    color: white;
  }
`

export default Banner
