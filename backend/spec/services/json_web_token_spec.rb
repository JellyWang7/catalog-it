require 'rails_helper'

RSpec.describe JsonWebToken do
  let(:payload) { { user_id: 1 } }
  let(:token) { JsonWebToken.encode(payload) }

  describe '.encode' do
    it 'returns a token' do
      expect(token).to be_a(String)
      expect(token.split('.').length).to eq(3) # JWT has 3 parts
    end

    it 'includes the payload' do
      decoded = JsonWebToken.decode(token)
      expect(decoded[:user_id]).to eq(1)
    end

    it 'adds expiration time' do
      decoded = JsonWebToken.decode(token)
      expect(decoded[:exp]).to be_present
      expect(decoded[:exp]).to be > Time.now.to_i
    end

    it 'sets expiration to 24 hours by default' do
      decoded = JsonWebToken.decode(token)
      expected_exp = 24.hours.from_now.to_i
      expect(decoded[:exp]).to be_within(10).of(expected_exp)
    end

    it 'allows custom expiration time' do
      custom_exp = 1.hour.from_now
      custom_token = JsonWebToken.encode(payload, custom_exp)
      decoded = JsonWebToken.decode(custom_token)
      expect(decoded[:exp]).to be_within(10).of(custom_exp.to_i)
    end
  end

  describe '.decode' do
    it 'decodes a valid token' do
      decoded = JsonWebToken.decode(token)
      expect(decoded).to be_a(Hash)
      expect(decoded[:user_id]).to eq(1)
    end

    it 'returns nil for invalid token' do
      expect(JsonWebToken.decode('invalid_token')).to be_nil
    end

    it 'returns nil for expired token' do
      expired_token = JsonWebToken.encode(payload, 1.hour.ago)
      expect(JsonWebToken.decode(expired_token)).to be_nil
    end

    it 'returns nil for nil token' do
      expect(JsonWebToken.decode(nil)).to be_nil
    end

    it 'returns nil for empty string' do
      expect(JsonWebToken.decode('')).to be_nil
    end

    it 'returns HashWithIndifferentAccess' do
      decoded = JsonWebToken.decode(token)
      expect(decoded).to be_a(ActiveSupport::HashWithIndifferentAccess)
      expect(decoded['user_id']).to eq(1) # String key access
      expect(decoded[:user_id]).to eq(1)   # Symbol key access
    end
  end

  describe 'token validation' do
    it 'rejects token with wrong secret' do
      # Encode with different secret
      wrong_secret_token = JWT.encode(payload.merge(exp: 24.hours.from_now.to_i), 'wrong_secret')
      expect(JsonWebToken.decode(wrong_secret_token)).to be_nil
    end

    it 'accepts token with correct secret' do
      decoded = JsonWebToken.decode(token)
      expect(decoded).to be_present
      expect(decoded[:user_id]).to eq(1)
    end
  end

  describe 'edge cases' do
    it 'handles multiple payload fields' do
      complex_payload = {
        user_id: 1,
        email: 'test@example.com',
        role: 'admin'
      }
      complex_token = JsonWebToken.encode(complex_payload)
      decoded = JsonWebToken.decode(complex_token)
      
      expect(decoded[:user_id]).to eq(1)
      expect(decoded[:email]).to eq('test@example.com')
      expect(decoded[:role]).to eq('admin')
    end

    it 'handles special characters in payload' do
      special_payload = {
        user_id: 1,
        email: 'test+tag@example.com'
      }
      special_token = JsonWebToken.encode(special_payload)
      decoded = JsonWebToken.decode(special_token)
      
      expect(decoded[:email]).to eq('test+tag@example.com')
    end

    it 'handles large user IDs' do
      large_id_payload = { user_id: 999999999 }
      large_id_token = JsonWebToken.encode(large_id_payload)
      decoded = JsonWebToken.decode(large_id_token)
      
      expect(decoded[:user_id]).to eq(999999999)
    end
  end
end
