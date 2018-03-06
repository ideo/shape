# Getting Started

Here are the commands you can use to get started:

Install all the libraries first:
```
brew install nvm
nvm install 8.9.4
brew install yarn
curl -L https://get.rvm.io | bash -s stable --auto-dotfiles --autolibs=enable --rails
brew install postgresql
```

Clone the app and install the gems:
```
git clone <clone URL>
cd oie-2/
rvm install ruby 2.4.3
cd ..
cd oie-2/
gem install bundler
bundle install
yarn install
```

Setup the `.env` file with valid credentials:
```
cp .env.example .env
# modify credentials
```

Create the database and migrate:

```
rails db:create
rails db:migrate
# if you want to seed some fake data
rails db:seed
```

Run tests:

```
# run rails tests once:
bin/rspec
# watch files and re-run tests:
bundle exec guard

# run JS tests once:
yarn run jest
# watch files and re-run JS tests:
yarn test
```

## Running your dev environment

1. Run your webpack server:
```
bin/webpack-dev-server
```
1. Run your rails server:
```
bin/rails s
```

### Use ttab for quick dev environment setup

Install ttab and foreman:
```
npm install -g ttab
gem install foreman
```

Run dev script:
```
./dev.sh
```
This will open separate tabs to:
  1. Run the webpack dev server
  1. Run the rails server
  1. Open atom in the project directory
