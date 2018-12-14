# Getting Started

Here are the commands you can use to get started:

Install all the libraries first:
```
brew install nvm
nvm install 8.9.4
brew install yarn
curl -L https://get.rvm.io | bash -s stable --auto-dotfiles --autolibs=enable --rails
brew install postgresql
brew install redis
brew install heroku/brew/heroku
```

Clone the app and install the gems:
```
git clone <clone URL>
cd shape/
rvm install ruby 2.4.3
cd ..
cd shape/
gem install bundler
bundle install
yarn install

# Initialize and update the git submodule for Network React Components
git submodule init
git submodule update
```

Setup the `.env` file with valid credentials:
```
cp .env.example .env
# modify credentials
```

Create the database and migrate:

```
rails db:setup 

# get access to Shell commands in Terminal
source ./shell-commands

# copy production data to your local database
shapecopydb local
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
2. Run your sidekiq worker:
```
bundle exec sidekiq -e ${RACK_ENV:-development} -C config/sidekiq.yml
```
3. Run your rails server:
```
bin/rails s
```

### Use ttab for quick dev environment setup
Install ttab and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install):
```
npm install -g ttab
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
