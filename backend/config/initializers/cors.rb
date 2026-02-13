Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow different origins based on environment
    if Rails.env.production?
      # In production, use environment variable for frontend URL
      origins ENV.fetch('FRONTEND_URL', 'https://catalogit.netlify.app')
    else
      # In development, allow localhost
      origins 'http://localhost:5173', 'http://localhost:3000'
    end
    
    resource '*',
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: true
  end
end
