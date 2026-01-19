CREATE TABLE "content_epoch_stats" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"epoch_id" varchar(100) NOT NULL,
	"content_id" varchar(100) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"creator_id" varchar(100),
	"view_count" integer DEFAULT 0 NOT NULL,
	"study_count" integer DEFAULT 0 NOT NULL,
	"completion_count" integer DEFAULT 0 NOT NULL,
	"save_count" integer DEFAULT 0 NOT NULL,
	"share_count" integer DEFAULT 0 NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"average_rating" real,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_events" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"content_id" varchar(100) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"user_id" varchar(100),
	"event_type" varchar(30) NOT NULL,
	"event_data" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_points" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"creator_id" varchar(100) NOT NULL,
	"epoch_id" varchar(100) NOT NULL,
	"points_earned" integer DEFAULT 0 NOT NULL,
	"tier" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_rewards" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"creator_id" varchar(100) NOT NULL,
	"epoch_id" varchar(100) NOT NULL,
	"points_earned" integer NOT NULL,
	"tier" varchar(20),
	"reward_type" varchar(50),
	"reward_value" text,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar(100),
	"reviewed_at" timestamp,
	"token_amount" real,
	"distributed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_rewards" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"reward_date" timestamp NOT NULL,
	"qualifying_task_id" varchar(100),
	"qualifying_task_type" varchar(50),
	"reward_rarity" varchar(20) NOT NULL,
	"reward_type" varchar(50) NOT NULL,
	"reward_value" text,
	"claimed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "epochs" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"epoch_type" varchar(20) NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "featured_content" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"content_id" varchar(100) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"creator_id" varchar(100),
	"feature_date" timestamp NOT NULL,
	"feature_reason" text,
	"impressions" integer DEFAULT 0 NOT NULL,
	"clicks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
