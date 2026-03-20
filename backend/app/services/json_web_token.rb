class JsonWebToken
  # Secret key for encoding/decoding tokens
  # In production, use ENV variable or Rails credentials
  SECRET_KEY = Rails.application.secret_key_base || Rails.application.credentials.secret_key_base

  # Encode a payload with expiration time
  def self.encode(payload, exp = 24.hours.from_now)
    payload[:exp] = exp.to_i
    JWT.encode(payload, SECRET_KEY)
  end

  # Decode a token and return the payload
  def self.decode(token)
    body = JWT.decode(token, SECRET_KEY)[0]
    HashWithIndifferentAccess.new(body)
  rescue JWT::ExpiredSignature, JWT::DecodeError => e
    nil
  end
end
