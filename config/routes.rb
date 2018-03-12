Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: 'users/omniauth_callbacks' }

  namespace :api do
    namespace :v1 do
      resources :collections do
        collection do
          get 'me'
        end
        member do
          post 'duplicate'
        end
        resources :collection_cards, only: :index
        resources :roles, only: %i[index create destroy], shallow: true
      end
      resources :collection_cards, shallow: true do
        member do
          post 'duplicate'
        end
        resources :items, shallow: true, except: :index do
          member do
            post 'duplicate'
          end
          resources :roles, only: %i[index create], shallow: true
        end
        resources :collections, only: :create
        member do
          patch 'archive'
        end
      end
      resources :organizations, only: %i[show update] do
        collection do
          get 'current'
        end
        resources :collections, only: %i[index create]
      end
      resources :users do
        collection do
          get 'me'
          get 'search'
          post 'create_from_emails'
        end
        resources :roles, only: %i[destroy]
      end
    end
  end

  root to: 'home#index'
  get :login, to: 'home#login', as: :login

  # catch all HTML route requests, send to frontend
  get '*path', to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
end
