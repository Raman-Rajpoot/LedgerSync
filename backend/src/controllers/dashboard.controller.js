import {
  getDashboardData,
} from "../services/dashboard.service.js";


const getOrganizationId = (req) => {
  return req.user?.organizationId || req.organizationId;
};

export const getDashboard = async (req, res) => {
  try {
    const organizationId = getOrganizationId(req);
    console.log("id : ",organizationId)
    if (!organizationId) {
      return res.status(400).json({
        success: false,
        message:
          "Organization ID is required",
      });
    }

    const data =
      await getDashboardData(
        organizationId
      );

    return res.status(200).json({
      success: true,

      data,
    });

  } catch (error) {

    console.error(
      "Dashboard error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to load dashboard",

      error:
        process.env.NODE_ENV ===
        "development"
          ? error.message
          : undefined,
    });
  }
};