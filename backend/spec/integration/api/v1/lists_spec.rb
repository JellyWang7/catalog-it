# frozen_string_literal: true

require 'swagger_helper'

RSpec.describe 'api/v1/lists', type: :request do
  path '/api/v1/lists' do
    get('List all public lists') do
      tags 'Lists'
      produces 'application/json'
      description 'Retrieves all public lists with their associated items'

      response(200, 'successful') do
        schema type: :array,
          items: {
            type: :object,
            properties: {
              id: { type: :integer },
              title: { type: :string },
              description: { type: :string, nullable: true },
              visibility: { type: :string },
              user_id: { type: :integer },
              created_at: { type: :string, format: 'date-time' },
              updated_at: { type: :string, format: 'date-time' },
              items: {
                type: :array,
                items: { '$ref' => '#/components/schemas/Item' }
              }
            }
          }

        let!(:list) { create(:list, :public) }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data).to be_an(Array)
          expect(data.first).to have_key('id')
          expect(data.first).to have_key('title')
        end
      end
    end

    post('Create a new list') do
      tags 'Lists'
      consumes 'application/json'
      produces 'application/json'
      description 'Creates a new list'
      security [{ bearerAuth: [] }]
      parameter name: 'Authorization', in: :header, type: :string, required: true

      parameter name: :list, in: :body, schema: {
        type: :object,
        properties: {
          list: {
            type: :object,
            properties: {
              title: { type: :string },
              description: { type: :string },
              visibility: { type: :string, enum: %w[public private shared] }
            },
            required: ['title']
          }
        },
        required: ['list']
      }

      response(201, 'list created') do
        schema '$ref' => '#/components/schemas/List'

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
        let(:list) do
          {
            list: {
              title: 'New List',
              description: 'A brand new list',
              visibility: 'public'
            }
          }
        end

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['title']).to eq('New List')
        end
      end

      response(422, 'invalid request') do
        schema '$ref' => '#/components/schemas/Error'

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
        let(:list) { { list: { title: '' } } }

        run_test!
      end
    end
  end

  path '/api/v1/lists/{id}' do
    parameter name: 'id', in: :path, type: :integer, description: 'List ID'

    get('Show a specific list') do
      tags 'Lists'
      produces 'application/json'
      description 'Retrieves a specific list with all its items'

      response(200, 'successful') do
        schema type: :object,
          properties: {
            id: { type: :integer },
            title: { type: :string },
            description: { type: :string, nullable: true },
            visibility: { type: :string },
            user_id: { type: :integer },
            created_at: { type: :string, format: 'date-time' },
            updated_at: { type: :string, format: 'date-time' },
            items: {
              type: :array,
              items: { '$ref' => '#/components/schemas/Item' }
            }
          }

        let(:id) { create(:list, :public).id }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data).to have_key('id')
          expect(data).to have_key('items')
        end
      end

      response(404, 'list not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:id) { 999_999 }

        run_test!
      end
    end

    patch('Update a list') do
      tags 'Lists'
      consumes 'application/json'
      produces 'application/json'
      description 'Updates an existing list'
      security [{ bearerAuth: [] }]
      parameter name: 'Authorization', in: :header, type: :string, required: true

      parameter name: :list, in: :body, schema: {
        type: :object,
        properties: {
          list: {
            type: :object,
            properties: {
              title: { type: :string },
              description: { type: :string },
              visibility: { type: :string, enum: %w[public private shared] }
            }
          }
        },
        required: ['list']
      }

      response(200, 'list updated') do
        schema '$ref' => '#/components/schemas/List'

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
        let(:id) { create(:list, user: user).id }
        let(:list) { { list: { title: 'Updated Title' } } }

        run_test! do |response|
          data = JSON.parse(response.body)
          expect(data['title']).to eq('Updated Title')
        end
      end

      response(404, 'list not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
        let(:id) { 999_999 }
        let(:list) { { list: { title: 'Updated Title' } } }

        run_test!
      end
    end

    delete('Delete a list') do
      tags 'Lists'
      produces 'application/json'
      description 'Deletes a list and all its items'
      security [{ bearerAuth: [] }]
      parameter name: 'Authorization', in: :header, type: :string, required: true

      response(204, 'list deleted') do
        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
        let(:id) { create(:list, user: user).id }

        run_test!
      end

      response(404, 'list not found') do
        schema '$ref' => '#/components/schemas/Error'

        let(:user) { create(:user) }
        let(:Authorization) { "Bearer #{JsonWebToken.encode(user_id: user.id)}" }
        let(:id) { 999_999 }

        run_test!
      end
    end
  end
end
