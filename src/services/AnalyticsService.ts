import { firebaseProjectManager } from "@/lib/firebase/FirebaseProjectManager";
import { prisma } from "@/lib/db/prisma";

export type MetricAvailability =
  | { available: true; value: number | null; note?: string }
  | { available: false; reason: string };

/**
 * Dashboard and content APIs stay on Postgres + local disk.
 * Firebase is optional and only used when an admin opens Users (or runs a live health check).
 * We intentionally do NOT load the Firebase Web/CDN script in this admin app.
 */
export class AnalyticsService {
  async getOverview(projectSlug: "budgeting-sathi" | "yantramed") {
    const configured = firebaseProjectManager.isConfigured(projectSlug);

    const unavailableGa = (metric: string): MetricAvailability => ({
      available: false,
      reason: `${metric} requires Google Analytics Data API (optional; not required for banners/media APIs)`,
    });

    return {
      projectSlug,
      firebaseStatus: configured ? "credentials_present" : "not_configured",
      metrics: {
        totalUsers: configured
          ? {
              available: false,
              reason:
                "Open the Users page to load Firebase Auth users on demand (keeps the server light)",
            }
          : {
              available: false,
              reason:
                "Optional: add Firebase Admin service account to list users. Banner/media APIs work without it.",
            },
        newUsers: unavailableGa("New users"),
        activeUsers: unavailableGa("Active users"),
        dailyActiveUsers: unavailableGa("DAU"),
        monthlyActiveUsers: unavailableGa("MAU"),
        sessions: unavailableGa("Sessions"),
        appEvents: unavailableGa("App events"),
        platformBreakdown: unavailableGa("Platform breakdown"),
        androidIosDistribution: unavailableGa("Android/iOS distribution"),
        userGrowth: unavailableGa("User growth"),
      },
    };
  }

  async getDashboardStats() {
    const [projects, activeBanners, activeMantras, activeMusic, pendingDeletions] =
      await Promise.all([
        prisma.project.count({ where: { deletedAt: null } }),
        prisma.bannerAd.count({
          where: { deletedAt: null, isActive: true },
        }),
        prisma.yantramedMantra.count({
          where: { deletedAt: null, isActive: true },
        }),
        prisma.yantramedMusic.count({
          where: { deletedAt: null, isActive: true },
        }),
        prisma.accountDeletionRequest.count({
          where: { status: "PENDING" },
        }),
      ]);

    // Live Firebase status so the dashboard shows real connection health
    const firebaseHealth = await firebaseProjectManager.checkAll({ live: true });

    const recentActivity = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        admin: { select: { name: true, email: true } },
        project: { select: { name: true, slug: true } },
      },
    });
    const recentUploads = await prisma.mediaFile.findMany({
      where: { deletedAt: null },
      take: 8,
      orderBy: { createdAt: "desc" },
    });
    const recentBanners = await prisma.bannerAd.findMany({
      where: { deletedAt: null },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { brand: true },
    });
    const apiStats = await prisma.apiRequestLog.groupBy({
      by: ["statusCode"],
      _count: true,
      where: {
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    return {
      cards: {
        totalApplications: projects,
        budgetingSathiUsers: {
          available: false as const,
          reason: "Open Budgeting Sathi → Users (on demand)",
        },
        yantraMedUsers: {
          available: false as const,
          reason: "Open YantraMed → Users (on demand)",
        },
        activeBannerAds: activeBanners,
        activeMantras,
        backgroundMusic: activeMusic,
        pendingDeletions,
      },
      firebaseHealth,
      recentActivity,
      recentUploads,
      recentBanners,
      apiRequestStats24h: apiStats,
      systemHealth: {
        database: "ok",
        storage: "ok",
        env: process.env.APP_ENV ?? "local",
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
