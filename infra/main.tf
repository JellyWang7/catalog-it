data "aws_caller_identity" "current" {}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default_vpc_subnets" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  name_prefix    = "${var.project_name}-${var.environment}"
  schedule_state = var.enable_schedules ? "ENABLED" : "DISABLED"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "terraform"
  }
}

resource "aws_security_group" "ec2_api" {
  name        = "${local.name_prefix}-ec2-api-sg"
  description = "Allow SSH and web/API access"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.ssh_allowed_cidr]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Custom API port"
    from_port   = var.api_port
    to_port     = var.api_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_security_group" "rds_postgres" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Allow PostgreSQL from EC2 only"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    description     = "Postgres from EC2 app security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_api.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.common_tags
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = data.aws_subnets.default_vpc_subnets.ids

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

resource "aws_db_instance" "postgres" {
  identifier             = "${local.name_prefix}-postgres"
  engine                 = "postgres"
  engine_version         = "16.3"
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds_postgres.id]

  publicly_accessible    = false
  multi_az               = false
  storage_encrypted      = true
  backup_retention_period = 0
  deletion_protection    = false
  skip_final_snapshot    = true
  auto_minor_version_upgrade = true

  tags = local.common_tags
}

resource "aws_instance" "backend" {
  ami                    = data.aws_ami.amazon_linux_2023.id
  instance_type          = var.ec2_instance_type
  subnet_id              = data.aws_subnets.default_vpc_subnets.ids[0]
  vpc_security_group_ids = [aws_security_group.ec2_api.id]
  key_name               = var.ec2_key_pair_name

  root_block_device {
    volume_size = 20
    volume_type = "gp3"
  }

  user_data = <<-EOT
    #!/bin/bash
    set -euxo pipefail
    dnf update -y
    dnf install -y docker git
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ec2-user
  EOT

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-backend"
  })
}

resource "aws_s3_bucket" "frontend" {
  bucket = "${local.name_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "frontend" {
  bucket                  = aws_s3_bucket.frontend.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "frontend" {
  bucket = aws_s3_bucket.frontend.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${local.name_prefix}-frontend-oac"
  description                       = "OAC for frontend S3 bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"

  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "frontend-s3-origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "frontend-s3-origin"

    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

data "aws_iam_policy_document" "frontend_bucket_policy" {
  statement {
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.frontend.arn}/*"
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.frontend.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "frontend" {
  bucket = aws_s3_bucket.frontend.id
  policy = data.aws_iam_policy_document.frontend_bucket_policy.json
}

data "aws_iam_policy_document" "scheduler_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "scheduler" {
  name               = "${local.name_prefix}-scheduler-role"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "scheduler_actions" {
  statement {
    effect = "Allow"
    actions = [
      "ec2:StartInstances",
      "ec2:StopInstances"
    ]
    resources = [aws_instance.backend.arn]
  }

  statement {
    effect = "Allow"
    actions = [
      "rds:StartDBInstance",
      "rds:StopDBInstance"
    ]
    resources = [aws_db_instance.postgres.arn]
  }
}

resource "aws_iam_role_policy" "scheduler" {
  role   = aws_iam_role.scheduler.id
  policy = data.aws_iam_policy_document.scheduler_actions.json
}

resource "aws_scheduler_schedule" "start_ec2" {
  name                         = "${local.name_prefix}-start-ec2"
  schedule_expression          = var.daily_start_cron
  schedule_expression_timezone = var.schedule_timezone
  state                        = local.schedule_state

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:ec2:startInstances"
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ InstanceIds = [aws_instance.backend.id] })
  }
}

resource "aws_scheduler_schedule" "stop_ec2" {
  name                         = "${local.name_prefix}-stop-ec2"
  schedule_expression          = var.daily_stop_cron
  schedule_expression_timezone = var.schedule_timezone
  state                        = local.schedule_state

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:ec2:stopInstances"
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ InstanceIds = [aws_instance.backend.id] })
  }
}

resource "aws_scheduler_schedule" "start_rds" {
  name                         = "${local.name_prefix}-start-rds"
  schedule_expression          = var.daily_start_cron
  schedule_expression_timezone = var.schedule_timezone
  state                        = local.schedule_state

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:rds:startDBInstance"
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ DbInstanceIdentifier = aws_db_instance.postgres.id })
  }
}

resource "aws_scheduler_schedule" "stop_rds" {
  name                         = "${local.name_prefix}-stop-rds"
  schedule_expression          = var.daily_stop_cron
  schedule_expression_timezone = var.schedule_timezone
  state                        = local.schedule_state

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = "arn:aws:scheduler:::aws-sdk:rds:stopDBInstance"
    role_arn = aws_iam_role.scheduler.arn
    input    = jsonencode({ DbInstanceIdentifier = aws_db_instance.postgres.id })
  }
}

resource "aws_budgets_budget" "monthly_cost" {
  name              = "${local.name_prefix}-monthly-budget"
  budget_type       = "COST"
  limit_amount      = tostring(var.budget_limit_usd)
  limit_unit        = "USD"
  time_unit         = "MONTHLY"
  time_period_start = "2026-01-01_00:00"

  dynamic "notification" {
    for_each = var.budget_alert_email != "" ? [1] : []
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = 80
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = [var.budget_alert_email]
    }
  }
}

output "frontend_bucket_name" {
  value       = aws_s3_bucket.frontend.bucket
  description = "S3 bucket name for frontend static assets."
}

output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.frontend.domain_name
  description = "CloudFront domain serving the frontend."
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.frontend.id
  description = "CloudFront distribution ID for cache invalidation."
}

output "backend_instance_id" {
  value       = aws_instance.backend.id
  description = "EC2 instance ID for Rails backend."
}

output "backend_public_ip" {
  value       = aws_instance.backend.public_ip
  description = "EC2 public IP address."
}

output "rds_endpoint" {
  value       = aws_db_instance.postgres.address
  description = "RDS PostgreSQL endpoint address."
}

output "rds_db_name" {
  value       = aws_db_instance.postgres.db_name
  description = "RDS database name."
}
