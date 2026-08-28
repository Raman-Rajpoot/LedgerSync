import { prisma } from "../db/db.js";


/* ==========================================
   GET PROFILE
========================================== */

export const getProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        fullName: true,
        organizationId: true,
      },
    });


    if (!user) {

      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    }


    const organization =
      await prisma.organization.findUnique({

        where: {
          id: user.organizationId,
        },

        select: {
          id: true,
          name: true,
        },

      });


    return res.status(200).json({

      success: true,

      data: {

        id: user.id,

        email: user.email,

        fullName: user.fullName,

        organizationId:
          user.organizationId,

        organizationName:
          organization?.name || "",

      },

    });


  } catch (error) {

    console.error(
      "GET PROFILE ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch profile",

    });

  }

};


/* ==========================================
   UPDATE PROFILE
========================================== */

export const updateProfile = async (req, res) => {

  try {

    const userId = req.user.id;

    const {
      fullName,
      email,
      organizationName,
    } = req.body;


    /* ======================================
       VALIDATION
    ====================================== */

    if (!fullName?.trim()) {

      return res.status(400).json({

        success: false,

        message:
          "Full name is required",

      });

    }


    if (!email?.trim()) {

      return res.status(400).json({

        success: false,

        message:
          "Email is required",

      });

    }


    /* ======================================
       CHECK EMAIL
    ====================================== */

    const existingUser =
      await prisma.user.findFirst({

        where: {

          email: email.trim(),

          NOT: {
            id: userId,
          },

        },

      });


    if (existingUser) {

      return res.status(409).json({

        success: false,

        message:
          "Email is already in use",

      });

    }


    /* ======================================
       CURRENT USER
    ====================================== */

    const currentUser =
      await prisma.user.findUnique({

        where: {
          id: userId,
        },

      });


    if (!currentUser) {

      return res.status(404).json({

        success: false,

        message:
          "User not found",

      });

    }


    /* ======================================
       UPDATE USER
    ====================================== */

    const updatedUser =
      await prisma.user.update({

        where: {
          id: userId,
        },

        data: {

          fullName:
            fullName.trim(),

          email:
            email.trim(),

        },

        select: {

          id: true,

          email: true,

          fullName: true,

          organizationId: true,

        },

      });


    /* ======================================
       UPDATE ORGANIZATION
    ====================================== */

    let organization;


    if (organizationName?.trim()) {

      organization =
        await prisma.organization.update({

          where: {
            id: currentUser.organizationId,
          },

          data: {

            name:
              organizationName.trim(),

          },

          select: {

            id: true,

            name: true,

          },

        });

    } else {

      organization =
        await prisma.organization.findUnique({

          where: {
            id: currentUser.organizationId,
          },

          select: {

            id: true,

            name: true,

          },

        });

    }


    /* ======================================
       RESPONSE
    ====================================== */

    return res.status(200).json({

      success: true,

      message:
        "Profile updated successfully",

      data: {

        id:
          updatedUser.id,

        email:
          updatedUser.email,

        fullName:
          updatedUser.fullName,

        organizationId:
          updatedUser.organizationId,

        organizationName:
          organization?.name || "",

      },

    });


  } catch (error) {

    console.error(
      "UPDATE PROFILE ERROR:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to update profile",

    });

  }

};