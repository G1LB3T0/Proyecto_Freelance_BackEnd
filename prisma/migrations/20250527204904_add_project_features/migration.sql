-- CreateTable
CREATE TABLE "login_credentials" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "mame" VARCHAR(100),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_details" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "first_name" VARCHAR(50),
    "last_name" VARCHAR(50),
    "phone" VARCHAR(20),
    "date_of_birth" DATE,
    "gender" VARCHAR(10),
    "country" VARCHAR(100),
    "postal_code" VARCHAR(20),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_details_pkey" PRIMARY KEY ("id")
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
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "image_url" VARCHAR(255),
    "category_id" INTEGER,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
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
    "status" VARCHAR(50) NOT NULL DEFAULT 'open',
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
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
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

-- CreateIndex
CREATE UNIQUE INDEX "login_credentials_username_key" ON "login_credentials"("username");

-- CreateIndex
CREATE UNIQUE INDEX "login_credentials_email_key" ON "login_credentials"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_user_id_key" ON "user_details"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_details_phone_key" ON "user_details"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "project_proposals_project_id_freelancer_id_key" ON "project_proposals"("project_id", "freelancer_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_project_id_key" ON "reviews"("project_id");

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "login_credentials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_proposals" ADD CONSTRAINT "project_proposals_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewed_id_fkey" FOREIGN KEY ("reviewed_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
