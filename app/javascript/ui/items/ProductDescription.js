import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Flex, Box } from 'reflexbox'
import {
  MarketingContent,
  MarketingH1,
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

const ImageDisplay = styled(MarketingContent)`
`

class ProductDescription extends React.PureComponent {
  render() {
    return (
      <StyledProductDescription id={this.props.id} order={this.props.order}>
        <Flex
          w={1}
          mt={4}
          mb={4}
          align={this.props.order % 2 === 1 ? 'flex-start' : 'flex-end'}
        >
          <Box w={1 / 20} order={0} />

          <Box w={3 / 10} order={this.props.order % 2 === 1 ? 1 : 2}>
            <Title>{this.props.title}</Title>
            <Description>{this.props.description}</Description>
          </Box>

          <Box w={15 / 20} order={this.props.order % 2 === 1 ? 2 : 1}>
            <ImageDisplay><img src={this.props.imageUrl} alt={this.props.title} width="80%" /></ImageDisplay>
          </Box>

          <Box w={1 / 20} order={3} />
        </Flex>
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
