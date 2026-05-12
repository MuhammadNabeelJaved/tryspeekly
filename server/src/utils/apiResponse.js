// Api response utility
// This utility provides a standardized way to send API responses in Express routes.
// It includes methods for sending success and error responses with appropriate status codes and messages.

class ApiResponse {
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }
    static error(res, message = 'Something went wrong', statusCode = 500) {
        return res.status(statusCode).json({
            success: false,
            message,
        });
    }
}

export default ApiResponse;