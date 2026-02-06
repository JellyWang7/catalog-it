require 'rails_helper'

RSpec.describe 'Authorization', type: :request do
  let(:user) { create(:user) }
  let(:other_user) { create(:user, email: 'other@example.com', username: 'otheruser') }
  let(:token) { JsonWebToken.encode(user_id: user.id) }
  let(:other_token) { JsonWebToken.encode(user_id: other_user.id) }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }
  let(:other_auth_headers) { { 'Authorization' => "Bearer #{other_token}" } }

  describe 'Lists authorization' do
    let!(:user_private_list) { create(:list, user: user, visibility: 'private', title: 'My Private List') }
    let!(:user_public_list) { create(:list, user: user, visibility: 'public', title: 'My Public List') }
    let!(:other_user_private_list) { create(:list, user: other_user, visibility: 'private', title: 'Other Private List') }
    let!(:other_user_public_list) { create(:list, user: other_user, visibility: 'public', title: 'Other Public List') }

    describe 'GET /api/v1/lists' do
      context 'without authentication' do
        it 'returns only public lists' do
          get '/api/v1/lists'
          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          titles = json.map { |list| list['title'] }
          expect(titles).to match_array(['My Public List', 'Other Public List'])
        end
      end

      context 'with authentication' do
        it 'returns own lists (all visibility) + other users public lists' do
          get '/api/v1/lists', headers: auth_headers
          expect(response).to have_http_status(:ok)
          json = JSON.parse(response.body)
          titles = json.map { |list| list['title'] }
          expect(titles).to include('My Private List', 'My Public List', 'Other Public List')
          expect(titles).not_to include('Other Private List')
        end
      end
    end

    describe 'GET /api/v1/lists/:id' do
      context 'public list' do
        it 'allows access without authentication' do
          get "/api/v1/lists/#{user_public_list.id}"
          expect(response).to have_http_status(:ok)
        end

        it 'allows access with authentication' do
          get "/api/v1/lists/#{user_public_list.id}", headers: auth_headers
          expect(response).to have_http_status(:ok)
        end
      end

      context 'private list' do
        it 'denies access without authentication' do
          get "/api/v1/lists/#{user_private_list.id}"
          expect(response).to have_http_status(:forbidden)
          expect(JSON.parse(response.body)['error']).to eq('Not authorized to view this list')
        end

        it 'allows owner access' do
          get "/api/v1/lists/#{user_private_list.id}", headers: auth_headers
          expect(response).to have_http_status(:ok)
        end

        it 'denies non-owner access' do
          get "/api/v1/lists/#{user_private_list.id}", headers: other_auth_headers
          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    describe 'POST /api/v1/lists' do
      let(:list_params) { { list: { title: 'New List', visibility: 'private' } } }

      it 'requires authentication' do
        post '/api/v1/lists', params: list_params
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)['error']).to eq('Unauthorized')
      end

      it 'allows authenticated users to create lists' do
        post '/api/v1/lists', params: list_params, headers: auth_headers
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['user_id']).to eq(user.id)
      end

      it 'automatically associates list with current user' do
        post '/api/v1/lists', params: list_params, headers: auth_headers
        json = JSON.parse(response.body)
        expect(json['user_id']).to eq(user.id)
        expect(json['title']).to eq('New List')
      end
    end

    describe 'PATCH /api/v1/lists/:id' do
      let(:update_params) { { list: { title: 'Updated Title' } } }

      it 'requires authentication' do
        patch "/api/v1/lists/#{user_private_list.id}", params: update_params
        expect(response).to have_http_status(:unauthorized)
      end

      it 'allows owner to update their list' do
        patch "/api/v1/lists/#{user_private_list.id}", 
              params: update_params, 
              headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['title']).to eq('Updated Title')
      end

      it 'denies non-owner from updating' do
        patch "/api/v1/lists/#{user_private_list.id}", 
              params: update_params, 
              headers: other_auth_headers
        expect(response).to have_http_status(:forbidden)
        expect(JSON.parse(response.body)['error']).to eq('Not authorized to modify this list')
      end
    end

    describe 'DELETE /api/v1/lists/:id' do
      it 'requires authentication' do
        delete "/api/v1/lists/#{user_private_list.id}"
        expect(response).to have_http_status(:unauthorized)
      end

      it 'allows owner to delete their list' do
        delete "/api/v1/lists/#{user_private_list.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
        expect(List.find_by(id: user_private_list.id)).to be_nil
      end

      it 'denies non-owner from deleting' do
        delete "/api/v1/lists/#{user_private_list.id}", headers: other_auth_headers
        expect(response).to have_http_status(:forbidden)
        expect(List.find_by(id: user_private_list.id)).to be_present
      end
    end
  end

  describe 'Items authorization' do
    let!(:user_list) { create(:list, user: user, visibility: 'private') }
    let!(:other_user_list) { create(:list, user: other_user, visibility: 'private') }
    let!(:public_list) { create(:list, user: user, visibility: 'public') }
    let!(:user_item) { create(:item, list: user_list, name: 'My Item') }
    let!(:public_item) { create(:item, list: public_list, name: 'Public Item') }

    describe 'GET /api/v1/lists/:list_id/items' do
      context 'public list' do
        it 'allows access without authentication' do
          get "/api/v1/lists/#{public_list.id}/items"
          expect(response).to have_http_status(:ok)
        end
      end

      context 'private list' do
        it 'denies access without authentication' do
          get "/api/v1/lists/#{user_list.id}/items"
          expect(response).to have_http_status(:forbidden)
        end

        it 'allows owner access' do
          get "/api/v1/lists/#{user_list.id}/items", headers: auth_headers
          expect(response).to have_http_status(:ok)
        end

        it 'denies non-owner access' do
          get "/api/v1/lists/#{user_list.id}/items", headers: other_auth_headers
          expect(response).to have_http_status(:forbidden)
        end
      end
    end

    describe 'POST /api/v1/lists/:list_id/items' do
      let(:item_params) { { item: { name: 'New Item', category: 'Test' } } }

      it 'requires authentication' do
        post "/api/v1/lists/#{user_list.id}/items", params: item_params
        expect(response).to have_http_status(:unauthorized)
      end

      it 'allows owner to create items in their list' do
        post "/api/v1/lists/#{user_list.id}/items", 
             params: item_params, 
             headers: auth_headers
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['name']).to eq('New Item')
      end

      it 'denies non-owner from creating items' do
        post "/api/v1/lists/#{user_list.id}/items", 
             params: item_params, 
             headers: other_auth_headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    describe 'PATCH /api/v1/items/:id' do
      let(:update_params) { { item: { name: 'Updated Item' } } }

      it 'requires authentication' do
        patch "/api/v1/items/#{user_item.id}", params: update_params
        expect(response).to have_http_status(:unauthorized)
      end

      it 'allows owner to update items in their list' do
        patch "/api/v1/items/#{user_item.id}", 
              params: update_params, 
              headers: auth_headers
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json['name']).to eq('Updated Item')
      end

      it 'denies non-owner from updating items' do
        patch "/api/v1/items/#{user_item.id}", 
              params: update_params, 
              headers: other_auth_headers
        expect(response).to have_http_status(:forbidden)
      end
    end

    describe 'DELETE /api/v1/items/:id' do
      it 'requires authentication' do
        delete "/api/v1/items/#{user_item.id}"
        expect(response).to have_http_status(:unauthorized)
      end

      it 'allows owner to delete items from their list' do
        delete "/api/v1/items/#{user_item.id}", headers: auth_headers
        expect(response).to have_http_status(:no_content)
        expect(Item.find_by(id: user_item.id)).to be_nil
      end

      it 'denies non-owner from deleting items' do
        delete "/api/v1/items/#{user_item.id}", headers: other_auth_headers
        expect(response).to have_http_status(:forbidden)
        expect(Item.find_by(id: user_item.id)).to be_present
      end
    end
  end

  describe 'Token validation' do
    it 'rejects expired tokens' do
      expired_token = JsonWebToken.encode({ user_id: user.id }, 1.hour.ago)
      expired_headers = { 'Authorization' => "Bearer #{expired_token}" }
      
      post '/api/v1/lists', 
           params: { list: { title: 'Test' } }, 
           headers: expired_headers
      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects invalid tokens' do
      invalid_headers = { 'Authorization' => 'Bearer invalid_token_here' }
      
      post '/api/v1/lists', 
           params: { list: { title: 'Test' } }, 
           headers: invalid_headers
      expect(response).to have_http_status(:unauthorized)
    end

    it 'rejects malformed Authorization headers' do
      malformed_headers = { 'Authorization' => 'InvalidFormat token_here' }
      
      post '/api/v1/lists', 
           params: { list: { title: 'Test' } }, 
           headers: malformed_headers
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
