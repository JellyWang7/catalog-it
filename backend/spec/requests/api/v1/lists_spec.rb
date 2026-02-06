require 'rails_helper'

RSpec.describe "Api::V1::Lists", type: :request do
  let(:user) { create(:user) }
  let(:token) { JsonWebToken.encode(user_id: user.id) }
  let(:auth_headers) { { 'Authorization' => "Bearer #{token}" } }
  let!(:public_lists) { create_list(:list, 3, :public, :with_items, user: user) }
  let!(:private_list) { create(:list, visibility: 'private', user: user) }

  describe "GET /api/v1/lists" do
    before { get '/api/v1/lists' }

    it "returns HTTP success" do
      expect(response).to have_http_status(:success)
    end

    it "returns JSON content type" do
      expect(response.content_type).to include('application/json')
    end

    it "returns only public lists" do
      json_response = JSON.parse(response.body)
      expect(json_response.size).to eq(3)
    end

    it "includes user and items in response" do
      json_response = JSON.parse(response.body)
      first_list = json_response.first
      expect(first_list).to have_key('user')
      expect(first_list).to have_key('items')
      expect(first_list['items']).to be_an(Array)
    end

    it "does not include private lists" do
      json_response = JSON.parse(response.body)
      list_ids = json_response.map { |list| list['id'] }
      expect(list_ids).not_to include(private_list.id)
    end
  end

  describe "GET /api/v1/lists/:id" do
    context "when the list exists and is public" do
      let(:list) { public_lists.first }

      before { get "/api/v1/lists/#{list.id}" }

      it "returns HTTP success" do
        expect(response).to have_http_status(:success)
      end

      it "returns the correct list" do
        json_response = JSON.parse(response.body)
        expect(json_response['id']).to eq(list.id)
        expect(json_response['title']).to eq(list.title)
      end

      it "includes user information" do
        json_response = JSON.parse(response.body)
        expect(json_response['user']['id']).to eq(user.id)
        expect(json_response['user']['username']).to eq(user.username)
      end

      it "includes items" do
        json_response = JSON.parse(response.body)
        expect(json_response['items'].size).to eq(3)
      end
    end

    context "when the list does not exist" do
      before { get "/api/v1/lists/99999" }

      it "returns not found status" do
        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe "POST /api/v1/lists" do
    let(:valid_attributes) do
      {
        list: {
          title: 'New Test List',
          description: 'A test list description',
          visibility: 'public',
          user_id: user.id
        }
      }
    end

    let(:invalid_attributes) do
      {
        list: {
          title: '',
          visibility: 'invalid',
          user_id: user.id
        }
      }
    end

    context "with valid parameters" do
      it "creates a new List" do
        expect {
          post '/api/v1/lists', params: valid_attributes, headers: auth_headers, as: :json
        }.to change(List, :count).by(1)
      end

      it "returns HTTP created status" do
        post '/api/v1/lists', params: valid_attributes, headers: auth_headers, as: :json
        expect(response).to have_http_status(:created)
      end

      it "returns the created list" do
        post '/api/v1/lists', params: valid_attributes, headers: auth_headers, as: :json
        json_response = JSON.parse(response.body)
        expect(json_response['title']).to eq('New Test List')
      end
    end

    context "with invalid parameters" do
      it "does not create a new List" do
        expect {
          post '/api/v1/lists', params: invalid_attributes, headers: auth_headers, as: :json
        }.not_to change(List, :count)
      end

      it "returns unprocessable entity status" do
        post '/api/v1/lists', params: invalid_attributes, headers: auth_headers, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "returns error messages" do
        post '/api/v1/lists', params: invalid_attributes, headers: auth_headers, as: :json
        json_response = JSON.parse(response.body)
        expect(json_response).to have_key('errors')
      end
    end
  end

  describe "PATCH /api/v1/lists/:id" do
    let(:list) { create(:list, user: user) }
    let(:new_attributes) do
      {
        list: {
          title: 'Updated Title',
          visibility: 'public'
        }
      }
    end

    context "with valid parameters" do
      before { patch "/api/v1/lists/#{list.id}", params: new_attributes, headers: auth_headers, as: :json }

      it "returns HTTP success" do
        expect(response).to have_http_status(:success)
      end

      it "updates the list" do
        list.reload
        expect(list.title).to eq('Updated Title')
        expect(list.visibility).to eq('public')
      end
    end

    context "with invalid parameters" do
      let(:invalid_attributes) { { list: { title: '', visibility: 'invalid' } } }

      before { patch "/api/v1/lists/#{list.id}", params: invalid_attributes, headers: auth_headers, as: :json }

      it "returns unprocessable entity status" do
        expect(response).to have_http_status(:unprocessable_entity)
      end

      it "does not update the list" do
        list.reload
        expect(list.title).not_to eq('')
      end
    end
  end

  describe "DELETE /api/v1/lists/:id" do
    let!(:list) { create(:list, user: user) }

    it "destroys the requested list" do
      expect {
        delete "/api/v1/lists/#{list.id}", headers: auth_headers
      }.to change(List, :count).by(-1)
    end

    it "returns no content status" do
      delete "/api/v1/lists/#{list.id}", headers: auth_headers
      expect(response).to have_http_status(:no_content)
    end

    it "also destroys associated items" do
      list_with_items = create(:list, :with_items, user: user)
      expect {
        delete "/api/v1/lists/#{list_with_items.id}", headers: auth_headers
      }.to change(Item, :count).by(-3)
    end
  end
end
