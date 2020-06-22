Rails.application.routes.draw do
  devise_for :users, controllers: {
    omniauth_callbacks: 'users/omniauth_callbacks',
    sessions: 'users/login_redirect',
    registrations: 'users/login_redirect',
  }

  unauthenticated do
    root to: 'home#marketing'
    get 'terms', to: 'home#marketing'
  end

  authenticated :user do
    root to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
  end

  if ENV['ACTION_CABLE_ADAPTER'] != 'anycable' || ENV['ANYCABLE_DEPLOYMENT']
    mount ActionCable.server => '/cable'
  else
    get 'cable', to: 'home#not_found'
  end

  namespace :api do
    namespace :v1 do
      resources :activities, only: %i[create]
      resources :question_choices, only: %i[update]
      resources :collections do
        member do
          get 'in_my_collection'
          get 'direct_children_tag_list'
          get 'submission_box_sub_collections'
          get 'phase_sub_collections'
          get 'challenge_phase_collections'
          post 'clear_collection_cover'
          patch 'submit'
          patch 'restore_permissions'
          post 'background_update_template_instances'
          post 'insert_row'
          post 'remove_row'
          post 'background_update_live_test'
        end
        collection do
          post 'create_template'
          post 'set_submission_box_template'
        end
        resources :collection_cards, only: %i[index] do
          collection do
            get 'ids'
            get 'ids_in_direction'
            get 'breadcrumb_records'
          end
        end
        resources :roles, only: %i[index create destroy] do
          collection do
            delete '', action: 'destroy'
            get 'will_become_private'
          end
        end
        resources :datasets, only: %i[show] do
          collection do
            post 'select'
            post 'unselect'
          end
        end
        resources :collection_filters, only: %i[create update destroy]
      end
      resources :items do
        member do
          post 'duplicate'
          patch 'archive'
          get 'in_my_collection'
          get 'csv_report'
          patch 'restore_permissions'
          patch 'highlight'
          get 'datasets'
        end
        resources :roles, only: %i[index create destroy] do
          collection do
            delete '', action: 'destroy'
            get 'will_become_private'
          end
        end
        resources :question_choices, only: %i[create destroy] do
          member do
            post 'archive'
          end
        end
      end
      resources :datasets, only: %i[index show create update destroy] do
        resources :roles, only: %i[index create destroy] do
          collection do
            delete '', action: 'destroy'
          end
        end
      end
      resources :test_collections, only: %i[show] do
        member do
          get 'validate_launch'
          patch 'launch'
          patch 'close'
          patch 'reopen'
          get 'next_available'
          post 'add_comparison'
          post 'remove_comparison'
          get 'csv_report'
        end
      end
      resources :items, only: %i[create]
      resources :collection_cards, shallow: true do
        member do
          patch 'replace'
          patch 'update'
          patch 'update_card_filter'
          patch 'toggle_pin'
          delete 'destroy'
        end
        collection do
          patch 'move'
          patch 'archive'
          patch 'unarchive'
          patch 'add_tag'
          patch 'remove_tag'
          get 'unarchive_from_email'
          post 'link'
          post 'duplicate'
        end
      end
      resources :groups, except: :delete do
        member do
          patch 'archive'
        end
        resources :roles, only: %i[index create destroy] do
          collection do
            delete '', action: 'destroy'
          end
        end
      end
      resources :organizations, except: :delete do
        collection do
          get 'current'
        end
        member do
          patch 'add_terms_text'
          patch 'remove_terms_text'
          patch 'bump_terms_version'
          get 'check_payments'
          get 'my_collection'
          get 'admin_users'
        end

        get 'search', to: 'search#search'
        get 'search_users_and_tags', to: 'search#search_users_and_tags' 
        get 'search_collection_cards', to: 'search#search_collection_cards'
        resources :tags, only: %i[index]
        resources :collections, only: %i[create]
        resources :groups, only: %i[index create update]
        resources :users, only: %i[index]
        resources :audiences, only: %i[index]
      end
      delete 'sessions' => 'sessions#destroy'
      resources :users do
        collection do
          get 'me'
          post 'create_from_emails'
          post 'create_limited_user'
          patch 'update_current_user'
          patch 'update_survey_respondent'
          patch 'accept_current_org_terms'
        end
        resources :roles, only: %i[destroy]
      end
      resources :comments do
        member do
          get 'replies'
          patch 'resolve'
        end
      end
      resources :collection_filters, only: %i[update] do
        member do
          post 'select'
          post 'unselect'
        end
      end
      resources :comment_threads, only: %i[index show create subscribe unsubscribe] do
        resources :comments, only: %i[index create]
        member do
          post 'view', action: 'view'
          patch 'subscribe'
          patch 'unsubscribe'
        end
        collection do
          get 'find_by_record/:record_type/:record_id', action: 'find_by_record'
          get 'find_by_comment/:comment_id', action: 'find_by_comment'
        end
      end
      resources :notifications, only: %i[index show update] do
        collection do
          get 'user_notifications'
        end
      end
      resources :test_audiences, only: %i[create update destroy]
      resources :test_audiences, shallow: true do
        member do
          patch 'toggle_status'
        end
      end
      scope :filestack do
        get 'token', to: 'filestack#token', as: :filestack_token
      end
      scope :search do
        get 'users_and_groups', to: 'search#users_and_groups', as: :search_users_and_groups
        get 'organizations', to: 'search#organizations', as: :search_organizations
      end
      # unauthenticated routes:
      resources :survey_responses, only: %i[show create] do
        # not shallow because we always want to look up survey_response by session_uid
        resources :question_answers, only: %i[create update]
      end

      resources :audiences, only: %i[index show create]

      namespace :admin do
        resources :users, only: %i[index destroy create] do
          collection do
            get :search
          end
        end
        resources :test_collections, only: %i[index]
        resources :paid_tests, only: [] do
          collection do
            get 'finance_export'
            get 'months_with_purchases'
            get 'pending_incentives_export'
          end
        end
      end
    end
  end

  resources :tests, only: %i[show] do
    collection do
      get 't/:token', to: 'tests#token_auth'
      get 'completed'
    end
  end

  namespace :admin do
    root to: 'dashboard#index'
  end

  authenticate :user, ->(u) { Rails.env.development? || u.has_cached_role?(Role::SUPER_ADMIN) } do
    require 'sidekiq/web'
    require 'sidekiq-scheduler/web'
    mount Sidekiq::Web => '/sidekiq'
  end

  namespace :callbacks do
    post 'ideo_network/payment_methods' => 'ideo_network#payment_methods'
    post 'ideo_network/invoices' => 'ideo_network#invoices'
    post 'ideo_network/users' => 'ideo_network#users'
    post 'ideo_network/groups' => 'ideo_network#groups'
    post 'ideo_network/users_roles' => 'ideo_network#users_roles'
    post 'slack/event' => 'slack#event'
  end

  resources :reports, only: %i[show]

  get 'passthru', to: 'urls#passthru'
  post 'webhooks/filestack', to: 'webhooks#filestack'
  get 'invitations/:token', to: 'invitations#accept', as: :accept_invitation
  get 'templates/:id/use_in_my_collection', to: 'templates#use_in_my_collection'

  get :login, to: 'home#login', as: :login
  get :login_as, to: 'home#login_as', as: :login_as
  get :sign_up, to: 'home#sign_up', as: :sign_up
  get 'sign_out_and_redirect/:provider', to: 'home#sign_out_and_redirect'

  # catch all mailer preview paths
  get '/rails/mailers/*path' => 'rails/mailers#preview'

  # custom URL for GCI
  get '/earlychildhood', to: redirect('/collections/4764')

  # catch all marketing route request
  get '/product/*path', to: 'home#marketing', constraints: ->(req) { req.format == :html || req.format == '*/*' }
  # catch all HTML route requests, send to frontend
  get '*path', to: 'home#index', constraints: ->(req) { req.format == :html || req.format == '*/*' }
end
