import PropTypes from 'prop-types'
import styled from 'styled-components'
import { Grid } from '@material-ui/core'
import { MaxWidthContainer } from '~/ui/global/styled/layout'
import v from '~/utils/variables'

const StyledBanner = styled.div`
  background-color: ${v.colors.alert};
  color: white;
  font-family: ${v.fonts.sans};
  font-size: 1.33rem;
  padding: 20px;

  a {
    color: white;
  }
`
StyledBanner.displayName = 'StyledBanner'

const StyledAction = styled.div`
  font-size: 1rem;
  text-align: right;
`

class Banner extends React.Component {
  render() {
    return (
      <StyledBanner>
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
              <StyledAction>{this.props.rightComponent}</StyledAction>
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
}

Banner.defaultProps = {
  leftComponent: () => null,
  rightComponent: () => null,
}

export default Banner
