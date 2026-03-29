CREATE TYPE "public"."accreditation_category" AS ENUM('press', 'photographer', 'enr');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('applicant', 'noc_admin', 'ioc_admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending', 'approved', 'returned', 'resubmitted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('application_submitted', 'application_resubmitted', 'application_approved', 'application_returned', 'application_rejected', 'email_verified', 'admin_login', 'duplicate_flag_raised', 'export_generated', 'pbn_submitted');--> statement-breakpoint
CREATE TYPE "public"."org_type" AS ENUM('media_print_online', 'media_broadcast', 'news_agency', 'enr');--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"noc_code" text,
	"display_name" text NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference_number" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"noc_code" text NOT NULL,
	"contact_name" text NOT NULL,
	"contact_email" text NOT NULL,
	"category" "accreditation_category" NOT NULL,
	"about" text NOT NULL,
	"status" "application_status" DEFAULT 'pending' NOT NULL,
	"resubmission_count" integer DEFAULT 0 NOT NULL,
	"review_note" text,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applications_reference_number_unique" UNIQUE("reference_number")
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" "actor_type" NOT NULL,
	"actor_id" text,
	"actor_label" text,
	"action" "audit_action" NOT NULL,
	"application_id" uuid,
	"organization_id" uuid,
	"detail" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "magic_link_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "magic_link_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"noc_code" text NOT NULL,
	"org_type" "org_type" NOT NULL,
	"website" text,
	"email_domain" text NOT NULL,
	"common_codes_id" text,
	"is_multi_territory_flag" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;