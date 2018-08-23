import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Box } from 'reflexbox'
import {
  MarketingContent,
  MarketingH1,
  MarketingFlex,
} from '~/ui/global/styled/marketing.js'

const StyledProductDescription = styled(MarketingContent)`
`

const Title = styled(MarketingH1)`
  text-align: left;
  word-wrap:break-word;
`
const Description = styled(MarketingContent)`
  text-align: left;
  word-wrap:break-word;
`

const ImageDisplay = styled.img`
  object-fit: scale-down;
  max-width: 100%;
  max-height: 100%;
  height: auto;
`

class ProductDescription extends React.PureComponent {
  render() {
    return (
      <StyledProductDescription id={this.props.id} order={this.props.order}>
        <MarketingFlex
          w={1}
          mt={4}
          mb={4}
          align={['flex-start', (this.props.order % 2 === 1 ? 'flex-start' : 'flex-end')]}
          justify="space-evenly"
          wrap
        >

          <Box w={[1, 3 / 10]} order={[2, (this.props.order % 2 === 1 ? 1 : 2)]}>
            <Title>{this.props.title}</Title>
            <Description>{this.props.description}</Description>
          </Box>

          <Box w={[1, 6 / 10]} order={[1, (this.props.order % 2 === 1 ? 2 : 1)]}>
            <ImageDisplay src={this.props.imageUrl} alt={this.props.title} />
          </Box>

        </MarketingFlex>
      </StyledProductDescription>
    )
  }
}

ProductDescription.propTypes = {
  id: PropTypes.string.isRequired,
  order: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  imageUrl: PropTypes.string.isRequired,
}

export default ProductDescription
