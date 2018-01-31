# Getting Started

...

# Setting up the app

Here are the commands you can use to get started:

Install all the libraries first:
```
brew install nvm
nvm install 8.9.4
brew install yarn
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

Create the database and migrate:

```
rails db:create
rails db:migrate
bundle rails s
```
