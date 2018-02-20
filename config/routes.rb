Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: 'users/omniauth_callbacks' }

  namespace :api do
    namespace :v1 do
      resources :collections do
        collection do
          get 'me'
        end
        resources :collection_cards, only: :index
      end
      resources :collection_cards, shallow: true do
        resources :items, shallow: true, except: :index
        resources :collections, only: :create
      end
      resources :organizations, only: [:show, :update] do
        collection do
          get 'current'
        end
        resources :collections, only: [:index, :create]
      end
      resources :users do
        collection do
          get 'me'
        end
      end
    end
  end

  root to: 'home#index'
  get :login, to: 'home#login', as: :login

  # catch all HTML route requests, send to frontend
  get '*path', to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
end
