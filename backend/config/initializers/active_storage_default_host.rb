# frozen_string_literal: true

# API-only apps sometimes lack a default host for url_for; Active Storage blob URLs then raise.
# Set from the same env vars used by BlobUrlOptions so blob links work even if a request
# has an odd Host header (e.g. internal ALB hostname).
raw = ENV["PUBLIC_APP_URL"].presence || ENV["FRONTEND_URL"].presence
if raw.present?
  uri = URI.parse(raw.start_with?("http") ? raw : "https://#{raw}")
  Rails.application.routes.default_url_options[:host] = uri.host
  Rails.application.routes.default_url_options[:protocol] = uri.scheme.presence || "https"
  port = uri.port
  if port.present? && !((uri.scheme == "https" && port == 443) || (uri.scheme == "http" && port == 80))
    Rails.application.routes.default_url_options[:port] = port
  end
end
