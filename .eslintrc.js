module.exports = {
  plugins: [
    "react",
    "jest"
  ],
  env: {
    "jest/globals": true
  },
  extends: [
    "airbnb",
    "standard",
    "standard-react"
  ],
  parser: "babel-eslint",
  parserOptions: {
      "ecmaVersion": 7,
      "sourceType": "module",
      "ecmaFeatures": {
          "jsx": true
      }
  },
  globals: {
    "__DEV__"      : false,
    "__PROD__"     : false,
    "__DEBUG__"    : false,
    "fetch":   true,
    "webpack": true,
    "React":   true,
    "shallow": true,
    "render": true,
    "mount": true,
  },
  settings: {
    "import/resolver": {
      "babel-plugin-root-import": {},
      "node": {}
    },
    "import/core-modules": ["styled-jsx/css"]
  },
  rules: {
    "import/no-absolute-path": 0,
    "import/extensions": 0,
    "semi" : [2, "never"],
    "camelcase": 0,
    "comma-dangle": 0,
    "arrow-parens": [0, "as-needed"],
    "function-paren-newline": ["error", "consistent"],
    "func-names": 0,
    "space-before-function-paren": 0,
    "indent": ["error", 2],
    "no-param-reassign": ["error", { "props": false }],
    "one-var-declaration-per-line": ["error", "initializations"],
    "radix": ["error", "as-needed"],
    "jsx-quotes": ["warn", "prefer-double"],
    "jsx-a11y/anchor-is-valid": [ "error", {
      "components": [ "Link" ],
      "specialLink": [ "to", "hrefLeft", "hrefRight" ],
      "aspects": [ "noHref", "invalidHref", "preferButton" ]
    }],
    "react-in-jsx-scope": 0,
    "react/jsx-filename-extension": 0,
    "react/prefer-stateless-function": 0,
    "react/jsx-curly-brace-presence": 0,
    "react/jsx-closing-tag-location": 0,
    "react/no-did-mount-set-state": 0,
    // react/no-typos disabled until this is resolved:
    // https://github.com/yannickcr/eslint-plugin-react/issues/1389
    "react/no-typos": 0,
    "react/prop-types": [1, {"skipUndeclared": true}]
  }
}
