-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('completed', 'pending', 'paid', 'due', 'cancelled');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'paid', 'overdue', 'cancelled');

-- CreateTable
CREATE TABLE "login_credentials" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_details" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "phone_e164" VARCHAR(20),
    "bio" TEXT,
    "profile_picture" VARCHAR(500),
    "website_url" VARCHAR(500),
    "location" VARCHAR(150),
    "date_of_birth" DATE,
    "gender" VARCHAR(10),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_social_links" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "platform" VARCHAR(50) NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_social_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "author_name" VARCHAR(255),
    "author_avatar" VARCHAR(255),
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "image_url" VARCHAR(255),
    "category_id" INTEGER,
    "likes_count" INTEGER NOT NULL DEFAULT 0,
    "comments_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "freelancer_skills" (
    "id" SERIAL NOT NULL,
    "freelancer_id" INTEGER NOT NULL,
    "skill_id" INTEGER NOT NULL,
    "proficiency_level" INTEGER,
    "years_of_experience" DECIMAL(4,1),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "freelancer_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "location" VARCHAR(255),
    "event_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_time" VARCHAR(10),
    "category" VARCHAR(100),
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "max_attendees" INTEGER,
    "current_attendees" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "day" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project" (
    "id" SERIAL NOT NULL,
    "client_id" INTEGER NOT NULL,
    "freelancer_id" INTEGER,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "budget" DECIMAL(10,2) NOT NULL,
    "deadline" DATE,
    "status" VARCHAR(50) DEFAULT 'open',
    "category_id" INTEGER,
    "skills_required" TEXT[],
    "priority" VARCHAR(20) DEFAULT 'medium',
    "completion_date" DATE,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_proposals" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "freelancer_id" INTEGER NOT NULL,
    "proposed_budget" DECIMAL(10,2) NOT NULL,
    "delivery_time" INTEGER NOT NULL,
    "proposal_text" TEXT NOT NULL,
    "status" VARCHAR(50) DEFAULT 'pending',
    "cover_letter" TEXT,
    "portfolio_links" TEXT[],
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER NOT NULL,
    "reviewer_id" INTEGER NOT NULL,
    "reviewed_id" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_profiles" (
    "user_id" INTEGER NOT NULL,
    "avatar" VARCHAR(255),
    "bio" TEXT,
    "interests" TEXT,
    "profile_views" INTEGER NOT NULL DEFAULT 0,
    "projects_count" INTEGER NOT NULL DEFAULT 0,
    "connections_count" INTEGER NOT NULL DEFAULT 0,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_active_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "priority" SMALLINT NOT NULL DEFAULT 0,
    "read_status" BOOLEAN NOT NULL DEFAULT false,
    "related_id" INTEGER,
    "related_type" VARCHAR(50),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_questionnaire_responses" (
    "id" SERIAL NOT NULL,
    "project_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "session_id" VARCHAR(255),
    "project_type" VARCHAR(100),
    "project_scope" VARCHAR(50),
    "timeline" VARCHAR(50),
    "budget_range" VARCHAR(50),
    "technical_level" VARCHAR(50),
    "preferred_tools" TEXT[],
    "design_provided" BOOLEAN DEFAULT false,
    "content_ready" BOOLEAN DEFAULT false,
    "communication_frequency" VARCHAR(50),
    "meeting_preference" VARCHAR(50),
    "timezone" VARCHAR(100),
    "special_requirements" TEXT,
    "target_audience" VARCHAR(255),
    "success_metrics" TEXT,
    "inspiration_links" TEXT[],
    "competitor_analysis" TEXT,
    "is_complete" BOOLEAN NOT NULL DEFAULT false,
    "completion_percentage" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_questionnaire_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'GTQ',
    "status" "TransactionStatus" NOT NULL DEFAULT 'pending',
    "transaction_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" INTEGER NOT NULL,
    "project_id" INTEGER,
    "category_id" INTEGER,
    "invoice_id" INTEGER,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" SERIAL NOT NULL,
    "invoice_number" VARCHAR(50),
    "client_name" VARCHAR(255) NOT NULL,
    "client_email" VARCHAR(255),
    "amount" DECIMAL(12,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "issue_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commissions" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "project_id" INTEGER,
    "amount" DECIMAL(12,2) NOT NULL,
    "rate" DECIMAL(5,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_credentials_username_key" ON "login_credentials"("username");

-- CreateIndex
CREATE UNIQUE INDEX "login_credentials_email_key" ON "login_credentials"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_user_id_key" ON "user_details"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_phone_e164_key" ON "user_details"("phone_e164");

-- CreateIndex
CREATE UNIQUE INDEX "user_social_links_user_id_platform_key" ON "user_social_links"("user_id", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "freelancer_skills_freelancer_id_skill_id_key" ON "freelancer_skills"("freelancer_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "project_proposals_project_id_freelancer_id_key" ON "project_proposals"("project_id", "freelancer_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_project_id_key" ON "reviews"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_questionnaire_responses_project_id_key" ON "project_questionnaire_responses"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_questionnaire_responses_session_id_key" ON "project_questionnaire_responses"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "transaction_categories_name_key" ON "transaction_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_social_links" ADD CONSTRAINT "user_social_links_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user_details"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "event" ADD CONSTRAINT "event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "login_credentials"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_id_fkey" FOREIGN KEY ("reviewed_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_questionnaire_responses" ADD CONSTRAINT "project_questionnaire_responses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_questionnaire_responses" ADD CONSTRAINT "project_questionnaire_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "transaction_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commissions" ADD CONSTRAINT "commissions_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
