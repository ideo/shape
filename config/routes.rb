Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: 'users/omniauth_callbacks' }

  namespace :api do
    namespace :v1 do
      resources :collections do
        resources :collection_cards, shallow: true do
          resources :items, shallow: true, except: :index
        end
      end
      resources :organizations, only: [:show, :update] do
        resources :collections, only: [:index, :create]
      end
      resources :users
    end
  end

  root to: "home#index"

  get :whoami, to: 'home#whoami'
  get :login, to: 'home#login'
end
