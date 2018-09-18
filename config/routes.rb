Rails.application.routes.draw do
  devise_for :users, controllers: {
    omniauth_callbacks: 'users/omniauth_callbacks',
    sessions: 'users/login_redirect',
    registrations: 'users/login_redirect',
  }

  unauthenticated do
    root to: 'home#marketing'
  end

  authenticated :user do
    root to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
  end

  mount ActionCable.server => '/cable'

  namespace :api do
    namespace :v1 do
      resources :activities, only: %i[create]
      resources :collections, except: %i[index] do
        member do
          patch 'archive'
        end
        collection do
          post 'create_template'
        end
        resources :collection_cards, only: :index
        resources :roles, only: %i[index create destroy], shallow: true
      end
      resources :collection_cards, shallow: true, except: %i[show] do
        member do
          patch 'replace'
          patch 'update'
        end
        collection do
          patch 'move'
          patch 'archive'
          post 'link'
          post 'duplicate'
        end
        resources :items, shallow: true, except: :index do
          member do
            post 'duplicate'
            patch 'archive'
          end
          resources :roles, only: %i[index create]
        end
      end
      resources :groups, except: :delete do
        resources :roles, only: %i[index create archive destroy]
        member do
          patch 'archive'
        end
      end
      resources :organizations, except: :delete do
        collection do
          get 'current'
        end
        resources :collections, only: %i[create]
        resources :groups, only: %i[index]
        resources :users, only: %i[index]
      end
      delete 'sessions' => 'sessions#destroy'
      resources :users do
        collection do
          get 'me'
          get 'search'
          post 'create_from_emails'
          patch 'update_current_user'
          post 'switch_org'
        end
        resources :roles, only: %i[destroy]
      end
      resources :comment_threads, only: %i[index show create] do
        resources :comments, only: %i[index create]
        member do
          post 'view', action: 'view'
        end
        collection do
          get 'find_by_record/:record_type/:record_id', action: 'find_by_record'
        end
      end
      resources :notifications, only: %i[index show update] do
        collection do
          get 'user_notifications'
        end
      end
      scope :search do
        get '/', to: 'search#search', as: :search
        get 'users_and_groups', to: 'search#users_and_groups', as: :search_users_and_groups
      end
    end
  end

  authenticate :user, ->(u) { u.has_cached_role?(Role::SUPER_ADMIN) } do
    require 'sidekiq/web'
    mount Sidekiq::Web => '/sidekiq'
  end

  namespace :callbacks do
    post 'ideo_network/users' => 'ideo_network#users'
  end

  get 'passthru', to: 'urls#passthru'
  get 'invitations/:token', to: 'invitations#accept', as: :accept_invitation

  get :login, to: 'home#login', as: :login
  get :login_as, to: 'home#login_as', as: :login_as
  get :sign_up, to: 'home#sign_up', as: :sign_up

  # get '/marketing', to: 'home#marketing'

  # catch all mailer preview paths
  get '/rails/mailers/*path' => 'rails/mailers#preview'

  # custom URL for GCI
  get '/earlychildhood', to: redirect('/collections/4764')

  # catch all HTML route requests, send to frontend
  get '*path', to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
end
