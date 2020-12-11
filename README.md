# NOTE: Shape is no longer supported by IDEO.
_December 2020_

We have made the difficult decision to wind down operations of the Shape product offering. As part of that, we are making this repo open source. Feel free to peruse the code and hopefully find something useful.

Note that the API authentication uses Devise + OAuth so it should be easy to reconfigure, however the existing codebase is reliant on the IDEO Network Account, a now defunct SSO system. So if you were to truly spin up your own instance of Shape, you would need to overhaul the login system.

Another disclaimer, there is a *lot* going on in here, including various features we were experimenting with, lots of heavy front-end components with draggable, movable, realtime-text-editing, firebase-powered commenting, and so on. Shape was very much in the stage of experimenting with its market fit, with a small team of engineers, so it's probably going to be difficult to set up a local environment without any assistance. However, it did have a fully passing test suite of both frontend (jest + cypress) and backend (rspec) tests, so it's not that it wasn't thorough or robust, just that it might be a little complicated with some messy code in some areas. That being said, have fun with it.

---

# Getting Started

Here are the commands you can use to get started:

**Install all the dependencies first:**

```sh
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

Note: You will need to [create a GitHub personal access token](https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line) in order to install the `network-api-ruby` gem. You can enter the token as your password when prompted for your GitHub credentials. Or, you can set an environment variable for Bundler to use: `export BUNDLE_GITHUB__COM=x-access-token:<token>`

**Clone the app and run the setup script:**

Note: `./dev.sh -s` will run `rails db:setup` which will also seed your database with two required collections, marked by the following `ENV` ids:

- `ENV['GETTING_STARTED_TEMPLATE_ID']`
- `ENV['ORG_MASTER_TEMPLATES_ID']`

If these two collections don't exist then you won't be able to create a new organization and setup your first account.

```sh
git clone https://github.com/ideo/shape
cd shape
# Setup the `.env` file with valid credentials: (get these from the IDEO team)
cp .env.example .env
# run our setup script (install gems, packages, setup database)
./dev.sh -s
```

**Setup your text editor and linter:**

Ensure your text editor has [eslint](https://eslint.org/) and [rubocop](https://rubocop.readthedocs.io/en/latest/) installed (e.g. for Atom you would install [linter-eslint](https://github.com/AtomLinter/linter-eslint) and [linter-rubocop](https://atom.io/packages/linter-rubocop)). For JS code we are using [prettier](https://prettier.io/), so if you have your linter running, it will automatically format properly on save.

**Run tests:**

Rails Unit & Controller Tests

```sh
# run rails tests once:
bin/rspec
# watch files and re-run tests:
bundle exec guard
```

Jest Unit Tests

```sh
# run JS tests once:
yarn run jest
# watch files and re-run JS tests:
yarn test
```

Cypress Integration Tests

Note: Make sure to select **Electron** as your browser in the cypress dropdown when running it locally.

```sh
# Start Rails test server and run cypress GUI (which hits http://localhost:3001)
bin/cypress

# Once your test server is running...
# Run cypress integration tests using the GUI:
yarn cypress

# Or run in CI mode:
yarn cypress-ci [-s <path/to/feature>]
```

## Running your dev environment

1. Run your webpack server:

```sh
heroku local webpack -f Procfile.development
```

2. Run your sidekiq worker:

```sh
heroku local worker -f Procfile.development
```

3. Run your rails server:

```sh
rails s
```

### (Optional) Use ttab for quick dev environment setup

Install ttab and [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install):

```sh
npm install -g ttab
brew tap heroku/brew && brew install heroku
```

Run dev script:

```sh
./dev.sh
```

This will open separate tabs to:

1. Run the webpack dev server and sidekiq worker
1. Run the rails server
1. Open [Atom](https://atom.io/) in the project directory
   And will open your browser (may need to refresh page after initial webpack)

```sh
# run the script with a different text editor
./dev.sh -e [your favorite editor]
```

### Post-checkout hook for switching between branches

Use the post-checkout hook here to keep your branches in sync:
https://github.com/ideo/shape/wiki/Git-post-checkout-hook

Upon switching branches, this will (as necessary):

- bundle install
- yarn install
- migrate or rollback any migrations relevant (or not relevant) to the branch, and checkout `db/schema.rb`
- git submodule update

You can also decline the updates e.g. if you are just making a quick branch update don't want to rollback migrations (and lose data).

### Keeping database in sync

Sometimes your local database environment will drift away from production. You can pull the current production database to your local machine using a shell command from `.shell-commands` (NOTE: this is only possible if you have been granted access to the Heroku instance). First, run `source .shell-commands`, then run:

```sh
shapecopydb local
```

It shouldn't take too long, although `Searchkick` will take longer to reindex records.

### (Optional) Create your own Firebase instance

1. Sign in to the [Firebase Console](https://console.firebase.google.com)
1. Create a new Firebase project
1. Click on the gear icon next to "Project Overview" in the sidebar and go to the "Project settings"
1. Copy the "Web API Key" value and update the `GOOGLE_CLOUD_BROWSER_KEY` value in the `.env` file
1. Copy the "Project ID" value and update the `GOOGLE_CLOUD_PROJECT` value in the `.env` file
1. Go to the ["Service accounts"](https://console.cloud.google.com/iam-admin/serviceaccounts) tab in the Google Cloud Platform IAM & Admin.
1. Click the "Generate new private key" button
1. Copy the contents of the private key JSON file and update the `GOOGLE_CLOUD_KEYFILE` value in `.env` file
1. Click on "Authentication" in sidebar
1. Click on the "Set up sign-in method" button
1. Click on "Database" in sidebar
1. Click on the "Create database" button
1. Select the “Start in test mode” option
1. Restart your development server
1. In the browser, open the JavaScript console
1. If there are Firebase errors about missing indices, click on the link in the error message to create the index

### Styleguide
To run and work on the styleguide, visit [it's documentation](https://github.com/ideo/shape/wiki/Styleguide)
