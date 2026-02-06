# config/initializers/rack_attack.rb

class Rack::Attack
  ### Configure Cache ###
  
  # If you don't want to use Rails.cache (Rack::Attack's default), then
  # configure it here.
  #
  # Note: The store is only used for throttling (not blocklisting and
  # safelisting). It must implement .increment and .write like
  # ActiveSupport::Cache::Store
  
  # Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new
  
  ### Throttle Specific Requests ###
  
  # Throttle login attempts by email address
  throttle('logins/email', limit: 5, period: 60.seconds) do |req|
    if req.path == '/api/v1/auth/login' && req.post?
      # Normalize the email to prevent case-sensitivity issues
      req.params.dig('user', 'email')&.downcase
    end
  end
  
  # Throttle signup attempts by IP address
  throttle('signups/ip', limit: 3, period: 300.seconds) do |req|
    if req.path == '/api/v1/auth/signup' && req.post?
      req.ip
    end
  end
  
  # Throttle all requests by IP address (general API rate limiting)
  throttle('api/ip', limit: 300, period: 5.minutes) do |req|
    req.ip if req.path.start_with?('/api/')
  end
  
  # Throttle POST/PUT/PATCH/DELETE requests more aggressively
  throttle('api/writes/ip', limit: 60, period: 1.minute) do |req|
    if req.path.start_with?('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].include?(req.request_method)
      req.ip
    end
  end
  
  ### Custom Throttle Response ###
  
  # By default, Rack::Attack returns a 429 status code for throttled requests
  self.throttled_responder = lambda do |req|
    match_data = req.env['rack.attack.match_data']
    now = match_data[:epoch_time]
    
    headers = {
      'Content-Type' => 'application/json',
      'X-RateLimit-Limit' => match_data[:limit].to_s,
      'X-RateLimit-Remaining' => '0',
      'X-RateLimit-Reset' => (now + (match_data[:period] - now % match_data[:period])).to_s
    }
    
    [429, headers, [{ error: 'Rate limit exceeded. Please try again later.' }.to_json]]
  end
end
