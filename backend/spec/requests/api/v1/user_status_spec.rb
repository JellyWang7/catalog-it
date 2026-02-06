require 'rails_helper'

RSpec.describe 'User Status Management', type: :request do
  let(:user) { create(:user, email: 'active@example.com', password: 'password123') }

  describe 'Login with different user statuses' do
    context 'active user' do
      it 'allows login' do
        post '/api/v1/auth/login', params: { 
          user: { email: user.email, password: 'password123' } 
        }
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include('token')
      end

      it 'returns user status in response' do
        post '/api/v1/auth/login', params: { 
          user: { email: user.email, password: 'password123' } 
        }
        json = JSON.parse(response.body)
        expect(json['user']['status']).to eq('active')
      end
    end

    context 'suspended user' do
      before { user.update(status: 'suspended') }

      it 'denies login' do
        post '/api/v1/auth/login', params: { 
          user: { email: user.email, password: 'password123' } 
        }
        expect(response).to have_http_status(:forbidden)
      end

      it 'returns appropriate error message' do
        post '/api/v1/auth/login', params: { 
          user: { email: user.email, password: 'password123' } 
        }
        json = JSON.parse(response.body)
        expect(json['error']).to include('suspended')
      end
    end

    context 'deleted user' do
      before { user.update(status: 'deleted') }

      it 'denies login' do
        post '/api/v1/auth/login', params: { 
          user: { email: user.email, password: 'password123' } 
        }
        expect(response).to have_http_status(:forbidden)
      end

      it 'returns appropriate error message' do
        post '/api/v1/auth/login', params: { 
          user: { email: user.email, password: 'password123' } 
        }
        json = JSON.parse(response.body)
        expect(json['error']).to include('deleted')
      end
    end
  end

  describe 'API access with suspended/deleted user token' do
    let(:token) { JsonWebToken.encode(user_id: user.id) }
    let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }

    context 'when user is suspended after token was issued' do
      before { user.update(status: 'suspended') }

      it 'denies access to protected endpoints' do
        post '/api/v1/lists', 
             params: { list: { title: 'Test' } }, 
             headers: auth_headers
        expect(response).to have_http_status(:unauthorized)
      end

      it 'denies access to /me endpoint' do
        get '/api/v1/auth/me', headers: auth_headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'when user is deleted after token was issued' do
      before { user.update(status: 'deleted') }

      it 'denies access to protected endpoints' do
        post '/api/v1/lists', 
             params: { list: { title: 'Test' } }, 
             headers: auth_headers
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'Signup includes status' do
    it 'returns status in signup response' do
      post '/api/v1/auth/signup', params: {
        user: {
          username: 'newuser',
          email: 'new@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['user']['status']).to eq('active')
    end
  end

  describe 'Current user endpoint includes status' do
    it 'returns status in /me response' do
      token = JsonWebToken.encode(user_id: user.id)
      get '/api/v1/auth/me', headers: { 'Authorization' => "Bearer #{token}" }
      
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json['user']['status']).to eq('active')
    end
  end
end
