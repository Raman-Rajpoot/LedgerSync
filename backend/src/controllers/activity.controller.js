import {prisma} from "../db/db.js";

export const getActivityLogs = async (
  req,
  res
) => {
  try {
    const {
      organizationId,
      page = 1,
      limit = 10,
      channel,
      status,
      search,
    } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "organizationId is required",
      });
    }

    const pageNumber =
      Math.max(Number(page), 1);

    const limitNumber =
      Math.min(
        Math.max(Number(limit), 1),
        100
      );

    const skip =
      (pageNumber - 1) *
      limitNumber;

    const where = {
      organizationId,
    };

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.content = {
        contains: search,
        mode: "insensitive",
      };
    }

    const [
      logs,
      total,
    ] = await Promise.all([

      prisma.escalationLog.findMany({
        where,

        include: {
          invoice: {
            include: {
              client: true,
            },
          },
        },

        orderBy: {
          sentAt: "desc",
        },

        skip,

        take: limitNumber,
      }),

      prisma.escalationLog.count({
        where,
      }),

    ]);

    const data = logs.map((log) => ({
      id: log.id,

      channel: log.channel,

      content: log.content,

      sentAt: log.sentAt,

      status:
        log.status || "SENT",

      subject:
        log.subject || null,

      templateName:
        log.templateName || null,

      client:
        log.invoice?.client
          ? {
              id:
                log.invoice.client.id,

              name:
                log.invoice.client.name,

              email:
                log.invoice.client.email,

              phone:
                log.invoice.client.phone,
            }
          : null,

      invoice:
        log.invoice
          ? {
              id:
                log.invoice.id,

              amount:
                log.invoice.amount,

              status:
                log.invoice.status,
            }
          : null,
    }));

    return res.status(200).json({
      success: true,

      data,

      pagination: {
        page: pageNumber,

        limit: limitNumber,

        total,

        totalPages:
          Math.ceil(
            total / limitNumber
          ),
      },
    });

  } catch (error) {
    console.error(
      "ACTIVITY LOG ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch activity logs",
    });
  }
};