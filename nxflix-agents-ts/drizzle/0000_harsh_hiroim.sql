CREATE TABLE "focus_sessions" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"content_id" varchar(100) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"item_id" varchar(100) NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"revealed" boolean DEFAULT false,
	"time_spent_seconds" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grammar" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"pattern" text NOT NULL,
	"meaning" text NOT NULL,
	"meaning_jp" text,
	"example" text NOT NULL,
	"example_translation" text,
	"explanation" text,
	"formation_rules" jsonb,
	"usage_notes" text,
	"category" varchar(50) DEFAULT 'general' NOT NULL,
	"level" varchar(10) DEFAULT 'N1' NOT NULL,
	"related_patterns" jsonb DEFAULT '[]'::jsonb,
	"content_type" varchar(20) DEFAULT 'grammar' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kanji" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"character" varchar(10) NOT NULL,
	"stroke_count" integer NOT NULL,
	"onyomi" jsonb NOT NULL,
	"kunyomi" jsonb NOT NULL,
	"meanings" jsonb NOT NULL,
	"radicals" jsonb DEFAULT '[]'::jsonb,
	"compound_words" jsonb DEFAULT '[]'::jsonb,
	"mnemonics" text,
	"level" varchar(10) DEFAULT 'N1' NOT NULL,
	"content_type" varchar(20) DEFAULT 'kanji' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listening" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"listening_type" varchar(30) NOT NULL,
	"title" text,
	"description" text,
	"audio_url" text,
	"audio_base64" text,
	"transcript" text NOT NULL,
	"dialogue" jsonb DEFAULT '[]'::jsonb,
	"speakers" jsonb DEFAULT '[]'::jsonb,
	"duration_seconds" integer NOT NULL,
	"questions" jsonb NOT NULL,
	"situation_context" text,
	"level" varchar(10) DEFAULT 'N1' NOT NULL,
	"content_type" varchar(20) DEFAULT 'listening' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reading" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"passage_type" varchar(20) NOT NULL,
	"title" text,
	"content" text NOT NULL,
	"word_count" integer NOT NULL,
	"questions" jsonb NOT NULL,
	"key_vocabulary" jsonb DEFAULT '[]'::jsonb,
	"level" varchar(10) DEFAULT 'N1' NOT NULL,
	"content_type" varchar(20) DEFAULT 'reading' NOT NULL,
	"estimated_minutes" integer DEFAULT 5,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_progress" (
	"id" varchar(200) PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"item_id" varchar(100) NOT NULL,
	"content_type" varchar(20) NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"times_studied" integer DEFAULT 0 NOT NULL,
	"times_correct" integer DEFAULT 0 NOT NULL,
	"last_score" real,
	"mastery_level" integer DEFAULT 0 NOT NULL,
	"next_review_at" timestamp,
	"last_studied_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_projects" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"prompt" text NOT NULL,
	"script" jsonb,
	"character_style" varchar(50),
	"video_style" varchar(50),
	"voice" varchar(100),
	"status" varchar(20) DEFAULT 'draft' NOT NULL,
	"audio_url" text,
	"audio_base64" text,
	"video_url" text,
	"thumbnail_url" text,
	"error_message" text,
	"progress" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vocabulary" (
	"id" varchar(100) PRIMARY KEY NOT NULL,
	"word" text NOT NULL,
	"reading" text NOT NULL,
	"meanings" jsonb NOT NULL,
	"part_of_speech" varchar(50) NOT NULL,
	"examples" jsonb DEFAULT '[]'::jsonb,
	"synonyms" jsonb DEFAULT '[]'::jsonb,
	"level" varchar(10) DEFAULT 'N1' NOT NULL,
	"content_type" varchar(20) DEFAULT 'vocabulary' NOT NULL,
	"audio_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
