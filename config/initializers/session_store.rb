
Rails.application.config.session_store :cookie_store,
                                       key: '_any_cable_session',
                                       domain: '.shape.space' # or domain: '.example.com'

# anywhere setting cookie
cookies[:val] = { value: '1', domain: '.shape.space' }
