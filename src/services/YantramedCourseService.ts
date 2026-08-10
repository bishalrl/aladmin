import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { storageService } from "@/lib/storage/StorageService";
import { projectService } from "@/services/ProjectService";

const PROJECT_SLUG = "yantramed";

export const HOME_YANTRAS = [
  {
    name: "Sri Yantra",
    slug: "sri-yantra",
    focus: "Prosperity / Focus & Clarity",
    sourceText: "Tantraraja Tantra",
    cycleIndex: 0,
    showOnHome: true,
    inCourse: true,
    sortOrder: 1,
  },
  {
    name: "Kali Yantra",
    slug: "kali-yantra",
    focus: "Transformation",
    sourceText: "Mahanirvana Tantra",
    cycleIndex: 1,
    showOnHome: true,
    inCourse: true,
    sortOrder: 2,
  },
  {
    name: "Durga Yantra",
    slug: "durga-yantra",
    focus: "Protection",
    sourceText: "Durga Saptashati",
    cycleIndex: 2,
    showOnHome: true,
    inCourse: true,
    sortOrder: 3,
  },
  {
    name: "Saraswati Yantra",
    slug: "saraswati-yantra",
    focus: "Knowledge",
    sourceText: "Sharada Tilaka",
    cycleIndex: 3,
    showOnHome: true,
    inCourse: true,
    sortOrder: 4,
  },
  {
    name: "Ganesha Yantra",
    slug: "ganesha-yantra",
    focus: "Obstacles",
    sourceText: "Ganesha Purana",
    cycleIndex: 4,
    showOnHome: true,
    inCourse: true,
    sortOrder: 5,
  },
  {
    name: "Tara Yantra",
    slug: "tara-yantra",
    focus: "Compassion",
    sourceText: "Tara Rahasya",
    cycleIndex: 5,
    showOnHome: true,
    inCourse: true,
    sortOrder: 6,
  },
] as const;

export const EXTRA_YANTRAS = [
  {
    name: "Lakshmi Yantra",
    slug: "lakshmi-yantra",
    focus: "Abundance",
    sourceText: "Geometry engine",
    cycleIndex: null,
    showOnHome: false,
    inCourse: false,
    sortOrder: 7,
  },
  {
    name: "Custom Yantra",
    slug: "custom-yantra",
    focus: "Custom",
    sourceText: "Geometry engine",
    cycleIndex: null,
    showOnHome: false,
    inCourse: false,
    sortOrder: 8,
  },
] as const;

/** Days 1–5 → 10, 6–10 → 13, … 26–30 → 25 */
export function durationMinutesForDay(dayNumber: number): number {
  if (dayNumber < 1 || dayNumber > 30) {
    throw new AppError("Day must be 1–30", "INVALID_DAY", 400);
  }
  const bucket = Math.ceil(dayNumber / 5); // 1..6
  return 10 + (bucket - 1) * 3;
}

export function cycleIndexForDay(dayNumber: number): number {
  return (dayNumber - 1) % 6;
}

function mapMusic(m: {
  id: string;
  title: string;
  description: string | null;
  dayNumber: number | null;
  audioPath: string;
  duration: number | null;
  sortOrder: number;
}) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    day_number: m.dayNumber,
    audio_url: storageService.getUrl(m.audioPath),
    duration: m.duration,
    sort_order: m.sortOrder,
  };
}

function mapMantra(m: {
  id: string;
  title: string;
  description: string | null;
  mantraHint: string | null;
  category: string | null;
  audioPath: string;
  duration: number | null;
  sortOrder: number;
  yantra?: { slug: string; name: string } | null;
}) {
  return {
    id: m.id,
    title: m.title,
    description: m.description,
    mantra_hint: m.mantraHint,
    category: m.category,
    audio_url: storageService.getUrl(m.audioPath),
    duration: m.duration,
    sort_order: m.sortOrder,
    yantra: m.yantra
      ? { slug: m.yantra.slug, name: m.yantra.name }
      : null,
  };
}

export class YantramedCourseService {
  async listYantras(options?: { homeOnly?: boolean }) {
    const project = await projectService.requireActiveBySlug(PROJECT_SLUG);
    const items = await prisma.yantramedYantra.findMany({
      where: {
        projectId: project.id,
        deletedAt: null,
        isActive: true,
        ...(options?.homeOnly ? { showOnHome: true } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return items.map((y) => ({
      id: y.id,
      name: y.name,
      slug: y.slug,
      focus: y.focus,
      source_text: y.sourceText,
      cycle_index: y.cycleIndex,
      show_on_home: y.showOnHome,
      in_course: y.inCourse,
      description: y.description,
    }));
  }

  async getYantraBySlug(slug: string) {
    const project = await projectService.requireActiveBySlug(PROJECT_SLUG);
    const yantra = await prisma.yantramedYantra.findFirst({
      where: {
        projectId: project.id,
        slug,
        deletedAt: null,
        isActive: true,
      },
    });
    if (!yantra) {
      throw new AppError("Yantra not found", "YANTRA_NOT_FOUND", 404);
    }

    const mantras = await prisma.yantramedMantra.findMany({
      where: {
        projectId: project.id,
        yantraId: yantra.id,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { yantra: { select: { slug: true, name: true } } },
    });

    return {
      id: yantra.id,
      name: yantra.name,
      slug: yantra.slug,
      focus: yantra.focus,
      source_text: yantra.sourceText,
      cycle_index: yantra.cycleIndex,
      show_on_home: yantra.showOnHome,
      in_course: yantra.inCourse,
      description: yantra.description,
      mantras: mantras.map(mapMantra),
    };
  }

  async listMantras(options?: { yantraSlug?: string; page?: number; limit?: number }) {
    const project = await projectService.requireActiveBySlug(PROJECT_SLUG);
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;

    let yantraId: string | undefined;
    if (options?.yantraSlug) {
      const yantra = await prisma.yantramedYantra.findFirst({
        where: {
          projectId: project.id,
          slug: options.yantraSlug,
          deletedAt: null,
        },
      });
      if (!yantra) {
        throw new AppError("Yantra not found", "YANTRA_NOT_FOUND", 404);
      }
      yantraId = yantra.id;
    }

    const where = {
      projectId: project.id,
      deletedAt: null,
      isActive: true,
      ...(yantraId ? { yantraId } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.yantramedMantra.findMany({
        where,
        orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: { yantra: { select: { slug: true, name: true } } },
      }),
      prisma.yantramedMantra.count({ where }),
    ]);

    return {
      items: items.map(mapMantra),
      total,
      page,
      limit,
    };
  }

  async listMusic(options?: { day?: number; page?: number; limit?: number }) {
    const project = await projectService.requireActiveBySlug(PROJECT_SLUG);
    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const where = {
      projectId: project.id,
      deletedAt: null,
      isActive: true,
      ...(options?.day != null ? { dayNumber: options.day } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.yantramedMusic.findMany({
        where,
        orderBy: [
          { dayNumber: "asc" },
          { sortOrder: "asc" },
          { createdAt: "desc" },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.yantramedMusic.count({ where }),
    ]);

    return {
      items: items.map(mapMusic),
      total,
      page,
      limit,
    };
  }

  async getCourseOutline() {
    const project = await projectService.requireActiveBySlug(PROJECT_SLUG);
    const days = await prisma.yantramedCourseDay.findMany({
      where: { projectId: project.id, deletedAt: null, isActive: true },
      orderBy: { dayNumber: "asc" },
      include: {
        yantra: true,
        music: true,
        mantra: true,
      },
    });

    return {
      total_days: 30,
      unlock: {
        mode: "sequential",
        start_day: 1,
        no_skipping: true,
        description:
          "Start at Day 1; finishing a day unlocks the next. No skipping ahead.",
      },
      yantra_rotation:
        "Days cycle Sri → Kali → Durga → Saraswati → Ganesha → Tara (day index % 6).",
      duration_ramp:
        "Days 1–5 → 10 min; 6–10 → 13; 11–15 → 16; 16–20 → 19; 21–25 → 22; 26–30 → 25.",
      days: days.map((d) => ({
        day: d.dayNumber,
        duration_minutes: d.durationMinutes,
        focus: d.focus,
        mantra_hint: d.mantraHint,
        allow_early_complete: d.allowEarlyComplete,
        yantra: {
          slug: d.yantra.slug,
          name: d.yantra.name,
          focus: d.yantra.focus,
          source_text: d.yantra.sourceText,
        },
        has_music: Boolean(d.musicId),
        has_mantra_audio: Boolean(d.mantraId),
      })),
    };
  }

  async getCourseDay(dayNumber: number) {
    const day = await this.loadCourseDay(dayNumber);
    const music = await this.resolveDayMusic(day.projectId, dayNumber, day.music);
    const mantra = day.mantra
      ? day.mantra
      : await this.resolveDayMantra(day.projectId, day.yantraId);

    return {
      day: day.dayNumber,
      duration_minutes: day.durationMinutes,
      focus: day.focus,
      mantra_hint: day.mantraHint,
      allow_early_complete: day.allowEarlyComplete,
      unlock: {
        requires_previous_day_complete: dayNumber > 1,
        previous_day: dayNumber > 1 ? dayNumber - 1 : null,
        unlocks_next_day: dayNumber < 30 ? dayNumber + 1 : null,
      },
      yantra: {
        id: day.yantra.id,
        name: day.yantra.name,
        slug: day.yantra.slug,
        focus: day.yantra.focus,
        source_text: day.yantra.sourceText,
        cycle_index: day.yantra.cycleIndex,
      },
      music: music ? mapMusic(music) : null,
      mantra: mantra ? mapMantra(mantra) : null,
      meditation: {
        loop_yantra_for_full_timer: true,
        timer_minutes: day.durationMinutes,
      },
      /**
       * Mobile day session (same every day):
       * opening mantra → day music → closing mantra (same audio) → mark day complete in Firebase.
       * There are only 6 mantras (one per yantra); days reuse the yantra's mantra. Music is per day.
       */
      flow: {
        step_1_opening_mantra: "GET /api/v1/yantramed/course/days/{day}/mantra",
        step_2_day_music: "GET /api/v1/yantramed/course/days/{day}/music",
        step_3_closing_mantra: "Replay the same mantra audio from step 1 (no second file)",
        step_4_day_complete: "Mark day complete in Firebase Auth/progress (not this API)",
      },
    };
  }

  /** Step 1 & 3 — same mantra audio (opening + closing) for this course day */
  async getCourseDayMantra(dayNumber: number) {
    const day = await this.loadCourseDay(dayNumber);
    const mantra = day.mantra
      ? day.mantra
      : await this.resolveDayMantra(day.projectId, day.yantraId);

    if (!mantra) {
      throw new AppError(
        "No mantra assigned for this course day yet",
        "MANTRA_NOT_FOUND",
        404,
      );
    }

    return {
      day: day.dayNumber,
      yantra: {
        name: day.yantra.name,
        slug: day.yantra.slug,
        focus: day.yantra.focus,
      },
      duration_minutes: day.durationMinutes,
      mantra_hint: day.mantraHint,
      allow_early_complete: day.allowEarlyComplete,
      mantra: mapMantra(mantra),
      role: "opening_and_closing",
      next: {
        after_opening_mantra: `/api/v1/yantramed/course/days/${day.dayNumber}/music`,
        after_closing_mantra: "mark_day_complete_in_firebase",
      },
    };
  }

  /** Step 2 — music for this course day (between opening and closing mantra) */
  async getCourseDayMusic(dayNumber: number) {
    const day = await this.loadCourseDay(dayNumber);
    const music = await this.resolveDayMusic(day.projectId, dayNumber, day.music);

    if (!music) {
      throw new AppError(
        "No music assigned for this course day yet",
        "MUSIC_NOT_FOUND",
        404,
      );
    }

    return {
      day: day.dayNumber,
      yantra: {
        name: day.yantra.name,
        slug: day.yantra.slug,
        focus: day.yantra.focus,
      },
      music: mapMusic(music),
      next: {
        after_music_complete: `/api/v1/yantramed/course/days/${day.dayNumber}/mantra`,
        note: "Replay the same mantra as closing, then mark day complete in Firebase.",
      },
    };
  }

  private async loadCourseDay(dayNumber: number) {
    if (dayNumber < 1 || dayNumber > 30) {
      throw new AppError("Day must be between 1 and 30", "INVALID_DAY", 400);
    }

    const project = await projectService.requireActiveBySlug(PROJECT_SLUG);
    const day = await prisma.yantramedCourseDay.findFirst({
      where: {
        projectId: project.id,
        dayNumber,
        deletedAt: null,
        isActive: true,
      },
      include: {
        yantra: true,
        music: true,
        mantra: { include: { yantra: { select: { slug: true, name: true } } } },
      },
    });

    if (!day) {
      throw new AppError("Course day not found", "COURSE_DAY_NOT_FOUND", 404);
    }

    return day;
  }

  private async resolveDayMusic(
    projectId: string,
    dayNumber: number,
    linked: {
      id: string;
      title: string;
      description: string | null;
      dayNumber: number | null;
      audioPath: string;
      duration: number | null;
      sortOrder: number;
    } | null,
  ) {
    if (linked) return linked;
    return prisma.yantramedMusic.findFirst({
      where: {
        projectId,
        dayNumber,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  private async resolveDayMantra(projectId: string, yantraId: string) {
    return prisma.yantramedMantra.findFirst({
      where: {
        projectId,
        yantraId,
        deletedAt: null,
        isActive: true,
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: { yantra: { select: { slug: true, name: true } } },
    });
  }
}

export const yantramedCourseService = new YantramedCourseService();
