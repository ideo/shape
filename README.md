# Getting Started

Here are the commands you can use to get started:

**Install all the dependencies first:**

```
brew install nvm
nvm install 8.16.0
# use nvm + npm to install yarn; `brew install yarn` would try to reinstall node
npm install -g yarn
brew install postgresql
brew install redis
brew install elasticsearch
brew install heroku/brew/heroku

# use homebrew services to start elasticsearch and redis in the background
brew services start redis
brew services start elasticsearch

# setup rvm and install ruby, bundler
curl -L https://get.rvm.io | bash -s stable --auto-dotfiles --autolibs=enable --rails
rvm install ruby 2.5.5
rvm use 2.5.5
gem install bundler
```

**You will also need to be granted access to:**

- https://github.com/ideo/network-react-components
- https://github.com/ideo/network-api-ruby

**Clone the app and install the gems:**

```
git clone https://github.com/ideo/shape
cd shape
# run our setup script (install gems, packages, setup database)
./dev.sh -s
```

**Setup the `.env` file with valid credentials:**

```
cp .env.example .env
# modify credentials
```

**Setup your text editor and linter:**

Ensure your text editor has [eslint](https://eslint.org/) and [rubocop](https://rubocop.readthedocs.io/en/latest/) installed (e.g. for Atom you would install [linter-eslint](https://github.com/AtomLinter/linter-eslint) and [linter-rubocop](https://atom.io/packages/linter-rubocop)). For JS code we are using [prettier](https://prettier.io/), so if you have your linter running, it will automatically format properly on save.


**Run tests:**

Rails Unit & Controller Tests

```
# run rails tests once:
bin/rspec
# watch files and re-run tests:
bundle exec guard
```

Jest Unit Tests

```
# run JS tests once:
yarn run jest
# watch files and re-run JS tests:
yarn test
```

Cypress Integration Tests

Note: Make sure to select **Electron** as your browser in the cypress dropdown when running it locally.

```
# Run cypress integration tests:
yarn cypress-ci

# Or control the tests:
yarn cypress
```

## Running your dev environment

1. Run your webpack server:

```
heroku local webpack -f Procfile.development
```

2. Run your sidekiq worker:

```
heroku local worker -f Procfile.development
```

3. Run your rails server:

```
rails s
```

### (Optional) Use ttab for quick dev environment setup

Install ttab and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install):

```
npm install -g ttab
brew tap heroku/brew && brew install heroku
```

Run dev script:

```
./dev.sh
```

This will open separate tabs to:

1. Run the webpack dev server and sidekiq worker
1. Run the rails server
1. Open [Atom](https://atom.io/) in the project directory
   And will open your browser (may need to refresh page after initial webpack)

```
# run the script with a different text editor
./dev.sh -e [your favorite editor]
```
