const Employee = require("../models/Employee");

/*
=========================================================
EMPLOYEE OWN-DATA ACCESS
=========================================================

Admin / HR:
    Can access the requested employee.

Employee:
    Can access ONLY the employee record linked to
    their User account.
=========================================================
*/

const employeeAccessMiddleware = async (
  req,
  res,
  next
) => {
  try {
    const requestedEmployeeId =
      req.params.employeeId || req.params.id;

    if (!requestedEmployeeId) {
      return res.status(400).json({
        message: "Employee ID is required",
      });
    }

    /*
    Admin and HR can access employee records according
    to their existing role permissions.
    */
    if (
      req.user.role === "Admin" ||
      req.user.role === "HR"
    ) {
      return next();
    }

    /*
    Employee must have a linked Employee ID.
    */
    if (!req.user.employeeId) {
      return res.status(403).json({
        message:
          "Your account is not linked to an employee profile",
      });
    }

    /*
    Compare the requested Employee ID with the
    Employee ID stored in the JWT.
    */
    if (
      String(req.user.employeeId) !==
      String(requestedEmployeeId)
    ) {
      return res.status(403).json({
        message:
          "You can only access your own employee information",
      });
    }

    /*
    Optional verification that the employee still exists.
    */
    const employeeExists = await Employee.exists({
      _id: req.user.employeeId,
    });

    if (!employeeExists) {
      return res.status(404).json({
        message: "Employee profile not found",
      });
    }

    next();
  } catch (error) {
    console.error(
      "Employee access error:",
      error
    );

    return res.status(500).json({
      message: "Error checking employee access",
    });
  }
};

module.exports = employeeAccessMiddleware;