import ProductDescription from '~/ui/marketing/ProductDescription.js'
import firebase from '~/vendor/firebaseMarketing.js'
import styled from 'styled-components'
import v from '~/utils/variables'

const Content = styled.div`
  color: black;
  letter-spacing: -0.2px;
  font-size: 1rem;
  font-family: ${v.fonts.sans};
  font-weight: ${v.weights.book};
`

class ProductDescriptions extends React.PureComponent {
  constructor() {
    super()
    this.state = { products: [] }
  }
  componentDidMount() {
    let db = {}
    db = firebase.firestore()

    const productDescriptions = []
    db.collection('productDescriptions')
      .orderBy('order')
      .get()
      .then(snapshot => {
        snapshot.forEach(product => {
          productDescriptions.push(
            <ProductDescription
              key={product.id}
              id={product.id}
              order={product.data().order}
              title={product.data().title}
              description={product.data().description}
              imageUrl={product.data().imageUrl}
            />
          )
        })
        this.setState({ products: productDescriptions })
      })
  }

  render() {
    return <Content>{this.state.products}</Content>
  }
}

export default ProductDescriptions
