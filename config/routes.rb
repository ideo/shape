Rails.application.routes.draw do
  devise_for :users, controllers: { omniauth_callbacks: 'users/omniauth_callbacks' }

  namespace :api do
    namespace :v1 do
      resources :collections, except: %i[index] do
        collection do
          get 'me'
        end
        member do
          post 'duplicate'
          patch 'archive'
        end
        resources :collection_cards, only: :index
        resources :roles, only: %i[index create destroy], shallow: true
      end
      resources :collection_cards, shallow: true do
        collection do
          patch 'move'
        end
        member do
          post 'duplicate'
        end
        resources :items, shallow: true, except: :index do
          member do
            post 'duplicate'
            patch 'archive'
          end
          resources :roles, only: %i[index create]
        end
        resources :collections, only: :create
        member do
          patch 'archive'
        end
      end
      resources :groups, except: :delete do
        resources :roles, only: %i[index create destroy]
      end
      resources :organizations, only: %i[show update] do
        collection do
          get 'current'
        end
        resources :collections, only: %i[create]
        resources :groups, only: %i[index]
        resources :users, only: %i[index]
      end
      resources :users do
        collection do
          get 'me'
          get 'search'
          post 'create_from_emails'
        end
        resources :roles, only: %i[destroy]
      end
      get :search, to: 'search#search', as: :search
    end
  end

  authenticate :user do
    require 'sidekiq/web'
    mount Sidekiq::Web => '/sidekiq'
  end

  namespace :callbacks do
    post 'ideo_network/users' => 'ideo_network#users'
  end

  get 'invitations/:token', to: 'invitations#accept', as: :accept_invitation

  root to: 'home#index'
  get :login, to: 'home#login', as: :login

  # catch all mailer preview paths
  get '/rails/mailers/*path' => 'rails/mailers#preview'

  # catch all HTML route requests, send to frontend
  get '*path', to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
end
