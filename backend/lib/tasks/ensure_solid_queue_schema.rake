# frozen_string_literal: true

namespace :db do
  desc "Load db/queue_schema.rb on the queue DB if solid_queue_jobs is missing (fixes Active Storage PurgeJob/AnalyzeJob enqueue 500s)"
  task ensure_solid_queue: :environment do
    queue_cfg = ActiveRecord::Base.configurations.configs_for(env_name: Rails.env, name: "queue")
    unless queue_cfg
      puts "[db:ensure_solid_queue] No database.yml entry named 'queue' for #{Rails.env}; skipping."
      next
    end

    # Rails 8.1 removed `connected_to(database: ...)`. Temporarily point Base at the
    # queue config (same DB as primary here; separate handler for Solid Queue).
    previous = ActiveRecord::Base.connection_db_config
    begin
      ActiveRecord::Base.establish_connection(queue_cfg)
      conn = ActiveRecord::Base.connection
      if conn.data_source_exists?("solid_queue_jobs")
        puts "[db:ensure_solid_queue] solid_queue_jobs already present."
      else
        path = Rails.root.join("db/queue_schema.rb")
        raise "[db:ensure_solid_queue] Missing #{path}" unless path.file?

        puts "[db:ensure_solid_queue] Loading #{path} ..."
        load path
        puts "[db:ensure_solid_queue] Done."
      end
    ensure
      ActiveRecord::Base.establish_connection(previous)
    end
  end
end
