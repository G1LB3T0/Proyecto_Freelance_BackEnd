-- CreateTable
CREATE TABLE "login_credentials" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "user_type" VARCHAR(20) NOT NULL,
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
CREATE TABLE "Event" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "category" VARCHAR(100),
    "status" VARCHAR(50),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "freelancer_skills_freelancer_id_skill_id_key" ON "freelancer_skills"("freelancer_id", "skill_id");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE INDEX "Event_user_id_idx" ON "Event"("user_id");

-- AddForeignKey
ALTER TABLE "user_details" ADD CONSTRAINT "user_details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_freelancer_id_fkey" FOREIGN KEY ("freelancer_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "freelancer_skills" ADD CONSTRAINT "freelancer_skills_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "login_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
