import { prisma } from "../db/db.js";

const getOrgId = (req) => req.user?.organizationId ?? req.organizationId;

// =====================================================
// GET ORGANIZATION
// GET /api/organization
// =====================================================

export const getOrganization = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: organization,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch organization.",
    });
  }
};

// =====================================================
// CREATE ORGANIZATION
// POST /api/organization/create
// =====================================================

export const createOrganization = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      logo,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Organization name is required.",
      });
    }

    const organization = await prisma.organization.create({
      data: {
        name,
        email,
        phone,
        logo,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Organization created successfully.",
      data: organization,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to create organization.",
    });
  }
};

// =====================================================
// UPDATE ORGANIZATION
// PATCH /api/organization/update
// =====================================================

export const updateOrganization = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    const existing = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    const {
      name,
      email,
      phone,
      logo,
      plan,
      status,
    } = req.body;

    const organization = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(logo !== undefined && { logo }),
        ...(plan !== undefined && { plan }),
        ...(status !== undefined && { status }),
      },
    });

    return res.status(200).json({
      success: true,
      message: "Organization updated successfully.",
      data: organization,
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update organization.",
    });
  }
};

// =====================================================
// DELETE ORGANIZATION
// DELETE /api/organization/delete
// =====================================================

export const deleteOrganization = async (req, res) => {
  try {
    const organizationId = getOrgId(req);

    const existing = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Organization not found.",
      });
    }

    await prisma.organization.delete({
      where: {
        id: organizationId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Organization deleted successfully.",
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete organization.",
    });
  }
};