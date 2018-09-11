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
    // for enzyme tests
    "shallow": true,
    "render": true,
    "mount": true,
    "relPath": true,
    "localStorage": true,
    "FileReader": true,
    "DOMParser": true,
  },
  settings: {
    "import/resolver": {
      "babel-module": {},
      "node": {}
    },
    "module-resolver": {},
    "import/core-modules": ["styled-jsx/css"]
  },
  rules: {
    "arrow-parens": [0, "as-needed"],
    // because of all of our rails API snake_case variables
    "camelcase": 0,
    "comma-dangle": ["error", "always-multiline"],
    "function-paren-newline": ["error", "consistent"],
    "func-names": 0,
    "import/no-absolute-path": 0,
    "import/extensions": 0,
    "indent": ["error", 2],
    "no-param-reassign": ["error", { "props": false }],
    "no-underscore-dangle": 0,
    "one-var-declaration-per-line": ["error", "initializations"],
    "object-curly-newline": ["error", {
      "multiline": true,
      "consistent": true,
      "minProperties": 6
    }],
    "radix": ["error", "as-needed"],
    "semi" : [2, "never"],
    "space-before-function-paren": 0,
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
    "react/jsx-curly-spacing": [2, {
      "when": "never",
      "children": true,
    }],
    "react/jsx-closing-tag-location": 0,
    "react/no-did-mount-set-state": 0,
    "react/sort-comp": [1, {
      order: [
        'static-methods',
        'instance-variables',
        'lifecycle',
        'everything-else',
        'render',
      ]
    }],
  }
}
