ALTER TABLE "grammar" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "grammar" ADD COLUMN "created_by" varchar(100);--> statement-breakpoint
ALTER TABLE "kanji" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "kanji" ADD COLUMN "created_by" varchar(100);--> statement-breakpoint
ALTER TABLE "listening" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "listening" ADD COLUMN "created_by" varchar(100);--> statement-breakpoint
ALTER TABLE "reading" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "reading" ADD COLUMN "created_by" varchar(100);--> statement-breakpoint
ALTER TABLE "vocabulary" ADD COLUMN "is_public" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "vocabulary" ADD COLUMN "created_by" varchar(100);