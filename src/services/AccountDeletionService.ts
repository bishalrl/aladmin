import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/api/response";
import { DeletionRequestStatus, Prisma } from "@prisma/client";
import { projectService } from "@/services/ProjectService";
import { auditLogService } from "@/services/AuditLogService";
import {
  budgetingSathiFirebaseService,
  yantraMedFirebaseService,
} from "@/lib/firebase/FirebaseUserService";
import {
  firebaseProjectManager,
  FirebaseProjectKey,
} from "@/lib/firebase/FirebaseProjectManager";

function firebaseForSlug(slug: string) {
  if (slug === "budgeting-sathi") return budgetingSathiFirebaseService;
  if (slug === "yantramed") return yantraMedFirebaseService;
  throw new AppError("Unsupported project", "PROJECT_NOT_SUPPORTED", 400);
}

function keyForSlug(slug: string): FirebaseProjectKey {
  if (slug === "budgeting-sathi") return "budgeting-sathi";
  if (slug === "yantramed") return "yantramed";
  throw new AppError("Unsupported project", "PROJECT_NOT_SUPPORTED", 400);
}

export class AccountDeletionService {
  /**
   * Soft request only — no Firebase call (keeps the server light).
   * Project is always explicit so Budgeting Sathi and YantraMed never mix.
   */
  async submitRequest(
    projectSlug: string,
    data: { email: string; reason?: string },
    ip?: string,
  ) {
    const project = await projectService.getBySlug(projectSlug);

    const request = await prisma.accountDeletionRequest.create({
      data: {
        projectId: project.id,
        email: data.email.toLowerCase(),
        firebaseUid: null,
        reason: data.reason || null,
        status: DeletionRequestStatus.PENDING,
      },
    });

    await auditLogService.log({
      action: "account_deletion.requested",
      resourceType: "account_deletion_request",
      resourceId: request.id,
      projectId: project.id,
      ipAddress: ip,
      metadata: { emailDomain: data.email.split("@")[1] ?? null },
    });

    return {
      id: request.id,
      status: request.status,
      message:
        "Your deletion request has been submitted and will be reviewed by an administrator.",
    };
  }

  async list(params?: {
    status?: DeletionRequestStatus;
    page?: number;
    limit?: number;
  }) {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const where = {
      ...(params?.status ? { status: params.status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.accountDeletionRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          project: { select: { id: true, name: true, slug: true } },
          reviewedBy: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.accountDeletionRequest.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async review(
    id: string,
    action: "approve" | "reject" | "complete_manual",
    adminId: string,
    adminNotes?: string,
    ip?: string,
  ) {
    const request = await prisma.accountDeletionRequest.findUnique({
      where: { id },
      include: { project: true },
    });
    if (!request) {
      throw new AppError("Request not found", "DELETION_REQUEST_NOT_FOUND", 404);
    }
    if (request.status !== DeletionRequestStatus.PENDING) {
      throw new AppError(
        "Only pending requests can be reviewed",
        "INVALID_STATUS",
        400,
      );
    }

    if (action === "reject") {
      const updated = await prisma.accountDeletionRequest.update({
        where: { id },
        data: {
          status: DeletionRequestStatus.REJECTED,
          adminNotes: adminNotes || null,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      });
      await auditLogService.log({
        adminId,
        action: "account_deletion.rejected",
        resourceType: "account_deletion_request",
        resourceId: id,
        projectId: request.projectId,
        ipAddress: ip,
      });
      return updated;
    }

    // Mark done after you deleted the user in Firebase Console (no Admin SDK call)
    if (action === "complete_manual") {
      return this.markCompleted(request, adminId, adminNotes, ip, {
        mode: "manual",
        projectKey: keyForSlug(request.project.slug),
      });
    }

    // Optional automatic Firebase Auth delete (only if Admin credentials exist)
    const projectKey = keyForSlug(request.project.slug);
    if (!firebaseProjectManager.isConfigured(projectKey)) {
      throw new AppError(
        "Firebase Admin is not configured. Delete the user in Firebase Console, then use “Mark completed”.",
        "FIREBASE_NOT_CONFIGURED",
        503,
      );
    }

    const firebase = firebaseForSlug(request.project.slug);
    let uid = request.firebaseUid;
    const user = await firebase.getUserByEmail(request.email);
    uid = user?.uid ?? uid;

    if (uid) {
      await firebase.deleteUser(uid);
      await this.deleteProjectSpecificData(projectKey, uid, request.email);
    }

    return this.markCompleted(request, adminId, adminNotes, ip, {
      mode: "firebase_admin",
      projectKey,
      hadFirebaseUser: Boolean(uid),
      uid,
    });
  }

  private async markCompleted(
    request: {
      id: string;
      projectId: string;
      firebaseUid: string | null;
    },
    adminId: string,
    adminNotes: string | undefined,
    ip: string | undefined,
    meta: Prisma.InputJsonObject,
  ) {
    const updated = await prisma.accountDeletionRequest.update({
      where: { id: request.id },
      data: {
        status: DeletionRequestStatus.COMPLETED,
        adminNotes: adminNotes || null,
        reviewedById: adminId,
        reviewedAt: new Date(),
        completedAt: new Date(),
        firebaseUid:
          typeof meta.uid === "string" ? meta.uid : request.firebaseUid,
        email: `[deleted:${request.id.slice(0, 8)}]`,
        reason: null,
      },
    });

    await auditLogService.log({
      adminId,
      action: "account_deletion.completed",
      resourceType: "account_deletion_request",
      resourceId: request.id,
      projectId: request.projectId,
      ipAddress: ip,
      metadata: meta,
    });

    return updated;
  }

  private async deleteProjectSpecificData(
    projectKey: FirebaseProjectKey,
    _uid: string,
    _email: string,
  ) {
    void projectKey;
  }
}

export const accountDeletionService = new AccountDeletionService();
