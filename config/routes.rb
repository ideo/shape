Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: 'users/omniauth_callbacks' }

  root to: "home#index"

  get :whoami, to: 'home#whoami'
  get :login, to: 'home#login'
end
