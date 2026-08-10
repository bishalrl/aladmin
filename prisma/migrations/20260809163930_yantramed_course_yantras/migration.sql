-- AlterTable
ALTER TABLE "yantramed_mantras" ADD COLUMN     "mantra_hint" TEXT,
ADD COLUMN     "yantra_id" TEXT;

-- AlterTable
ALTER TABLE "yantramed_music" ADD COLUMN     "day_number" INTEGER;

-- CreateTable
CREATE TABLE "yantramed_yantras" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "cycle_index" INTEGER,
    "show_on_home" BOOLEAN NOT NULL DEFAULT false,
    "in_course" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "yantramed_yantras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "yantramed_course_days" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "day_number" INTEGER NOT NULL,
    "yantra_id" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "focus" TEXT NOT NULL,
    "mantra_hint" TEXT NOT NULL,
    "music_id" TEXT,
    "mantra_id" TEXT,
    "allow_early_complete" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "yantramed_course_days_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "yantramed_yantras_project_id_show_on_home_sort_order_idx" ON "yantramed_yantras"("project_id", "show_on_home", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "yantramed_yantras_project_id_slug_key" ON "yantramed_yantras"("project_id", "slug");

-- CreateIndex
CREATE INDEX "yantramed_course_days_project_id_is_active_idx" ON "yantramed_course_days"("project_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "yantramed_course_days_project_id_day_number_key" ON "yantramed_course_days"("project_id", "day_number");

-- CreateIndex
CREATE INDEX "yantramed_mantras_yantra_id_idx" ON "yantramed_mantras"("yantra_id");

-- CreateIndex
CREATE INDEX "yantramed_music_project_id_day_number_idx" ON "yantramed_music"("project_id", "day_number");

-- AddForeignKey
ALTER TABLE "yantramed_yantras" ADD CONSTRAINT "yantramed_yantras_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yantramed_mantras" ADD CONSTRAINT "yantramed_mantras_yantra_id_fkey" FOREIGN KEY ("yantra_id") REFERENCES "yantramed_yantras"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yantramed_course_days" ADD CONSTRAINT "yantramed_course_days_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yantramed_course_days" ADD CONSTRAINT "yantramed_course_days_yantra_id_fkey" FOREIGN KEY ("yantra_id") REFERENCES "yantramed_yantras"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yantramed_course_days" ADD CONSTRAINT "yantramed_course_days_music_id_fkey" FOREIGN KEY ("music_id") REFERENCES "yantramed_music"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "yantramed_course_days" ADD CONSTRAINT "yantramed_course_days_mantra_id_fkey" FOREIGN KEY ("mantra_id") REFERENCES "yantramed_mantras"("id") ON DELETE SET NULL ON UPDATE CASCADE;
