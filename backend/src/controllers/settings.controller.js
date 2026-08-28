import {prisma} from "../db/db.js";

export const getSettings = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const organization =
      await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found",
      });
    }

    return res.status(200).json({
      success: true,

      data: {
        organizationName:
          organization.name || "",

        phone:
          organization.phone || "",

        gstin:
          organization.gstin || "",

        address:
          organization.address || "",
      },
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch settings",
    });
  }
};


export const updateSettings = async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message: "organizationId is required",
      });
    }

    const {
      organizationName,
      phone,
      gstin,
      address,
    } = req.body;

    const organization =
      await prisma.organization.update({
        where: {
          id: organizationId,
        },

        data: {
          name: organizationName,
          phone,
          gstin,
          address,
        },
      });

    return res.status(200).json({
      success: true,

      message: "Settings updated successfully",

      data: organization,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update settings",
    });
  }
};